// @ts-ignore - rdf-ext types are not available
import rdf from 'rdf-ext';
import { Parser } from 'n3';
import type { DatasetCore, NamedNode } from '@rdfjs/types';
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

  constructor() {
    // Namespaces are now handled by N3.js parser
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
   * Parse TTL string data into RDF dataset using N3.js parser
   */
  private async parseTTL(ttlData: string): Promise<DatasetCore> {
    return new Promise((resolve, reject) => {
      const dataset = rdf.dataset();
      const parser = new Parser();
      
      parser.parse(ttlData, (error: any, quad: any) => {
        if (error) {
          reject(new Error(`TTL parsing failed: ${error.message}`));
        } else if (quad) {
          // Convert N3.js quad to RDF/JS quad
          const rdfQuad = rdf.quad(
            rdf.namedNode(quad.subject.value),
            rdf.namedNode(quad.predicate.value),
            quad.object.termType === 'Literal' 
              ? rdf.literal(quad.object.value, quad.object.language || quad.object.datatype)
              : rdf.namedNode(quad.object.value)
          );
          dataset.add(rdfQuad);
        } else {
          // Parsing complete
          resolve(dataset);
        }
      });
    });
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