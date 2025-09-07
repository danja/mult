import { SceneManager } from './scene-manager';
import { InputControls } from './input-controls';
import { multiverseDataService } from '@/data';
import type { 
  UIState, 
  CameraControls, 
  NodeClickEvent, 
  LayerToggleEvent,
  RDFQueryResult 
} from '@/types';
import { DEFAULT_CAMERA_SETTINGS, VISUALIZATION_CONFIG } from '@/config';

export class MultiverseVisualization {
  private sceneManager: SceneManager;
  private inputControls: InputControls;
  private container: HTMLElement;
  private animationId: number | null = null;
  private frameCounter = 0;
  
  // Event handlers
  private eventHandlers: {
    onNodeClick?: (event: NodeClickEvent) => void;
    onLayerToggle?: (event: LayerToggleEvent) => void;
    onDataLoaded?: (data: RDFQueryResult) => void;
    onError?: (error: Error) => void;
  } = {};

  // State
  private uiState: UIState = {
    animating: true,
    labelMode: 'smart',
    showVerticalConnections: true,
    layersVisible: {},
    performanceMode: true,
  };

  private cameraControls: CameraControls = {
    radius: DEFAULT_CAMERA_SETTINGS.radius,
    theta: DEFAULT_CAMERA_SETTINGS.theta,
    phi: DEFAULT_CAMERA_SETTINGS.phi,
  };

  private data: RDFQueryResult | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.sceneManager = new SceneManager(container);
    
    // Initialize input controls (touch, mouse, keyboard)
    this.inputControls = new InputControls(
      this.sceneManager.renderer.domElement,
      this.cameraControls,
      (controls) => {
        this.cameraControls = controls;
        this.sceneManager.positionCamera(controls);
      }
    );

    // Set initial camera position
    this.sceneManager.positionCamera(this.cameraControls);
    
