import { describe, it, expect } from 'vitest';
import {
  parseHexColor,
  parsePosition,
  groupNodesByLayer,
  filterNodesByType,
  findNodeById,
  calculateDistance,
  getUniqueLayerNames,
  validateNodes,
  validateLayers,
  sanitizeForCSS,
} from '@/utils/data-utils';
import type { MultiverseNode, MultiverseLayer } from '@/types';

describe('Data Utils', () => {
  describe('parseHexColor', () => {
    it('should parse hex colors with 0x prefix', () => {
      expect(parseHexColor('0xff3b30')).toBe(0xff3b30);
      expect(parseHexColor('0x0a84ff')).toBe(0x0a84ff);
    });

    it('should parse hex colors without prefix', () => {
      expect(parseHexColor('ff3b30')).toBe(0xff3b30);
      expect(parseHexColor('0a84ff')).toBe(0x0a84ff);
    });
  });

  describe('parsePosition', () => {
    it('should parse valid position strings', () => {
      expect(parsePosition('1.5, 2.0, -3.5')).toEqual({ x: 1.5, y: 2.0, z: -3.5 });
      expect(parsePosition('0,0,0')).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should return null for invalid position strings', () => {
      expect(parsePosition('1,2')).toBe(null);
      expect(parsePosition('a,b,c')).toBe(null);
      expect(parsePosition('')).toBe(null);
    });
  });

  describe('groupNodesByLayer', () => {
    it('should group nodes by their layer property', () => {
      const nodes: MultiverseNode[] = [
        { id: '1', label: 'Node 1', layer: 'layer1', x: 0, y: 0, z: 0, type: 'character' },
        { id: '2', label: 'Node 2', layer: 'layer1', x: 1, y: 1, z: 1, type: 'movie' },
        { id: '3', label: 'Node 3', layer: 'layer2', x: 2, y: 2, z: 2, type: 'character' },
      ];

      const grouped = groupNodesByLayer(nodes);

      expect(grouped).toEqual({
        layer1: [nodes[0], nodes[1]],
        layer2: [nodes[2]],
      });
    });
  });

  describe('filterNodesByType', () => {
    it('should filter nodes by type', () => {
      const nodes: MultiverseNode[] = [
        { id: '1', label: 'Character 1', layer: 'layer1', x: 0, y: 0, z: 0, type: 'character' },
        { id: '2', label: 'Movie 1', layer: 'layer1', x: 1, y: 1, z: 1, type: 'movie' },
        { id: '3', label: 'Character 2', layer: 'layer2', x: 2, y: 2, z: 2, type: 'character' },
      ];

      expect(filterNodesByType(nodes, 'character')).toEqual([nodes[0], nodes[2]]);
      expect(filterNodesByType(nodes, 'movie')).toEqual([nodes[1]]);
    });
  });

  describe('findNodeById', () => {
    const nodes: MultiverseNode[] = [
      { id: '1', label: 'Node 1', layer: 'layer1', x: 0, y: 0, z: 0, type: 'character' },
      { id: '2', label: 'Node 2', layer: 'layer1', x: 1, y: 1, z: 1, type: 'movie' },
    ];

    it('should find node by ID', () => {
      expect(findNodeById(nodes, '1')).toBe(nodes[0]);
      expect(findNodeById(nodes, '2')).toBe(nodes[1]);
    });

    it('should return undefined for non-existent ID', () => {
      expect(findNodeById(nodes, '999')).toBeUndefined();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate 3D distance between nodes', () => {
      const node1: MultiverseNode = { id: '1', label: 'Node 1', layer: 'layer1', x: 0, y: 0, z: 0, type: 'character' };
      const node2: MultiverseNode = { id: '2', label: 'Node 2', layer: 'layer1', x: 3, y: 4, z: 0, type: 'character' };

      expect(calculateDistance(node1, node2)).toBe(5); // 3-4-5 triangle
    });
  });

  describe('getUniqueLayerNames', () => {
    it('should return unique layer names', () => {
      const nodes: MultiverseNode[] = [
        { id: '1', label: 'Node 1', layer: 'layer1', x: 0, y: 0, z: 0, type: 'character' },
        { id: '2', label: 'Node 2', layer: 'layer1', x: 1, y: 1, z: 1, type: 'movie' },
        { id: '3', label: 'Node 3', layer: 'layer2', x: 2, y: 2, z: 2, type: 'character' },
      ];

      expect(getUniqueLayerNames(nodes)).toEqual(['layer1', 'layer2']);
    });
  });

  describe('validateNodes', () => {
    it('should validate correct node data', () => {
      const validNodes: MultiverseNode[] = [
        { id: '1', label: 'Node 1', layer: 'layer1', x: 0, y: 0, z: 0, type: 'character' },
        { id: '2', label: 'Node 2', layer: 'layer1', x: 1, y: 1, z: 1, type: 'movie' },
      ];

      expect(validateNodes(validNodes)).toBe(true);
    });

    it('should reject invalid node data', () => {
      const invalidNodes = [
        { id: '', label: 'Node 1', layer: 'layer1', x: 0, y: 0, z: 0, type: 'character' },
      ] as MultiverseNode[];

      expect(validateNodes(invalidNodes)).toBe(false);
    });
  });

  describe('validateLayers', () => {
    it('should validate correct layer data', () => {
      const validLayers: Record<string, MultiverseLayer> = {
        layer1: { name: 'Layer 1', color: 0xff3b30, height: 10 },
        layer2: { name: 'Layer 2', color: 0x0a84ff, height: 20 },
      };

      expect(validateLayers(validLayers)).toBe(true);
    });

    it('should reject invalid layer data', () => {
      const invalidLayers = {
        layer1: { name: '', color: 'invalid', height: 'invalid' },
      } as any;

      expect(validateLayers(invalidLayers)).toBe(false);
    });
  });

  describe('sanitizeForCSS', () => {
    it('should sanitize strings for CSS class names', () => {
      expect(sanitizeForCSS('Test String')).toBe('test_string');
      expect(sanitizeForCSS('special-chars@#$')).toBe('special-chars___');
      expect(sanitizeForCSS('MCU/Spider-Verse')).toBe('mcu_spider-verse');
    });
  });
});