import type { MultiverseNode, MultiverseLayer, MultiverseTriple } from '@/types';

/**
 * Parse hex color string to number
 */
export function parseHexColor(colorStr: string): number {
  // Remove 0x prefix if present
  const hex = colorStr.replace('0x', '');
  return parseInt(hex, 16);
}

/**
 * Convert position string to coordinates
 */
export function parsePosition(positionStr: string): { x: number; y: number; z: number } | null {
  const coords = positionStr.split(',').map(coord => parseFloat(coord.trim()));
  if (coords.length !== 3 || coords.some(isNaN)) {
    return null;
  }
  return { x: coords[0], y: coords[1], z: coords[2] };
}

/**
 * Group nodes by their layer
 */
export function groupNodesByLayer(nodes: MultiverseNode[]): Record<string, MultiverseNode[]> {
  return nodes.reduce((acc, node) => {
    if (!acc[node.layer]) {
      acc[node.layer] = [];
    }
    acc[node.layer].push(node);
    return acc;
  }, {} as Record<string, MultiverseNode[]>);
}

/**
 * Filter nodes by type
 */
export function filterNodesByType(nodes: MultiverseNode[], type: 'character' | 'movie'): MultiverseNode[] {
  return nodes.filter(node => node.type === type);
}

/**
 * Find node by ID
 */
export function findNodeById(nodes: MultiverseNode[], id: string): MultiverseNode | undefined {
  return nodes.find(node => node.id === id);
}

/**
 * Get relationships for a specific node
 */
export function getNodeRelationships(nodeId: string, triples: MultiverseTriple[]): MultiverseTriple[] {
  return triples.filter(triple => triple.subject === nodeId || triple.object === nodeId);
}

/**
 * Calculate 3D distance between two nodes
 */
export function calculateDistance(node1: MultiverseNode, node2: MultiverseNode): number {
  const dx = node1.x - node2.x;
  const dy = node1.y - node2.y;
  const dz = node1.z - node2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Get unique layer names from nodes
 */
export function getUniqueLayerNames(nodes: MultiverseNode[]): string[] {
  const layerSet = new Set(nodes.map(node => node.layer));
  return Array.from(layerSet);
}

/**
 * Validate layer configuration
 */
export function validateLayers(layers: Record<string, MultiverseLayer>): boolean {
  for (const [key, layer] of Object.entries(layers)) {
    if (!layer.name || typeof layer.color !== 'number' || typeof layer.height !== 'number') {
      console.error(`Invalid layer configuration for ${key}:`, layer);
      return false;
    }
  }
  return true;
}

/**
 * Validate node data
 */
export function validateNodes(nodes: MultiverseNode[]): boolean {
  for (const node of nodes) {
    if (!node.id || !node.label || !node.layer || 
        typeof node.x !== 'number' || typeof node.y !== 'number' || typeof node.z !== 'number' ||
        !['character', 'movie'].includes(node.type)) {
      console.error('Invalid node data:', node);
      return false;
    }
  }
  return true;
}

/**
 * Create a node lookup map for faster access
 */
export function createNodeLookupMap(nodes: MultiverseNode[]): Map<string, MultiverseNode> {
  return new Map(nodes.map(node => [node.id, node]));
}

/**
 * Sort layers by height for proper rendering order
 */
export function sortLayersByHeight(layers: Record<string, MultiverseLayer>): [string, MultiverseLayer][] {
  return Object.entries(layers).sort(([, a], [, b]) => a.height - b.height);
}

/**
 * Generate layer statistics
 */
export function generateLayerStats(nodes: MultiverseNode[]): Record<string, { characters: number; movies: number; total: number }> {
  const stats: Record<string, { characters: number; movies: number; total: number }> = {};
  
  for (const node of nodes) {
    if (!stats[node.layer]) {
      stats[node.layer] = { characters: 0, movies: 0, total: 0 };
    }
    
    stats[node.layer].total++;
    if (node.type === 'character') {
      stats[node.layer].characters++;
    } else {
      stats[node.layer].movies++;
    }
  }
  
  return stats;
}

/**
 * Extract unique relationship types
 */
export function getUniqueRelationshipTypes(triples: MultiverseTriple[]): string[] {
  const relationTypes = new Set(triples.map(triple => triple.predicate));
  return Array.from(relationTypes);
}

/**
 * Sanitize string for use as CSS class or ID
 */
export function sanitizeForCSS(str: string): string {
  return str.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
}