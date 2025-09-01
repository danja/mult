import rdf from 'rdf-ext';
import type { DatasetCore, Quad, NamedNode } from '@rdfjs/types';
import type { 
  MultiverseNode, 
  MultiverseTriple, 
  MultiverseLayer, 
  SharedConnection, 
  RDFQueryResult 
} from '@/types';
import { NAMESPACES } from '@/config';

export class RDFDataLoader {
  private dataset: DatasetCore | null = null;
  private namespaces: Record<string, NamedNode>;

  constructor() {
    this.namespaces = {
      ex: rdf.namedNode(NAMESPACES.ex),
      mv: rdf.namedNode(NAMESPACES.mv),
      rdf: rdf.namedNode(NAMESPACES.rdf),
      rdfs: rdf.namedNode(NAMESPACES.rdfs),
      xsd: rdf.namedNode(NAMESPACES.xsd),
    };
  }

  /**
   * Load and parse TTL data from a file or URL
   */
  async loadTTL(source: string): Promise<void> {
    try {
      let ttlData: string;
      
      if (source.startsWith('http')) {
        // Load from URL
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(`Failed to fetch TTL data: ${response.statusText}`);
        }
        ttlData = await response.text();
      } else {
        // Load from local file (via fetch for browser compatibility)
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(`Failed to load local TTL file: ${response.statusText}`);
        }
        ttlData = await response.text();
      }

