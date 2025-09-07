/**
 * Configuration manager for RDF visualization mappings
 * Handles loading, validation, and switching between different RDF vocabulary configurations
 */

import type { VisualizationMapping } from './rdf-mapping';
import { DEFAULT_MULTIVERSE_MAPPING, EXAMPLE_ORG_CHART_MAPPING, validateMapping } from './rdf-mapping';

export class MappingConfigurationManager {
  private configurations: Map<string, VisualizationMapping> = new Map();
  private activeConfigurationId: string = 'default';

  constructor() {
    // Register built-in configurations
    this.registerConfiguration('default', DEFAULT_MULTIVERSE_MAPPING);
    this.registerConfiguration('multiverse', DEFAULT_MULTIVERSE_MAPPING);
    this.registerConfiguration('orgchart', EXAMPLE_ORG_CHART_MAPPING);
  }

  /**
   * Register a new configuration
   */
  registerConfiguration(id: string, mapping: VisualizationMapping): void {
    const validationErrors = validateMapping(mapping);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid mapping configuration for "${id}": ${validationErrors.join(', ')}`);
    }

    this.configurations.set(id, mapping);
    console.log(`Registered RDF mapping configuration: ${id}`);
  }

  /**
   * Load configuration from JSON
   */
  loadConfigurationFromJSON(id: string, jsonConfig: string | object): void {
    try {
      const config = typeof jsonConfig === 'string' ? JSON.parse(jsonConfig) : jsonConfig;
      
      // Validate that the config has the required structure
      if (!this.isValidMappingStructure(config)) {
        throw new Error('Invalid configuration structure');
      }

      this.registerConfiguration(id, config as VisualizationMapping);
    } catch (error) {
      throw new Error(`Failed to load configuration "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load configuration from URL
   */
  async loadConfigurationFromURL(id: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonConfig = await response.json();
      this.loadConfigurationFromJSON(id, jsonConfig);
    } catch (error) {
      throw new Error(`Failed to load configuration from URL "${url}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get configuration by ID
   */
  getConfiguration(id: string): VisualizationMapping | null {
    return this.configurations.get(id) || null;
  }

  /**
   * Get the currently active configuration
   */
  getActiveConfiguration(): VisualizationMapping {
    const config = this.configurations.get(this.activeConfigurationId);
    if (!config) {
      // Fallback to default if active config is missing
      return DEFAULT_MULTIVERSE_MAPPING;
    }
    return config;
  }

  /**
   * Set the active configuration
   */
  setActiveConfiguration(id: string): void {
    if (!this.configurations.has(id)) {
      throw new Error(`Configuration "${id}" not found. Available configurations: ${this.listConfigurationIds().join(', ')}`);
    }

    this.activeConfigurationId = id;
    console.log(`Switched to RDF mapping configuration: ${id}`);
  }

  /**
   * List all available configuration IDs
   */
  listConfigurationIds(): string[] {
    return Array.from(this.configurations.keys());
  }

  /**
   * Remove a configuration
   */
  removeConfiguration(id: string): boolean {
    if (id === 'default') {
      throw new Error('Cannot remove the default configuration');
    }

    if (this.activeConfigurationId === id) {
      this.activeConfigurationId = 'default';
    }

    return this.configurations.delete(id);
  }

  /**
   * Get configuration metadata
   */
  getConfigurationInfo(id: string): {
    id: string;
    entityTypes: string[];
    properties: string[];
    relationships: string[];
    namespaces: string[];
    isActive: boolean;
  } | null {
    const config = this.configurations.get(id);
    if (!config) return null;

    return {
      id,
      entityTypes: config.entityTypes.map(et => et.typeId),
      properties: config.properties.map(p => p.visualAttribute),
      relationships: config.relationships.map(r => r.label),
      namespaces: Object.keys(config.namespaces),
      isActive: this.activeConfigurationId === id,
    };
  }

  /**
   * Export configuration as JSON
   */
  exportConfiguration(id: string): string | null {
    const config = this.configurations.get(id);
    if (!config) return null;

    return JSON.stringify(config, null, 2);
  }

  /**
   * Clone a configuration with a new ID
   */
  cloneConfiguration(sourceId: string, newId: string): void {
    const sourceConfig = this.configurations.get(sourceId);
    if (!sourceConfig) {
      throw new Error(`Source configuration "${sourceId}" not found`);
    }

    // Deep clone the configuration
    const clonedConfig = JSON.parse(JSON.stringify(sourceConfig));
    this.registerConfiguration(newId, clonedConfig);
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.configurations.clear();
    this.configurations.set('default', DEFAULT_MULTIVERSE_MAPPING);
    this.configurations.set('multiverse', DEFAULT_MULTIVERSE_MAPPING);
    this.configurations.set('orgchart', EXAMPLE_ORG_CHART_MAPPING);
    this.activeConfigurationId = 'default';
  }

  /**
   * Validate configuration structure
   */
  private isValidMappingStructure(config: any): boolean {
    return (
      config &&
      typeof config === 'object' &&
      Array.isArray(config.entityTypes) &&
      Array.isArray(config.properties) &&
      Array.isArray(config.relationships) &&
      config.layerGrouping &&
      config.namespaces &&
      typeof config.namespaces === 'object'
    );
  }
}

// Export singleton instance
export const mappingManager = new MappingConfigurationManager();

// Configuration presets for common use cases
export const CONFIGURATION_PRESETS = {
  /**
   * Create a simple person-organization mapping
   */
  createPersonOrgMapping(
    personClass: string = 'http://xmlns.com/foaf/0.1/Person',
    orgClass: string = 'http://example.org/Organization',
    membershipProperty: string = 'http://example.org/memberOf'
  ): VisualizationMapping {
    return {
      entityTypes: [
        { rdfClass: personClass, label: 'Person', typeId: 'person' },
        { rdfClass: orgClass, label: 'Organization', typeId: 'organization' }
      ],
      properties: [
        {
          rdfProperty: 'http://xmlns.com/foaf/0.1/name',
          visualAttribute: 'label',
          required: true
        },
        {
          rdfProperty: 'http://example.org/hasPosition',
          visualAttribute: 'position',
          required: true,
          transform: (value: string) => {
            const coords = value.split(',').map(Number);
            return { x: coords[0], y: coords[1], z: coords[2] };
          }
        },
        {
          rdfProperty: membershipProperty,
          visualAttribute: 'layer',
          required: true,
          transform: (value: string) => value.split('/').pop() || ''
        }
      ],
      relationships: [
        {
          rdfPredicate: 'http://example.org/reportsTo',
          label: 'reports to'
        }
      ],
      layerGrouping: {
        layerProperty: membershipProperty,
        extractLayerId: (value: string) => value.split('/').pop() || '',
        layerClass: orgClass
      },
      namespaces: {
        foaf: 'http://xmlns.com/foaf/0.1/',
        org: 'http://example.org/',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
      }
    };
  },

  /**
   * Create a generic network mapping
   */
  createNetworkMapping(
    nodeClass: string = 'http://example.org/Node',
    connectionProperty: string = 'http://example.org/connectedTo'
  ): VisualizationMapping {
    return {
      entityTypes: [
        { rdfClass: nodeClass, label: 'Node', typeId: 'node' }
      ],
      properties: [
        {
          rdfProperty: 'http://www.w3.org/2000/01/rdf-schema#label',
          visualAttribute: 'label',
          required: true
        },
        {
          rdfProperty: 'http://example.org/hasPosition',
          visualAttribute: 'position',
          required: true,
          transform: (value: string) => {
            const coords = value.split(',').map(Number);
            return { x: coords[0], y: coords[1], z: coords[2] };
          }
        },
        {
          rdfProperty: 'http://example.org/inGroup',
          visualAttribute: 'layer',
          required: true,
          transform: (value: string) => value.split('/').pop() || ''
        }
      ],
      relationships: [
        {
          rdfPredicate: connectionProperty,
          label: 'connected to'
        }
      ],
      layerGrouping: {
        layerProperty: 'http://example.org/inGroup',
        extractLayerId: (value: string) => value.split('/').pop() || ''
      },
      namespaces: {
        ex: 'http://example.org/',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
      }
    };
  }
};