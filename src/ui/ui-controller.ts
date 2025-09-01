import type { MultiverseVisualization } from '@/visualization';
import type { UIState, RDFQueryResult } from '@/types';
import { sanitizeForCSS } from '@/utils/data-utils';

export class UIController {
  private visualization: MultiverseVisualization;
  private elements: {
    infoPanel?: HTMLElement;
    collapseBtn?: HTMLButtonElement;
    animBtn?: HTMLButtonElement;
    labelsBtn?: HTMLButtonElement;
    topBtn?: HTMLButtonElement;
    resetBtn?: HTMLButtonElement;
    perfBtn?: HTMLButtonElement;
    verticalToggle?: HTMLInputElement;
    layerLegend?: HTMLElement;
    dataStats?: HTMLElement;
    loading?: HTMLElement;
  } = {};

  constructor(visualization: MultiverseVisualization) {
    this.visualization = visualization;
    this.setupEventHandlers();
    this.initializeElements();
    this.bindEventListeners();
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void {
    this.elements = {
      infoPanel: document.getElementById('info') as HTMLElement,
      collapseBtn: document.getElementById('collapseBtn') as HTMLButtonElement,
      animBtn: document.getElementById('animBtn') as HTMLButtonElement,
      labelsBtn: document.getElementById('labelsBtn') as HTMLButtonElement,
      topBtn: document.getElementById('topBtn') as HTMLButtonElement,
      resetBtn: document.getElementById('resetBtn') as HTMLButtonElement,
      perfBtn: document.getElementById('perfBtn') as HTMLButtonElement,
      verticalToggle: document.getElementById('toggle-vertical') as HTMLInputElement,
      layerLegend: document.querySelector('.layer-legend') as HTMLElement,
      dataStats: document.getElementById('data-stats') as HTMLElement,
      loading: document.getElementById('loading') as HTMLElement,
    };
  }

  /**
   * Set up visualization event handlers
   */
  private setupEventHandlers(): void {
    this.visualization.setEventHandlers({
      onDataLoaded: (data) => this.handleDataLoaded(data),
      onLayerToggle: (event) => this.handleLayerToggle(event),
      onError: (error) => this.handleError(error),
    });
  }

  /**
   * Bind UI event listeners
   */
  private bindEventListeners(): void {
    // Collapse button
    this.elements.collapseBtn?.addEventListener('click', () => {
      this.toggleInfoPanel();
    });

    // Control buttons
    this.elements.animBtn?.addEventListener('click', () => {
      this.toggleAnimation();
    });

    this.elements.labelsBtn?.addEventListener('click', () => {
      this.cycleLabelMode();
    });

    this.elements.topBtn?.addEventListener('click', () => {
      this.visualization.setTopView();
    });

    this.elements.resetBtn?.addEventListener('click', () => {
      this.visualization.resetCamera();
    });

    this.elements.perfBtn?.addEventListener('click', () => {
      this.togglePerformanceMode();
    });

    // Vertical connections toggle
    this.elements.verticalToggle?.addEventListener('change', () => {
      this.visualization.toggleVerticalConnections();
    });
  }

  /**
   * Handle data loaded event
   */
  private handleDataLoaded(data: RDFQueryResult): void {
    this.hideLoading();
    this.buildLayerLegend(data);
    this.updateDataStats();
    console.log('UI updated with loaded data');
  }

  /**
   * Handle layer toggle event
   */
  private handleLayerToggle(event: { layerName: string; visible: boolean }): void {
    const checkbox = document.getElementById(`layer-${sanitizeForCSS(event.layerName)}`) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = event.visible;
    }
  }

  /**
   * Handle visualization errors
   */
  private handleError(error: Error): void {
    this.hideLoading();
    this.showError(error.message);
  }

  /**
   * Toggle info panel collapse state
   */
  private toggleInfoPanel(): void {
    const infoPanel = this.elements.infoPanel;
    const collapseBtn = this.elements.collapseBtn;
    
    if (!infoPanel || !collapseBtn) return;

    const isCollapsed = infoPanel.classList.toggle('collapsed');
    collapseBtn.textContent = isCollapsed ? '▸' : '▾';
    collapseBtn.setAttribute('aria-pressed', String(!isCollapsed));
  }

  /**
   * Toggle animation on/off
   */
  private toggleAnimation(): void {
    this.visualization.toggleAnimation();
    const uiState = this.visualization.getUIState();
    
    if (this.elements.animBtn) {
      this.elements.animBtn.setAttribute('aria-pressed', String(uiState.animating));
    }
  }