      // Parse TTL data using RDF-Ext
      this.dataset = await this.parseTTL(ttlData);
    } catch (error) {
      console.error('Error loading TTL data:', error);
      throw new Error(`Failed to load RDF data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse TTL string data into RDF dataset
   */
  private async parseTTL(ttlData: string): Promise<DatasetCore> {
    try {
      // Create a simple TTL parser for our specific data format
      return this.parseSimpleTTL(ttlData);
    } catch (error) {
      throw new Error(`TTL parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simple TTL parser for our specific data structure
   */
  private parseSimpleTTL(ttlData: string): DatasetCore {
    const dataset = rdf.dataset();
    const lines = ttlData.split('\n');
    
    let currentSubject: NamedNode | null = null;
    
    for (let line of lines) {
      line = line.trim();
      
      // Skip comments and empty lines
      if (!line || line.startsWith('#') || line.startsWith('@')) {
        continue;
      }
      
      // Handle triple statements
      if (line.includes(' a ') || line.includes(' rdfs:') || line.includes(' mv:')) {
        const parts = this.parseTripleLine(line);
        if (parts) {
          const { subject, predicate, object } = parts;
          const quad = rdf.quad(
            rdf.namedNode(subject),
            rdf.namedNode(predicate),
            object.startsWith('"') ? rdf.literal(object.slice(1, -1)) : rdf.namedNode(object)
          );
          dataset.add(quad);
          
          if (!currentSubject || subject !== currentSubject.value) {
            currentSubject = rdf.namedNode(subject);
          }
        }
      }
    }
    
    return dataset;
  }

  /**
   * Parse a single triple line
   */
  private parseTripleLine(line: string): { subject: string; predicate: string; object: string } | null {
    // Remove trailing semicolon or period
    line = line.replace(/[;.]$/, '').trim();
    
    // Simple regex to parse subject predicate object
    const match = line.match(/^(\S+)\s+(\S+)\s+(.+)$/);
    if (!match) return null;
    
    let [, subject, predicate, object] = match;
    
    // Expand prefixes
    subject = this.expandPrefix(subject);
    predicate = this.expandPrefix(predicate);
    object = this.expandPrefix(object);
    
    return { subject, predicate, object };
  }

  /**
   * Expand namespace prefixes
   */
  private expandPrefix(term: string): string {
    if (term.startsWith('"') && term.endsWith('"')) {
      return term; // Keep literals as-is
    }
    
    if (term.includes(':')) {
      const [prefix, local] = term.split(':', 2);
      switch (prefix) {
        case 'ex':
          return NAMESPACES.ex + local;
        case 'mv':
          return NAMESPACES.mv + local;
        case 'rdf':
          return NAMESPACES.rdf + local;
        case 'rdfs':
          return NAMESPACES.rdfs + local;
        case 'xsd':
          return NAMESPACES.xsd + local;
        default:
          return term;
      }
    }
    
    return term;
  }

  /**
   * Query the loaded dataset and extract visualization data
   */
  queryMultiverseData(): RDFQueryResult {
    if (!this.dataset) {
      throw new Error('No RDF data loaded. Call loadTTL() first.');
    }

    const nodes = this.extractNodes();
    const triples = this.extractTriples();
    const layers = this.extractLayers();
    const sharedConnections = this.extractSharedConnections();

    return {
      nodes,
      triples,
      layers,
      sharedConnections,
    };
  }

  /**
   * Extract nodes (characters and movies) from the dataset
   */
  private extractNodes(): MultiverseNode[] {
    if (!this.dataset) return [];

    const nodes: MultiverseNode[] = [];
    const characterType = rdf.namedNode(`${NAMESPACES.mv}Character`);
    const movieType = rdf.namedNode(`${NAMESPACES.mv}Movie`);

    // Get all entities that are either characters or movies
    for (const quad of this.dataset) {
      if (quad.predicate.equals(rdf.namedNode(`${NAMESPACES.rdf}type`)) &&
          (quad.object.equals(characterType) || quad.object.equals(movieType))) {
        
        const entityUri = quad.subject as NamedNode;
        const entityType = quad.object.equals(characterType) ? 'character' : 'movie';
        
        const node = this.buildNodeFromEntity(entityUri, entityType);
        if (node) {
          nodes.push(node);
        }
      }
    }

    return nodes;
  }

  /**
   * Build a MultiverseNode from an RDF entity
   */
  private buildNodeFromEntity(entityUri: NamedNode, type: 'character' | 'movie'): MultiverseNode | null {
    if (!this.dataset) return null;

    const label = this.getPropertyValue(entityUri, rdf.namedNode(`${NAMESPACES.rdfs}label`));
    const position = this.getPropertyValue(entityUri, rdf.namedNode(`${NAMESPACES.mv}hasPosition`));
    const universe = this.getPropertyValue(entityUri, rdf.namedNode(`${NAMESPACES.mv}belongsToUniverse`));
    const subtitle = this.getPropertyValue(entityUri, rdf.namedNode(`${NAMESPACES.mv}hasSubtitle`));

    if (!label || !position || !universe) {
      console.warn(`Incomplete data for entity: ${entityUri.value}`);
      return null;
    }

    // Parse position coordinates
    const coords = position.split(',').map(Number);
    if (coords.length !== 3) {
      console.warn(`Invalid position format for entity: ${entityUri.value}`);
      return null;
    }

    // Extract layer name from universe URI
    const layerName = universe.split('/').pop() || '';

    return {
      id: entityUri.value,
      label,
      layer: layerName,
      x: coords[0],
      y: coords[1],
      z: coords[2],
      subtitle: subtitle || undefined,
      type,
    };
  }

  /**
   * Extract relationship triples from the dataset
   */
  private extractTriples(): MultiverseTriple[] {
    if (!this.dataset) return [];

    const triples: MultiverseTriple[] = [];
    const appearsIn = rdf.namedNode(`${NAMESPACES.mv}appearsIn`);
    const cameoIn = rdf.namedNode(`${NAMESPACES.mv}cameoIn`);

    for (const quad of this.dataset) {
      if (quad.predicate.equals(appearsIn) || quad.predicate.equals(cameoIn)) {
        const subject = quad.subject.value;
        const predicate = quad.predicate.value;
        const object = quad.object.value;
        
        // Determine layer from the subject entity
        const subjectNode = quad.subject as NamedNode;
        const universe = this.getPropertyValue(subjectNode, rdf.namedNode(`${NAMESPACES.mv}belongsToUniverse`));
        const layer = universe ? universe.split('/').pop() || '' : '';

        triples.push({
          subject,
          predicate,
          object,
          layer,
        });
      }
    }

    return triples;
  }

  /**
   * Extract layer/universe definitions from the dataset
   */
  private extractLayers(): Record<string, MultiverseLayer> {
    if (!this.dataset) return {};

    const layers: Record<string, MultiverseLayer> = {};
    const universeType = rdf.namedNode(`${NAMESPACES.mv}Universe`);

    for (const quad of this.dataset) {
      if (quad.predicate.equals(rdf.namedNode(`${NAMESPACES.rdf}type`)) &&
          quad.object.equals(universeType)) {
        
        const universeUri = quad.subject as NamedNode;
        const name = this.getPropertyValue(universeUri, rdf.namedNode(`${NAMESPACES.rdfs}label`));
        const colorStr = this.getPropertyValue(universeUri, rdf.namedNode(`${NAMESPACES.mv}hasColor`));
        const heightStr = this.getPropertyValue(universeUri, rdf.namedNode(`${NAMESPACES.mv}hasHeight`));

        if (name && colorStr && heightStr) {
          const layerKey = universeUri.value.split('/').pop() || '';
          const color = parseInt(colorStr, 16);
          const height = parseFloat(heightStr);

          layers[layerKey] = {
            name,
            color,
            height,
          };
        }
      }
    }

    return layers;
  }

  /**
   * Extract shared connections between entities
   */
  private extractSharedConnections(): SharedConnection[] {
    if (!this.dataset) return [];

    const connections: SharedConnection[] = [];
    const connectsTo = rdf.namedNode(`${NAMESPACES.mv}connectsTo`);

    for (const quad of this.dataset) {
      if (quad.predicate.equals(connectsTo)) {
        connections.push({
          id: quad.subject.value,
          connectTo: quad.object.value,
        });
      }
    }

    return connections;
  }

  /**
   * Helper method to get a property value from an entity
   */
  private getPropertyValue(subject: NamedNode, property: NamedNode): string | null {
    if (!this.dataset) return null;

    for (const quad of this.dataset.match(subject, property)) {
      return quad.object.value;
    }
    return null;
  }

  /**
   * Get the loaded dataset (for advanced queries)
   */
  getDataset(): DatasetCore | null {
    return this.dataset;
  }
}