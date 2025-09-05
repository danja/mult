import './style.css';
import { MultiverseVisualization } from '@/visualization';
import { UIController } from '@/ui/ui-controller';

/**
 * Main application entry point
 */
async function initApp(): Promise<void> {
  try {
    // Get the canvas container
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      throw new Error('Canvas container not found');
    }

    // Initialize the visualization
    console.log('Initializing RDF Multiverse Visualization...');
    const visualization = new MultiverseVisualization(canvasContainer);
    
    // Initialize UI controller
    const uiController = new UIController(visualization);
    uiController.showLoading();

    // Load and initialize the visualization
    await visualization.initialize('./universe.ttl');
    
    console.log('RDF Multiverse Visualization loaded successfully!');

    // Add global reference for debugging
    (window as any).multiverseViz = {
      visualization,
      uiController,
      exportState: () => visualization.exportState(),
      refreshData: () => visualization.refreshData(),
    };

  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error in UI
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = `
      <h3>Initialization Error</h3>
      <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 4px; cursor: pointer;">
        Retry
      </button>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