  /**
   * Cycle through label modes
   */
  private cycleLabelMode(): void {
    const uiState = this.visualization.getUIState();
    let nextMode: UIState['labelMode'];

    switch (uiState.labelMode) {
      case 'smart':
        nextMode = 'all';
        break;
      case 'all':
        nextMode = 'none';
        break;
      case 'none':
        nextMode = 'smart';
        break;
      default:
        nextMode = 'smart';
    }

    this.visualization.setLabelMode(nextMode);
    
    if (this.elements.labelsBtn) {
      const modeText = nextMode === 'smart' ? 'Smart' : 
                     nextMode === 'all' ? 'All' : 'None';
      this.elements.labelsBtn.textContent = `🏷️ Labels: ${modeText}`;
      this.elements.labelsBtn.dataset.mode = nextMode;
      this.elements.labelsBtn.setAttribute('aria-pressed', String(nextMode !== 'none'));
    }
  }

  /**
   * Toggle performance mode
   */
  private togglePerformanceMode(): void {
    this.visualization.togglePerformanceMode();
    const uiState = this.visualization.getUIState();
    
    if (this.elements.perfBtn) {
      this.elements.perfBtn.setAttribute('aria-pressed', String(uiState.performanceMode));
    }
  }

  /**
   * Build the layer legend from data
   */
  private buildLayerLegend(data: RDFQueryResult): void {
    if (!this.elements.layerLegend) return;

    this.elements.layerLegend.innerHTML = '';

    Object.entries(data.layers).forEach(([layerKey, layer]) => {
      const row = document.createElement('div');
      row.className = 'layer-item';

      const leftDiv = document.createElement('div');
      leftDiv.className = 'layer-left';

      const colorDiv = document.createElement('div');
      colorDiv.className = 'layer-color';
      colorDiv.style.backgroundColor = `#${layer.color.toString(16).padStart(6, '0')}`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'layer-name';
      nameSpan.textContent = layer.name;

      leftDiv.appendChild(colorDiv);
      leftDiv.appendChild(nameSpan);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.id = `layer-${sanitizeForCSS(layerKey)}`;
      checkbox.addEventListener('change', () => {
        this.visualization.toggleLayer(layerKey);
      });

      row.appendChild(leftDiv);
      row.appendChild(checkbox);
      this.elements.layerLegend.appendChild(row);
    });
  }

  /**
   * Update data statistics display
   */
  private updateDataStats(): void {
    if (!this.elements.dataStats) return;

    const stats = this.visualization.getDataStats();
    if (!stats) return;

    this.elements.dataStats.innerHTML = `
      <div>Nodes: ${stats.nodes}</div>
      <div>Layers: ${stats.layers}</div>
      <div>Relationships: ${stats.triples}</div>
      <div>Cross-connections: ${stats.connections}</div>
    `;
  }

  /**
   * Show loading screen
   */
  showLoading(): void {
    if (this.elements.loading) {
      this.elements.loading.classList.remove('hidden');
    }
  }

  /**
   * Hide loading screen
   */
  hideLoading(): void {
    if (this.elements.loading) {
      this.elements.loading.classList.add('hidden');
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    // Remove existing error
    const existingError = document.querySelector('.error');
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = `
      <h3>Error Loading Visualization</h3>
      <p>${message}</p>
      <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 4px; cursor: pointer;">
        Reload Page
      </button>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }

  /**
   * Update UI state from visualization
   */
  updateFromVisualization(): void {
    const uiState = this.visualization.getUIState();

    // Update animation button
    if (this.elements.animBtn) {
      this.elements.animBtn.setAttribute('aria-pressed', String(uiState.animating));
    }

    // Update labels button
    if (this.elements.labelsBtn) {
      const modeText = uiState.labelMode === 'smart' ? 'Smart' : 
                     uiState.labelMode === 'all' ? 'All' : 'None';
      this.elements.labelsBtn.textContent = `🏷️ Labels: ${modeText}`;
      this.elements.labelsBtn.dataset.mode = uiState.labelMode;
      this.elements.labelsBtn.setAttribute('aria-pressed', String(uiState.labelMode !== 'none'));
    }

    // Update performance button
    if (this.elements.perfBtn) {
      this.elements.perfBtn.setAttribute('aria-pressed', String(uiState.performanceMode));
    }

    // Update vertical connections toggle
    if (this.elements.verticalToggle) {
      this.elements.verticalToggle.checked = uiState.showVerticalConnections;
    }

    // Update layer checkboxes
    Object.entries(uiState.layersVisible).forEach(([layerName, visible]) => {
      const checkbox = document.getElementById(`layer-${sanitizeForCSS(layerName)}`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = visible;
      }
    });
  }

  /**
   * Get UI state for debugging
   */
  getUIElements() {
    return this.elements;
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    // Event listeners are automatically cleaned up when DOM elements are removed
    // This method is provided for future cleanup needs
  }
}