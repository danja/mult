import { RDFDataLoader } from './rdf-loader';
import type { RDFQueryResult } from '@/types';
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
   * Load multiverse data from TTL file
   */
  async loadData(source = './universe.ttl'): Promise<RDFQueryResult> {
    if (this.cachedData) {
      return this.cachedData;
    }

    if (this.isLoading) {
      // Wait for existing load to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.cachedData) {
        return this.cachedData;
      }
    }

    this.isLoading = true;

    try {
      // Load and parse the TTL data
      await this.rdfLoader.loadTTL(source);
      
      // Query the data
      const data = this.rdfLoader.queryMultiverseData();
      
      // Validate the data
      this.validateData(data);
      
      // Cache the result
      this.cachedData = data;
      
      return data;
    } catch (error) {
      console.error('Failed to load multiverse data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Refresh the cached data by reloading from source
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
}

// Export a singleton instance
export const multiverseDataService = new MultiverseDataService();