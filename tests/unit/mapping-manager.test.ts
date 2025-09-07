import { describe, it, expect, beforeEach } from 'vitest';
import { MappingConfigurationManager } from '@/config/mapping-manager';
import { DEFAULT_MULTIVERSE_MAPPING, EXAMPLE_ORG_CHART_MAPPING, validateMapping } from '@/config/rdf-mapping';
import type { VisualizationMapping } from '@/config/rdf-mapping';

describe('MappingConfigurationManager', () => {
  let manager: MappingConfigurationManager;

  beforeEach(() => {
    manager = new MappingConfigurationManager();
  });

  describe('constructor', () => {
    it('should create instance with built-in configurations', () => {
      expect(manager).toBeInstanceOf(MappingConfigurationManager);
      
      const configs = manager.listConfigurationIds();
      expect(configs).toContain('default');
      expect(configs).toContain('multiverse');
      expect(configs).toContain('orgchart');
    });

    it('should set default as active configuration', () => {
      const activeConfig = manager.getActiveConfiguration();
      expect(activeConfig).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });
  });

  describe('configuration management', () => {
    const testMapping: VisualizationMapping = {
      entityTypes: [
        { rdfClass: 'http://example.org/TestEntity', label: 'Test Entity', typeId: 'test' }
      ],
      properties: [
        { rdfProperty: 'http://www.w3.org/2000/01/rdf-schema#label', visualAttribute: 'label', required: true },
        { rdfProperty: 'http://example.org/hasPosition', visualAttribute: 'position', required: true },
        { rdfProperty: 'http://example.org/inGroup', visualAttribute: 'layer', required: true }
      ],
      relationships: [
        { rdfPredicate: 'http://example.org/connectsTo', label: 'connects to' }
      ],
      layerGrouping: {
        layerProperty: 'http://example.org/inGroup',
        extractLayerId: (value: string) => value.split('/').pop() || ''
      },
      namespaces: {
        ex: 'http://example.org/',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
      }
    };

    it('should register new configuration', () => {
      manager.registerConfiguration('test', testMapping);
      
      const config = manager.getConfiguration('test');
      expect(config).toEqual(testMapping);
      
      const configs = manager.listConfigurationIds();
      expect(configs).toContain('test');
    });

    it('should throw error for invalid configuration', () => {
      const invalidMapping = {
        entityTypes: [], // Empty - should be invalid
        properties: [],
        relationships: [],
        layerGrouping: {
          layerProperty: 'test',
          extractLayerId: () => ''
        },
        namespaces: {}
      } as VisualizationMapping;

      expect(() => {
        manager.registerConfiguration('invalid', invalidMapping);
      }).toThrow();
    });

    it('should get configuration by ID', () => {
      const config = manager.getConfiguration('default');
      expect(config).toEqual(DEFAULT_MULTIVERSE_MAPPING);
      
      const nonExistent = manager.getConfiguration('nonexistent');
      expect(nonExistent).toBeNull();
    });

    it('should set active configuration', () => {
      manager.registerConfiguration('test', testMapping);
      manager.setActiveConfiguration('test');
      
      const activeConfig = manager.getActiveConfiguration();
      expect(activeConfig).toEqual(testMapping);
    });

    it('should throw error when setting non-existent configuration as active', () => {
      expect(() => {
        manager.setActiveConfiguration('nonexistent');
      }).toThrow('Configuration "nonexistent" not found');
    });

    it('should remove configuration', () => {
      manager.registerConfiguration('test', testMapping);
      expect(manager.getConfiguration('test')).not.toBeNull();
      
      const removed = manager.removeConfiguration('test');
      expect(removed).toBe(true);
      expect(manager.getConfiguration('test')).toBeNull();
    });

    it('should not allow removing default configuration', () => {
      expect(() => {
        manager.removeConfiguration('default');
      }).toThrow('Cannot remove the default configuration');
    });

    it('should reset active config when removing active config', () => {
      manager.registerConfiguration('test', testMapping);
      manager.setActiveConfiguration('test');
      
      manager.removeConfiguration('test');
      const activeConfig = manager.getActiveConfiguration();
      expect(activeConfig).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });
  });

  describe('configuration information', () => {
    it('should return configuration info', () => {
      const info = manager.getConfigurationInfo('default');
      
      expect(info).toBeDefined();
      expect(info!.id).toBe('default');
      expect(info!.entityTypes).toContain('character');
      expect(info!.entityTypes).toContain('movie');
      expect(info!.isActive).toBe(true);
      expect(info!.namespaces).toContain('mv');
    });

    it('should return null for non-existent configuration', () => {
      const info = manager.getConfigurationInfo('nonexistent');
      expect(info).toBeNull();
    });
  });

  describe('import/export', () => {
    it('should export configuration as JSON', () => {
      const json = manager.exportConfiguration('default');
      expect(json).toBeDefined();
      
      const parsed = JSON.parse(json!);
      expect(parsed.entityTypes).toBeDefined();
      expect(parsed.properties).toBeDefined();
    });

    it('should return null for non-existent configuration export', () => {
      const json = manager.exportConfiguration('nonexistent');
      expect(json).toBeNull();
    });

    it('should load configuration from JSON object', () => {
      const testConfig = {
        entityTypes: [
          { rdfClass: 'http://test.org/Entity', label: 'Entity', typeId: 'entity' }
        ],
        properties: [
          { rdfProperty: 'http://www.w3.org/2000/01/rdf-schema#label', visualAttribute: 'label', required: true },
          { rdfProperty: 'http://test.org/position', visualAttribute: 'position', required: true },
          { rdfProperty: 'http://test.org/group', visualAttribute: 'layer', required: true }
        ],
        relationships: [],
        layerGrouping: {
          layerProperty: 'http://test.org/group',
          extractLayerId: (value: string) => value
        },
        namespaces: { test: 'http://test.org/' }
      };

      manager.loadConfigurationFromJSON('fromjson', testConfig);
      const loaded = manager.getConfiguration('fromjson');
      
      expect(loaded).toBeDefined();
      expect(loaded!.entityTypes[0].typeId).toBe('entity');
    });

    it('should throw error for invalid JSON configuration', () => {
      const invalidConfig = {
        entityTypes: 'invalid' // Should be array
      };

      expect(() => {
        manager.loadConfigurationFromJSON('invalid', invalidConfig);
      }).toThrow();
    });
  });

  describe('utility methods', () => {
    it('should clone configuration', () => {
      manager.cloneConfiguration('default', 'cloned');
      
      const original = manager.getConfiguration('default');
      const cloned = manager.getConfiguration('cloned');
      
      // Compare key properties (functions won't match exactly after JSON serialization)
      expect(cloned?.entityTypes).toEqual(original?.entityTypes);
      expect(cloned?.relationships).toEqual(original?.relationships);
      expect(cloned?.namespaces).toEqual(original?.namespaces);
      expect(cloned).not.toBe(original); // Should be different object instances
    });

    it('should throw error when cloning non-existent configuration', () => {
      expect(() => {
        manager.cloneConfiguration('nonexistent', 'cloned');
      }).toThrow('Source configuration "nonexistent" not found');
    });

    it('should reset to defaults', () => {
      const testMapping: VisualizationMapping = {
        entityTypes: [{ rdfClass: 'test', label: 'Test', typeId: 'test' }],
        properties: [
          { rdfProperty: 'rdfs:label', visualAttribute: 'label', required: true },
          { rdfProperty: 'test:position', visualAttribute: 'position', required: true },
          { rdfProperty: 'test:group', visualAttribute: 'layer', required: true }
        ],
        relationships: [],
        layerGrouping: { layerProperty: 'test:group', extractLayerId: () => '' },
        namespaces: { test: 'test' }
      };
      
      manager.registerConfiguration('test', testMapping);
      manager.setActiveConfiguration('test');
      
      manager.reset();
      
      const configs = manager.listConfigurationIds();
      expect(configs).toEqual(['default', 'multiverse', 'orgchart']);
      
      const activeConfig = manager.getActiveConfiguration();
      expect(activeConfig).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });
  });
});

