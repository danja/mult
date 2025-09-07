import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiverseDataService } from '@/data/multiverse-data';
import { DEFAULT_MULTIVERSE_MAPPING, EXAMPLE_ORG_CHART_MAPPING } from '@/config/rdf-mapping';

// Mock the RDFDataLoader
vi.mock('@/data/rdf-loader', () => ({
  RDFDataLoader: vi.fn().mockImplementation(() => ({
    loadTTL: vi.fn().mockResolvedValue(undefined),
    loadWithMapping: vi.fn().mockResolvedValue(undefined),
    queryData: vi.fn(() => ({
      nodes: [
        {
          id: 'test:entity1',
          label: 'Test Entity 1',
          layer: 'layer1',
          x: 0,
          y: 0,
          z: 0,
          type: 'test'
        }
      ],
      triples: [
        {
          subject: 'test:entity1',
          predicate: 'test:connectsTo',
          object: 'test:entity2',
          layer: 'layer1'
        }
      ],
      layers: {
        layer1: {
          name: 'Test Layer 1',
          color: 0xff0000,
          height: 0
        }
      },
      sharedConnections: [],
      mappingConfig: DEFAULT_MULTIVERSE_MAPPING
    })),
    queryMultiverseData: vi.fn(() => ({
      nodes: [],
      triples: [],
      layers: {},
      sharedConnections: []
    })),
    getDataset: vi.fn(() => null),
    getMapping: vi.fn(() => DEFAULT_MULTIVERSE_MAPPING),
    setMapping: vi.fn()
  }))
}));

describe('MultiverseDataService', () => {
  let service: MultiverseDataService;

  beforeEach(() => {
    service = new MultiverseDataService();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(service).toBeInstanceOf(MultiverseDataService);
    });
  });

  describe('legacy loadData method', () => {
    it('should load data using default configuration', async () => {
      const data = await service.loadData('test.ttl');
      
      expect(data).toBeDefined();
      expect(data.nodes).toBeDefined();
      expect(data.triples).toBeDefined();
      expect(data.layers).toBeDefined();
      expect(data.sharedConnections).toBeDefined();
      expect(data.mappingConfig).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });

    it('should cache loaded data', async () => {
      await service.loadData('test.ttl');
      const cachedData = service.getCachedData();
      
      expect(cachedData).not.toBeNull();
      expect(cachedData!.mappingConfig).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });
  });

  describe('configuration-aware loading', () => {
    it('should load data with specific configuration', async () => {
      const data = await service.loadDataWithConfiguration('test.ttl', 'default');
      
      expect(data).toBeDefined();
      expect(data.mappingConfig).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });

    it('should load data with active configuration', async () => {
      const data = await service.loadDataWithActiveConfiguration('test.ttl');
      
      expect(data).toBeDefined();
      expect(data.mappingConfig).toBeDefined();
    });

    it('should throw error for non-existent configuration', async () => {
      await expect(
        service.loadDataWithConfiguration('test.ttl', 'nonexistent')
      ).rejects.toThrow('Configuration "nonexistent" not found');
    });

    it('should clear cache when loading with different configuration', async () => {
      await service.loadData('test.ttl');
      expect(service.getCachedData()).not.toBeNull();
      
      await service.loadDataWithConfiguration('test.ttl', 'orgchart');
      // Cache should be cleared and repopulated
      expect(service.getCachedData()).not.toBeNull();
    });
  });

  describe('refresh methods', () => {
    it('should refresh data with configuration', async () => {
      await service.loadData('test.ttl');
      const data = await service.refreshDataWithConfiguration('test.ttl', 'default');
      
      expect(data).toBeDefined();
    });

    it('should refresh data using legacy method', async () => {
      await service.loadData('test.ttl');
      const data = await service.refreshData('test.ttl');
      
      expect(data).toBeDefined();
    });
  });

  describe('configuration management', () => {
    it('should return current mapping', () => {
      const mapping = service.getCurrentMapping();
      expect(mapping).toEqual(DEFAULT_MULTIVERSE_MAPPING);
    });

    it('should switch configuration', () => {
      service.switchConfiguration('orgchart');
      expect(service.getCachedData()).toBeNull(); // Cache should be cleared
    });

    it('should throw error for invalid configuration switch', () => {
      expect(() => {
        service.switchConfiguration('nonexistent');
      }).toThrow('Configuration "nonexistent" not found');
    });

    it('should return available configurations', () => {
      const configs = service.getAvailableConfigurations();
      expect(configs).toContain('default');
      expect(configs).toContain('multiverse');
      expect(configs).toContain('orgchart');
    });

    it('should register new mapping', () => {
      const testMapping = {
        entityTypes: [{ rdfClass: 'test', label: 'Test', typeId: 'test' }],
        properties: [
          { rdfProperty: 'rdfs:label', visualAttribute: 'label' as const, required: true },
          { rdfProperty: 'test:position', visualAttribute: 'position' as const, required: true },
          { rdfProperty: 'test:group', visualAttribute: 'layer' as const, required: true }
        ],
        relationships: [],
        layerGrouping: {
          layerProperty: 'test:group',
          extractLayerId: (value: string) => value
        },
        namespaces: { test: 'http://test.org/' }
      };

      service.registerMapping('test', testMapping);
      const configs = service.getAvailableConfigurations();
      expect(configs).toContain('test');
    });

    it('should return configuration info', () => {
      const info = service.getConfigurationInfo('default');
      expect(info).toBeDefined();
      expect(info.id).toBe('default');
    });

    it('should return all configuration info when no ID specified', () => {
      const allInfo = service.getConfigurationInfo();
      expect(Array.isArray(allInfo)).toBe(true);
      expect(allInfo.length).toBeGreaterThan(0);
    });
  });

  describe('data statistics', () => {
    it('should return data stats', async () => {
      await service.loadData('test.ttl');
      const stats = service.getDataStats();
      
      expect(stats).toBeDefined();
      expect(stats!.nodes).toBeDefined();
      expect(stats!.layers).toBeDefined();
      expect(stats!.triples).toBeDefined();
      expect(stats!.connections).toBeDefined();
    });

    it('should return null stats when no data loaded', () => {
      const stats = service.getDataStats();
      expect(stats).toBeNull();
    });
  });

  describe('loading states', () => {
    it('should track loading state', async () => {
      expect(service.isDataLoading()).toBe(false);
      
      // Note: In a real scenario, we'd test async loading state
      // but with mocked loader, loading completes synchronously
      await service.loadData('test.ttl');
      expect(service.isDataLoading()).toBe(false);
    });
  });

  describe('dataset access', () => {
    it('should provide access to RDF dataset', () => {
      const dataset = service.getRDFDataset();
      // With mocked loader, this returns null
      expect(dataset).toBeNull();
    });
  });
});