    // Start animation loop
    this.startAnimation();
  }

  /**
   * Initialize the visualization with data
   */
  async initialize(dataSource = '/universe.ttl'): Promise<void> {
    try {
      // Load RDF data
      this.data = await multiverseDataService.loadData(dataSource);
      
      // Initialize layer visibility state
      Object.keys(this.data.layers).forEach(layerName => {
        this.uiState.layersVisible[layerName] = true;
      });
      
      // Build visualization
      this.sceneManager.buildVisualization(
        this.data.nodes,
        this.data.layers,
        this.data.triples,
        this.data.sharedConnections
      );
      
      // Set initial states
      this.sceneManager.setVerticalConnectionsVisibility(this.uiState.showVerticalConnections);
      this.sceneManager.setPerformanceMode(this.uiState.performanceMode);
      
      // Trigger data loaded event
      if (this.eventHandlers.onDataLoaded) {
        this.eventHandlers.onDataLoaded(this.data);
      }
      
      console.log('Multiverse visualization initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize visualization:', error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
      throw error;
    }
  }

  /**
   * Start the animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Animate nodes if enabled
      if (this.uiState.animating) {
        this.sceneManager.animateNodes();
      }
      
      // Throttle expensive operations
      this.frameCounter = (this.frameCounter + 1) % VISUALIZATION_CONFIG.updateEvery;
      if (this.frameCounter === 0) {
        this.sceneManager.updateLabels(this.uiState);
      }
      
      // Render the scene
      this.sceneManager.render();
    };
    
    animate();
  }

  /**
   * Stop the animation loop
   */
  private stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Toggle animation on/off
   */
  toggleAnimation(): void {
    this.uiState.animating = !this.uiState.animating;
  }

  /**
   * Set label mode
   */
  setLabelMode(mode: UIState['labelMode']): void {
    this.uiState.labelMode = mode;
  }

  /**
   * Toggle layer visibility
   */
  toggleLayer(layerName: string): void {
    if (!this.data?.layers[layerName]) {
      console.warn(`Layer ${layerName} not found`);
      return;
    }
    
    const isVisible = this.uiState.layersVisible[layerName];
    this.uiState.layersVisible[layerName] = !isVisible;
    
    const opacity = this.uiState.layersVisible[layerName] ? 1 : 0.06;
    this.sceneManager.setLayerOpacity(layerName, opacity);
    
    if (this.eventHandlers.onLayerToggle) {
      this.eventHandlers.onLayerToggle({
        layerName,
        visible: this.uiState.layersVisible[layerName]
      });
    }
  }

  /**
   * Toggle vertical connections visibility
   */
  toggleVerticalConnections(): void {
    this.uiState.showVerticalConnections = !this.uiState.showVerticalConnections;
    this.sceneManager.setVerticalConnectionsVisibility(this.uiState.showVerticalConnections);
  }

  /**
   * Toggle performance mode
   */
  togglePerformanceMode(): void {
    this.uiState.performanceMode = !this.uiState.performanceMode;
    this.sceneManager.setPerformanceMode(this.uiState.performanceMode);
  }

  /**
   * Reset camera to default position
   */
  resetCamera(): void {
    this.inputControls.reset();
  }

  /**
   * Move camera to top-down view
   */
  setTopView(): void {
    this.inputControls.setTopView();
  }

  /**
   * Get current UI state
   */
  getUIState(): UIState {
    return { ...this.uiState };
  }

  /**
   * Get current camera controls
   */
  getCameraControls(): CameraControls {
    return this.inputControls.getControls();
  }

  /**
   * Get loaded data
   */
  getData(): RDFQueryResult | null {
    return this.data;
  }

  /**
   * Get data statistics
   */
  getDataStats() {
    return multiverseDataService.getDataStats();
  }

  /**
   * Refresh data from source
   */
  async refreshData(dataSource = '/universe.ttl'): Promise<void> {
    await this.initialize(dataSource);
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: Partial<typeof this.eventHandlers>): void {
    Object.assign(this.eventHandlers, handlers);
  }

  /**
   * Resize handler
   */
  handleResize(): void {
    // The scene manager handles resize internally
    // This method is provided for external resize handling if needed
  }

  /**
   * Get layer names
   */
  getLayerNames(): string[] {
    return this.data ? Object.keys(this.data.layers) : [];
  }

  /**
   * Get layer info
   */
  getLayerInfo(layerName: string) {
    if (!this.data?.layers[layerName]) return null;
    
    const layer = this.data.layers[layerName];
    const nodes = this.data.nodes.filter(node => node.layer === layerName);
    
    return {
      ...layer,
      nodeCount: nodes.length,
      characters: nodes.filter(n => n.type === 'character').length,
      movies: nodes.filter(n => n.type === 'movie').length,
      visible: this.uiState.layersVisible[layerName] ?? true,
    };
  }

  /**
   * Switch to a different dataset with a specific configuration
   */
  async switchDataset(configurationId: string, dataSource: string): Promise<void> {
    try {
      // Load data with the specified configuration
      this.data = await multiverseDataService.loadDataWithConfiguration(dataSource, configurationId);
      
      // Reset layer visibility state
      this.uiState.layersVisible = {};
      Object.keys(this.data.layers).forEach(layerName => {
        this.uiState.layersVisible[layerName] = true;
      });
      
      // Clear existing visualization and rebuild
      this.sceneManager.clearVisualization();
      this.sceneManager.buildVisualization(
        this.data.nodes,
        this.data.layers,
        this.data.triples,
        this.data.sharedConnections
      );
      
      // Restore states
      this.sceneManager.setVerticalConnectionsVisibility(this.uiState.showVerticalConnections);
      this.sceneManager.setPerformanceMode(this.uiState.performanceMode);
      
      // Reset camera to default position
      this.cameraControls = {
        radius: DEFAULT_CAMERA_SETTINGS.radius,
        theta: DEFAULT_CAMERA_SETTINGS.theta,
        phi: DEFAULT_CAMERA_SETTINGS.phi,
      };
      this.sceneManager.positionCamera(this.cameraControls);
      
      // Trigger data loaded event
      if (this.eventHandlers.onDataLoaded) {
        this.eventHandlers.onDataLoaded(this.data);
      }
      
      console.log(`Successfully switched to dataset: ${configurationId} from ${dataSource}`);
      
    } catch (error) {
      console.error('Failed to switch dataset:', error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(error instanceof Error ? error : new Error('Failed to switch dataset'));
      }
      throw error;
    }
  }

  /**
   * Export current state for debugging
   */
  exportState() {
    return {
      uiState: this.uiState,
      cameraControls: this.cameraControls,
      dataStats: this.getDataStats(),
      layerInfo: this.getLayerNames().map(name => this.getLayerInfo(name)),
    };
  }

  /**
   * Dispose of the visualization and cleanup resources
   */
  dispose(): void {
    this.stopAnimation();
    this.inputControls.dispose();
    this.sceneManager.dispose();
  }
}