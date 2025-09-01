import { describe, it, expect, beforeEach } from 'vitest';
import { RDFDataLoader } from '@/data/rdf-loader';

describe('RDFDataLoader', () => {
  let loader: RDFDataLoader;

  beforeEach(() => {
    loader = new RDFDataLoader();
  });

  describe('constructor', () => {
    it('should create an instance without errors', () => {
      expect(loader).toBeInstanceOf(RDFDataLoader);
    });
  });

  describe('queryMultiverseData', () => {
    it('should throw error when no data is loaded', () => {
      expect(() => loader.queryMultiverseData()).toThrow('No RDF data loaded');
    });
  });

  describe('getDataset', () => {
    it('should return null when no data is loaded', () => {
      expect(loader.getDataset()).toBeNull();
    });
  });

  // Note: Testing the full TTL loading would require mocking fetch
  // and providing actual TTL data, which would be more suitable for integration tests
});