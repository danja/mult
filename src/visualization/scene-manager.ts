import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import type { 
  MultiverseNode, 
  MultiverseLayer, 
  MultiverseTriple, 
  SharedConnection,
  VisualizationNode,
  VisualizationEdge,
  UIState,
  CameraControls
} from '@/types';
import { 
  VISUALIZATION_CONFIG, 
  DEFAULT_CAMERA_SETTINGS, 
  BLOOM_SETTINGS, 
  LAYER_SETTINGS 
} from '@/config';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer: EffectComposer;
  public renderPass: RenderPass;
  public bloomPass: UnrealBloomPass;
  
  private container: HTMLElement;
  private haloTexture: THREE.Texture;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  // Scene objects
  private layerGroups: Record<string, THREE.Group> = {};
  private allNodes: VisualizationNode[] = [];
  private edges: VisualizationEdge[] = [];
  private nodeLabels: HTMLElement[] = [];
  private verticalConnections: THREE.Mesh[] = [];
  
  // Animation state
  private animationFrame: number | null = null;
  private frameCounter = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.initializeScene();
    this.initializeRenderer();
    this.initializePostProcessing();
    this.createHaloTexture();
    this.setupEventListeners();
  }

  /**
   * Initialize the Three.js scene
   */
  private initializeScene(): void {
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(
      DEFAULT_CAMERA_SETTINGS.fov,
      window.innerWidth / window.innerHeight,
      DEFAULT_CAMERA_SETTINGS.near,
      DEFAULT_CAMERA_SETTINGS.far
    );
  }

  /**
   * Initialize the WebGL renderer
   */
  private initializeRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    
    this.renderer.setPixelRatio(VISUALIZATION_CONFIG.dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Initialize post-processing effects
   */
  private initializePostProcessing(): void {
    this.composer = new EffectComposer(this.renderer);
    
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      BLOOM_SETTINGS.strength,
      BLOOM_SETTINGS.radius,
      BLOOM_SETTINGS.threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  /**
   * Create halo texture for node effects
   */
  private createHaloTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d')!;
    
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    
    this.haloTexture = new THREE.CanvasTexture(canvas);
    this.haloTexture.minFilter = THREE.LinearFilter;
  }

  /**
   * Set up event listeners for mouse and resize
   */
  private setupEventListeners(): void {
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  /**
   * Build the visualization from data
   */
  buildVisualization(
    nodes: MultiverseNode[],
    layers: Record<string, MultiverseLayer>,
    triples: MultiverseTriple[],
    sharedConnections: SharedConnection[]
  ): void {
    this.clearScene();
    
    this.createLayerSlabs(layers);
    this.createNodes(nodes, layers);
    this.createEdges(triples, layers);
    this.createVerticalConnections(sharedConnections, nodes);
    
    console.log('Visualization built:', {
      nodes: this.allNodes.length,
      edges: this.edges.length,
      connections: this.verticalConnections.length
    });
  }

  /**
   * Clear the scene of all visualization objects
   */
  private clearScene(): void {
    // Remove all layer groups
    Object.values(this.layerGroups).forEach(group => {
      this.scene.remove(group);
    });
    this.layerGroups = {};
    
    // Remove edge labels before clearing edges array
    this.edges.forEach(edge => {
      if (edge.labelDiv && edge.labelDiv.parentNode) {
        edge.labelDiv.parentNode.removeChild(edge.labelDiv);
      }
    });
    
    // Clear arrays
    this.allNodes.length = 0;
    this.edges.length = 0;
    this.verticalConnections.length = 0;
    
    // Remove node labels
    this.nodeLabels.forEach(label => {
      if (label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    this.nodeLabels.length = 0;
  }

  /**
   * Create layer visualization slabs
   */
  private createLayerSlabs(layers: Record<string, MultiverseLayer>): void {
    for (const [key, layer] of Object.entries(layers)) {
      const layerGroup = new THREE.Group();
      this.scene.add(layerGroup);
      this.layerGroups[key] = layerGroup;
      
      const { height, color } = layer;
      const { slabSize, slabThickness, planeOpacity } = LAYER_SETTINGS;
      
      const barMaterial = this.createNeonMaterial(color, 0.8);
      
      // Create frame bars
      const bars = [
        [new THREE.BoxGeometry(slabSize, slabThickness, slabThickness), [0, height, slabSize / 2]],
        [new THREE.BoxGeometry(slabSize, slabThickness, slabThickness), [0, height, -slabSize / 2]],
        [new THREE.BoxGeometry(slabThickness, slabThickness, slabSize), [slabSize / 2, height, 0]],
        [new THREE.BoxGeometry(slabThickness, slabThickness, slabSize), [-slabSize / 2, height, 0]],
      ] as const;
      
      bars.forEach(([geometry, position]) => {
        const mesh = new THREE.Mesh(geometry, barMaterial);
        mesh.position.set(...position);
        this.scene.add(mesh);
      });
      
      // Create transparent plane
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(slabSize, slabSize),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: planeOpacity,
          side: THREE.DoubleSide
        })
      );
      plane.position.y = height;
      plane.rotation.x = -Math.PI / 2;
      this.scene.add(plane);
    }
  }

  /**
   * Create node visualizations
   */
  private createNodes(nodes: MultiverseNode[], layers: Record<string, MultiverseLayer>): void {
    const nodeMap = new Map<string, VisualizationNode>();
    
    nodes.forEach(node => {
      const layer = layers[node.layer];
      if (!layer) {
        console.warn(`Layer ${node.layer} not found for node ${node.id}`);
        return;
      }
      
      // Create sphere mesh
      const geometry = new THREE.SphereGeometry(
        LAYER_SETTINGS.nodeRadius,
        LAYER_SETTINGS.nodeSphereDetail.widthSegments,
        LAYER_SETTINGS.nodeSphereDetail.heightSegments
      );
      const material = this.createNeonMaterial(layer.color, 0.95);
      const mesh = new THREE.Mesh(geometry, material);
      
      // Position node on its layer surface with proper distribution
      // Use much larger scaling to spread nodes across the full layer surface (16x16 units)
      const scaledX = Math.max(-7.5, Math.min(7.5, node.x * 3.5)); // Increased scaling for better spread
      const scaledZ = Math.max(-7.5, Math.min(7.5, node.z * 3.5)); // Increased scaling for better spread
      mesh.position.set(scaledX, layer.height, scaledZ);
      mesh.userData = node;
      this.scene.add(mesh);
      
      // Create halo effect
      if (VISUALIZATION_CONFIG.halos) {
        const haloMaterial = new THREE.SpriteMaterial({
          map: this.haloTexture,
          color: layer.color,
          transparent: true,
          blending: THREE.AdditiveBlending
        });
        const haloSprite = new THREE.Sprite(haloMaterial);
        haloSprite.scale.set(LAYER_SETTINGS.haloScale, LAYER_SETTINGS.haloScale, 1);
        haloSprite.position.copy(mesh.position);
        this.scene.add(haloSprite);
      }
      
      const vizNode: VisualizationNode = {
        userData: node,
        position: mesh.position,
        material
      };
      
      this.allNodes.push(vizNode);
      nodeMap.set(node.id, vizNode);
      
      // Create label
      this.createNodeLabel(node, mesh.position);
    });
  }

  /**
   * Create node labels
   */
  private createNodeLabel(node: MultiverseNode, position: THREE.Vector3): void {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label3d';
    labelDiv.textContent = node.subtitle ? `${node.label} — ${node.subtitle}` : node.label;
    (labelDiv as any).userData = { position: position.clone() };
    document.body.appendChild(labelDiv);
    this.nodeLabels.push(labelDiv);
  }

  /**
   * Create edge visualizations
   */
  private createEdges(triples: MultiverseTriple[], layers: Record<string, MultiverseLayer>): void {
    const nodeMap = new Map<string, VisualizationNode>();
    this.allNodes.forEach(node => nodeMap.set(node.userData.id, node));
    
    triples.forEach(triple => {
      const sourceNode = nodeMap.get(triple.subject);
      const targetNode = nodeMap.get(triple.object);
      
      if (!sourceNode || !targetNode) {
        console.warn(`Missing nodes for triple: ${triple.subject} -> ${triple.object}`);
        return;
      }
      
      const layer = layers[triple.layer];
      if (!layer) {
        console.warn(`Layer ${triple.layer} not found for triple`);
        return;
      }
      
      const curve = new THREE.QuadraticBezierCurve3(
        sourceNode.position.clone(),
        new THREE.Vector3(
          (sourceNode.position.x + targetNode.position.x) / 2,
          (sourceNode.position.y + targetNode.position.y) / 2 + 0.8,
          (sourceNode.position.z + targetNode.position.z) / 2
        ),
        targetNode.position.clone()
      );
      
      const tubeGeometry = new THREE.TubeGeometry(
        curve,
        VISUALIZATION_CONFIG.edgeSegments,
        LAYER_SETTINGS.tubeRadius,
        LAYER_SETTINGS.tubeRadialSegments,
        false
      );
      const tubeMaterial = this.createNeonMaterial(layer.color, 0.9);
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      this.scene.add(tube);
      
      // Create edge label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'label3d edge-pill';
      labelDiv.innerHTML = `<span>${sourceNode.userData.label}</span> <span class="arrow">—[${triple.predicate.split('/').pop()}]→</span> <span>${targetNode.userData.label}</span>`;
      document.body.appendChild(labelDiv);
      
      const edge: VisualizationEdge = {
        curve,
        tube,
        labelDiv
      };
      
      this.edges.push(edge);
    });
  }

  /**
   * Create vertical connections for shared entities
   */
  private createVerticalConnections(connections: SharedConnection[], nodes: MultiverseNode[]): void {
    const nodeMap = new Map<string, MultiverseNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    connections.forEach(connection => {
      const nodeA = nodeMap.get(connection.id);
      const nodeB = nodeMap.get(connection.connectTo);
      
      if (!nodeA || !nodeB) {
        console.warn(`Missing nodes for connection: ${connection.id} -> ${connection.connectTo}`);
        return;
      }
      
      const minY = Math.min(nodeA.y, nodeB.y);
      const maxY = Math.max(nodeA.y, nodeB.y);
      const height = maxY - minY;
      
      const geometry = new THREE.CylinderGeometry(
        LAYER_SETTINGS.verticalColumnRadius,
        LAYER_SETTINGS.verticalColumnRadius,
        height,
        LAYER_SETTINGS.verticalColumnSegments
      );
      const material = this.createNeonMaterial(0x39FF14, 0.75); // Green color
      const cylinder = new THREE.Mesh(geometry, material);
      
      cylinder.position.set(nodeA.x, minY + height / 2, nodeA.z);
      this.scene.add(cylinder);
      this.verticalConnections.push(cylinder);
    });
  }

  /**
   * Create neon material for visualization elements
   */
  private createNeonMaterial(color: number, opacity: number = 0.9): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  /**
   * Position camera based on controls
   */
  positionCamera(controls: CameraControls): void {
    const { radius, theta, phi } = controls;
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.cos(theta);
    const z = radius * Math.sin(theta) * Math.sin(phi);
    
    this.camera.position.set(x, y, z);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 9, 0);
  }

  /**
   * Update labels based on camera position and UI state
   */
  updateLabels(uiState: UIState): void {
    const cam = this.camera;
    
    this.nodeLabels.forEach(label => {
      const position = (label as any).userData?.position;
      if (!position || uiState.labelMode === 'none') {
        label.style.display = 'none';
        return;
      }
      
      if (uiState.labelMode === 'smart' && cam.position.distanceTo(position) > VISUALIZATION_CONFIG.labelSmartDistance) {
        label.style.display = 'none';
        return;
      }
      
      const vector = position.clone();
      vector.project(cam);
      
      if (vector.z < -1 || vector.z > 1) {
        label.style.display = 'none';
        return;
      }
      
      label.style.left = ((vector.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      label.style.top = ((-vector.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      label.style.display = 'block';
    });
    
    this.edges.forEach(edge => {
      if (uiState.labelMode === 'none') {
        edge.labelDiv.style.display = 'none';
        return;
      }
      
      const position = edge.curve.getPoint(0.6).clone();
      position.project(cam);
      
      if (position.z < -1 || position.z > 1) {
        edge.labelDiv.style.display = 'none';
        return;
      }
      
      edge.labelDiv.style.left = ((position.x * 0.5 + 0.5) * window.innerWidth) + 'px';
      edge.labelDiv.style.top = ((-position.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      edge.labelDiv.style.display = 'block';
    });
  }

  /**
   * Animate nodes with floating effect
   */
  animateNodes(): void {
    if (this.allNodes.length === 0) return;
    
    const time = Date.now() * 0.001;
    
    this.allNodes.forEach((node, index) => {
      if (!(node.userData as any).baseY) {
        (node.userData as any).baseY = node.position.y;
      }
      node.position.y = (node.userData as any).baseY + Math.sin(time + index * 0.5) * 0.04;
    });
  }

  /**
   * Set layer opacity for layer toggling
   */
  setLayerOpacity(layerName: string, opacity: number): void {
    const layer = Object.values(this.layerGroups).find(group => group.name === layerName);
    
    this.allNodes.forEach(node => {
      if (node.userData.layer === layerName) {
        node.material.opacity = opacity;
      }
    });
    
    this.edges.forEach(edge => {
      if (edge.curve.getPoint(0.5).y === this.allNodes.find(n => n.userData.layer === layerName)?.position.y) {
        edge.tube.material.opacity = opacity;
        edge.labelDiv.style.opacity = opacity === 1 ? '1' : '0.25';
      }
    });
  }

  /**
   * Set vertical connections visibility
   */
  setVerticalConnectionsVisibility(visible: boolean): void {
    this.verticalConnections.forEach(connection => {
      connection.visible = visible;
    });
  }

  /**
   * Set performance mode (adjust bloom strength)
   */
  setPerformanceMode(enabled: boolean): void {
    this.bloomPass.strength = enabled ? 
      BLOOM_SETTINGS.strength : 
      BLOOM_SETTINGS.performanceModeStrength;
  }

  /**
   * Render the scene
   */
  render(): void {
    this.composer.render();
  }

  /**
   * Handle mouse move events
   */
  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  /**
   * Handle resize events
   */
  private onResize(): void {
    this.renderer.setPixelRatio(VISUALIZATION_CONFIG.dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    
    this.clearScene();
    this.renderer.dispose();
    this.composer.dispose();
    
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  /**
   * Clear the current visualization for dataset switching
   */
  clearVisualization(): void {
    this.clearScene();
    console.log('Visualization cleared for dataset switch');
  }

  /**
   * Get all visualization nodes
   */
  getAllNodes(): VisualizationNode[] {
    return this.allNodes;
  }

  /**
   * Get all edges
   */
  getAllEdges(): VisualizationEdge[] {
    return this.edges;
  }
}