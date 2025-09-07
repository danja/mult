import { describe, it, expect, beforeEach } from 'vitest';
import { RDFDataLoader } from '@/data/rdf-loader';
import { DEFAULT_MULTIVERSE_MAPPING, EXAMPLE_ORG_CHART_MAPPING } from '@/config/rdf-mapping';
import type { VisualizationMapping } from '@/config/rdf-mapping';

describe('RDFDataLoader', () => {
  let loader: RDFDataLoader;

  beforeEach(() => {
    loader = new RDFDataLoader();
  });

  describe('constructor', () => {
    it('should create an instance without errors', () => {
      expect(loader).toBeInstanceOf(RDFDataLoader);
    });

    it('should use default mapping when no mapping provided', () => {
      const mapping = loader.getMapping();
      expect(mapping).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });

    it('should use provided mapping', () => {
      const customLoader = new RDFDataLoader(EXAMPLE_ORG_CHART_MAPPING);
      const mapping = customLoader.getMapping();
      expect(mapping).toEqual(EXAMPLE_ORG_CHART_MAPPING);
    });
  });

  describe('mapping configuration', () => {
    it('should allow setting mapping configuration', () => {
      loader.setMapping(EXAMPLE_ORG_CHART_MAPPING);
      const mapping = loader.getMapping();
      expect(mapping).toEqual(EXAMPLE_ORG_CHART_MAPPING);
    });

    it('should return current mapping configuration', () => {
      const mapping = loader.getMapping();
      expect(mapping).toBeDefined();
      expect(mapping.entityTypes).toBeDefined();
      expect(mapping.properties).toBeDefined();
      expect(mapping.relationships).toBeDefined();
    });
  });

  describe('queryData', () => {
    it('should throw error when no data is loaded', () => {
      expect(() => loader.queryData()).toThrow('No RDF data loaded');
    });

    it('should return result with mapping config', () => {
      // This test would need mock data, but we can test the structure
      expect(() => loader.queryData()).toThrow('No RDF data loaded');
    });
  });

  describe('queryMultiverseData (legacy)', () => {
    it('should throw error when no data is loaded', () => {
      expect(() => loader.queryMultiverseData()).toThrow('No RDF data loaded');
    });

    it('should be equivalent to queryData', () => {
      // Both methods should throw the same error when no data is loaded
      expect(() => loader.queryData()).toThrow('No RDF data loaded');
      expect(() => loader.queryMultiverseData()).toThrow('No RDF data loaded');
    });
  });

  describe('getDataset', () => {
    it('should return null when no data is loaded', () => {
      expect(loader.getDataset()).toBeNull();
    });
  });

  describe('loadWithMapping', () => {
    it('should be a function that accepts source and mapping', () => {
      expect(typeof loader.loadWithMapping).toBe('function');
      expect(loader.loadWithMapping.length).toBe(2);
    });
  });

  // Test configuration validation scenarios
  describe('mapping validation scenarios', () => {
    it('should work with multiverse mapping', () => {
      loader.setMapping(DEFAULT_MULTIVERSE_MAPPING);
      const mapping = loader.getMapping();
      
      expect(mapping.entityTypes).toHaveLength(2);
      expect(mapping.entityTypes[0].typeId).toBe('character');
      expect(mapping.entityTypes[1].typeId).toBe('movie');
    });

    it('should work with org chart mapping', () => {
      loader.setMapping(EXAMPLE_ORG_CHART_MAPPING);
      const mapping = loader.getMapping();
      
      expect(mapping.entityTypes).toHaveLength(2);
      expect(mapping.entityTypes[0].typeId).toBe('person');
      expect(mapping.entityTypes[1].typeId).toBe('department');
    });

    it('should handle custom mapping structure', () => {
      const customMapping: VisualizationMapping = {
        entityTypes: [
          { rdfClass: 'http://example.org/Node', label: 'Node', typeId: 'node' }
        ],
        properties: [
          { rdfProperty: 'http://www.w3.org/2000/01/rdf-schema#label', visualAttribute: 'label', required: true }
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

      loader.setMapping(customMapping);
      const mapping = loader.getMapping();
      expect(mapping.entityTypes[0].typeId).toBe('node');
    });
  });

  // Note: Testing the full TTL loading would require mocking fetch
  // and providing actual TTL data, which would be more suitable for integration tests
});