describe('validateMapping', () => {
  it('should validate correct mapping', () => {
    const errors = validateMapping(DEFAULT_MULTIVERSE_MAPPING);
    expect(errors).toHaveLength(0);
  });

  it('should catch missing entity types', () => {
    const invalidMapping = {
      ...DEFAULT_MULTIVERSE_MAPPING,
      entityTypes: []
    };
    
    const errors = validateMapping(invalidMapping);
    expect(errors).toContain('At least one entity type mapping is required');
  });

  it('should catch missing required properties', () => {
    const invalidMapping = {
      ...DEFAULT_MULTIVERSE_MAPPING,
      properties: [] // No required label, position, or layer properties
    };
    
    const errors = validateMapping(invalidMapping);
    expect(errors).toContain('A required label property mapping is needed');
    expect(errors).toContain('A required position property mapping is needed');
    expect(errors).toContain('A required layer property mapping is needed');
  });

  it('should catch duplicate entity type IDs', () => {
    const invalidMapping = {
      ...DEFAULT_MULTIVERSE_MAPPING,
      entityTypes: [
        { rdfClass: 'test1', label: 'Test1', typeId: 'duplicate' },
        { rdfClass: 'test2', label: 'Test2', typeId: 'duplicate' }
      ]
    };
    
    const errors = validateMapping(invalidMapping);
    expect(errors).toContain('Entity type IDs must be unique');
  });

  it('should catch missing namespaces', () => {
    const invalidMapping = {
      ...DEFAULT_MULTIVERSE_MAPPING,
      namespaces: {}
    };
    
    const errors = validateMapping(invalidMapping);
    expect(errors).toContain('At least one namespace mapping is required');
  });
});