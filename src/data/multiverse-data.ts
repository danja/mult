import { RDFDataLoader } from './rdf-loader';
import type { RDFQueryResult } from '@/types';
import type { VisualizationMapping } from '@/config/rdf-mapping';
import { mappingManager } from '@/config/mapping-manager';
import { validateNodes, validateLayers } from '@/utils/data-utils';

/**
 * Main data service for the multiverse visualization
 * Handles loading and caching of RDF data
 */
export class MultiverseDataService {
  private rdfLoader: RDFDataLoader;
  private cachedData: RDFQueryResult | null = null;
  private isLoading = false;

  constructor() {
    this.rdfLoader = new RDFDataLoader();
  }

  /**
   * Load data using a specific configuration
   */
  async loadDataWithConfiguration(source: string, configurationId: string): Promise<RDFQueryResult> {
    const mapping = mappingManager.getConfiguration(configurationId);
    if (!mapping) {
      throw new Error(`Configuration "${configurationId}" not found`);
    }

    this.cachedData = null; // Clear cache
    this.isLoading = true;

    try {
      // Load data with specific mapping
      await this.rdfLoader.loadWithMapping(source, mapping);
      
      // Query the data using the mapping
      const data = this.rdfLoader.queryData();
      
      // Validate the data
      this.validateData(data);
      
      // Cache the result
      this.cachedData = data;
      
      return data;
    } catch (error) {
      console.error('Failed to load data with configuration:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load data using the currently active configuration
   */
  async loadDataWithActiveConfiguration(source: string): Promise<RDFQueryResult> {
    const activeMapping = mappingManager.getActiveConfiguration();
    
    this.cachedData = null; // Clear cache
    this.isLoading = true;

    try {
      // Load data with active mapping
      await this.rdfLoader.loadWithMapping(source, activeMapping);
      
      // Query the data using the mapping
      const data = this.rdfLoader.queryData();
      
      // Validate the data
      this.validateData(data);
      
      // Cache the result
      this.cachedData = data;
      
      return data;
    } catch (error) {
      console.error('Failed to load data with active configuration:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load multiverse data from TTL file (legacy method for backward compatibility)
   */
  async loadData(source = './universe.ttl'): Promise<RDFQueryResult> {
    // Use the default multiverse configuration for backward compatibility
    return this.loadDataWithConfiguration(source, 'default');
  }

  /**
   * Refresh the cached data by reloading from source with a specific configuration
   */
  async refreshDataWithConfiguration(source: string, configurationId: string): Promise<RDFQueryResult> {
    this.cachedData = null;
    return this.loadDataWithConfiguration(source, configurationId);
  }

  /**
   * Refresh the cached data by reloading from source (legacy method)
   */
  async refreshData(source = './universe.ttl'): Promise<RDFQueryResult> {
    this.cachedData = null;
    return this.loadData(source);
  }

  /**
   * Get cached data without loading
   */
  getCachedData(): RDFQueryResult | null {
    return this.cachedData;
  }

  /**
   * Check if data is currently loading
   */
  isDataLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Validate the loaded data structure
   */
  private validateData(data: RDFQueryResult): void {
    if (!data.nodes || !Array.isArray(data.nodes)) {
      throw new Error('Invalid or missing nodes data');
    }

    if (!data.layers || typeof data.layers !== 'object') {
      throw new Error('Invalid or missing layers data');
    }

    if (!data.triples || !Array.isArray(data.triples)) {
      throw new Error('Invalid or missing triples data');
    }

    if (!validateNodes(data.nodes)) {
      throw new Error('Node validation failed');
    }

    if (!validateLayers(data.layers)) {
      throw new Error('Layer validation failed');
    }

    console.log('Data validation passed:', {
      nodes: data.nodes.length,
      layers: Object.keys(data.layers).length,
      triples: data.triples.length,
      sharedConnections: data.sharedConnections.length,
    });
  }

  /**
   * Get data statistics
   */
  getDataStats(): { nodes: number; layers: number; triples: number; connections: number } | null {
    if (!this.cachedData) return null;

    return {
      nodes: this.cachedData.nodes.length,
      layers: Object.keys(this.cachedData.layers).length,
      triples: this.cachedData.triples.length,
      connections: this.cachedData.sharedConnections.length,
    };
  }

  /**
   * Get the underlying RDF dataset for advanced queries
   */
  getRDFDataset() {
    return this.rdfLoader.getDataset();
  }

  /**
   * Get the current mapping configuration used by the loader
   */
  getCurrentMapping(): VisualizationMapping {
    return this.rdfLoader.getMapping();
  }

  /**
   * Switch to a different configuration (clears cache)
   */
  switchConfiguration(configurationId: string): void {
    const mapping = mappingManager.getConfiguration(configurationId);
    if (!mapping) {
      throw new Error(`Configuration "${configurationId}" not found`);
    }

    this.rdfLoader.setMapping(mapping);
    this.cachedData = null; // Clear cache when switching configurations
    console.log(`Switched data service to configuration: ${configurationId}`);
  }

  /**
   * Register a new mapping configuration
   */
  registerMapping(id: string, mapping: VisualizationMapping): void {
    mappingManager.registerConfiguration(id, mapping);
  }

  /**
   * Get available configuration IDs
   */
  getAvailableConfigurations(): string[] {
    return mappingManager.listConfigurationIds();
  }

  /**
   * Get configuration information
   */
  getConfigurationInfo(id?: string): any {
    if (id) {
      return mappingManager.getConfigurationInfo(id);
    }
    
    // Return info for all configurations
    return mappingManager.listConfigurationIds().map(configId => 
      mappingManager.getConfigurationInfo(configId)
    );
  }
}

// Export a singleton instance
export const multiverseDataService = new MultiverseDataService();

// Export mapping manager for direct configuration management
export { mappingManager } from '@/config/mapping-manager';