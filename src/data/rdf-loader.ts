// @ts-ignore - rdf-ext types are not available
import rdf from 'rdf-ext';
import { Parser } from 'n3';
import type { DatasetCore, NamedNode } from '@rdfjs/types';
import type { 
  MultiverseNode, 
  MultiverseTriple, 
  MultiverseLayer, 
  SharedConnection, 
  RDFQueryResult,
  ConfigurableRDFLoader
} from '@/types';
import type { VisualizationMapping } from '@/config/rdf-mapping';
import { DEFAULT_RDF_MAPPING } from '@/config';

export class RDFDataLoader implements ConfigurableRDFLoader {
  private dataset: DatasetCore | null = null;
  private mapping: VisualizationMapping = DEFAULT_RDF_MAPPING;

  constructor(mapping?: VisualizationMapping) {
    if (mapping) {
      this.mapping = mapping;
    }
  }

  /**
   * Load data using a specific mapping configuration
   */
  async loadWithMapping(source: string, mapping: VisualizationMapping): Promise<void> {
    this.mapping = mapping;
    await this.loadTTL(source);
  }

  /**
   * Set the mapping configuration
   */
  setMapping(mapping: VisualizationMapping): void {
    this.mapping = mapping;
  }

  /**
   * Get the current mapping configuration
   */
  getMapping(): VisualizationMapping {
    return this.mapping;
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
   * Query data using the loaded mapping configuration
   */
  queryData(): RDFQueryResult {
    if (!this.dataset) {
      throw new Error('No RDF data loaded. Call loadTTL() first.');
    }

    const nodes = this.extractEntities();
    const triples = this.extractRelationships();
    const layers = this.extractLayers();
    const sharedConnections = this.extractCrossLayerConnections();

    return {
      nodes,
      triples,
      layers,
      sharedConnections,
      mappingConfig: this.mapping,
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  queryMultiverseData(): RDFQueryResult {
    return this.queryData();
  }

  /**
   * Extract entities from the dataset using the mapping configuration
   */
  private extractEntities(): MultiverseNode[] {
    if (!this.dataset) return [];

    const nodes: MultiverseNode[] = [];
    const rdfType = rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
    
    // Create lookup for entity types
    const entityTypeMap = new Map<string, string>();
    this.mapping.entityTypes.forEach(entityType => {
      entityTypeMap.set(entityType.rdfClass, entityType.typeId);
    });

    // Find all entities of the configured types
    for (const quad of this.dataset) {
      if (quad.predicate.equals(rdfType) && entityTypeMap.has(quad.object.value)) {
        const entityUri = quad.subject as NamedNode;
        const typeId = entityTypeMap.get(quad.object.value)!;
        
        const node = this.buildEntityFromRDF(entityUri, typeId);
        if (node) {
          nodes.push(node);
        }
      }
    }

    return nodes;
  }

  /**
   * Build a MultiverseNode from an RDF entity using configuration mappings
   */
  private buildEntityFromRDF(entityUri: NamedNode, typeId: string): MultiverseNode | null {
    if (!this.dataset) return null;

    const node: Partial<MultiverseNode> = {
      id: entityUri.value,
      type: typeId,
      properties: {}
    };

    // Extract properties based on mapping configuration
    const requiredProps: string[] = [];
    for (const propMapping of this.mapping.properties) {
      const propertyValue = this.getPropertyValue(entityUri, rdf.namedNode(propMapping.rdfProperty));
      
      if (!propertyValue && propMapping.required) {
        requiredProps.push(propMapping.rdfProperty);
        continue;
      }

      if (propertyValue) {
        // Apply transform if specified
        const transformedValue = propMapping.transform 
          ? propMapping.transform(propertyValue)
          : propertyValue;

        // Map to visualization attribute
        switch (propMapping.visualAttribute) {
          case 'label':
            node.label = transformedValue;
            break;
          case 'position':
            if (typeof transformedValue === 'object' && transformedValue.x !== undefined) {
              node.x = transformedValue.x;
              node.y = transformedValue.y;
              node.z = transformedValue.z;
            } else {
              // Fallback: try to parse as comma-separated coordinates
              const coords = propertyValue.split(',').map(Number);
              if (coords.length === 3) {
                node.x = coords[0];
                node.y = coords[1]; 
                node.z = coords[2];
              }
            }
            break;
          case 'layer':
            node.layer = transformedValue;
            break;
          case 'subtitle':
            node.subtitle = transformedValue;
            break;
          default:
            // Store in additional properties
            if (node.properties) {
              node.properties[propMapping.rdfProperty] = transformedValue;
            }
        }
      }
    }

    // Check if all required properties are present
    if (requiredProps.length > 0) {
      console.warn(`Missing required properties for entity ${entityUri.value}:`, requiredProps);
      return null;
    }

    // Validate required fields
    if (!node.label || node.x === undefined || node.y === undefined || node.z === undefined || !node.layer) {
      console.warn(`Incomplete visualization data for entity: ${entityUri.value}`);
      return null;
    }

    return node as MultiverseNode;
  }

  /**
   * Extract relationships from the dataset using configuration mappings
   */
  private extractRelationships(): MultiverseTriple[] {
    if (!this.dataset) return [];

    const triples: MultiverseTriple[] = [];
    
    // Create set of relationship predicates from configuration
    const relationshipPredicates = new Set(
      this.mapping.relationships.map(rel => rel.rdfPredicate)
    );

    for (const quad of this.dataset) {
      if (relationshipPredicates.has(quad.predicate.value)) {
        const subject = quad.subject.value;
        const predicate = quad.predicate.value;
        const object = quad.object.value;
        
        // Determine layer from the subject entity
        const subjectNode = quad.subject as NamedNode;
        const layer = this.getEntityLayer(subjectNode);

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
   * Helper method to get layer assignment for an entity
   */
  private getEntityLayer(entityUri: NamedNode): string {
    const layerProperty = rdf.namedNode(this.mapping.layerGrouping.layerProperty);
    const layerValue = this.getPropertyValue(entityUri, layerProperty);
    
    if (layerValue) {
      return this.mapping.layerGrouping.extractLayerId(layerValue);
    }
    
    return '';
  }

  /**
   * Extract layer/group definitions from the dataset using configuration
   */
  private extractLayers(): Record<string, MultiverseLayer> {
    if (!this.dataset) return {};

    const layers: Record<string, MultiverseLayer> = {};
    
    // If no layer class is configured, return empty layers
    if (!this.mapping.layerGrouping.layerClass) {
      return layers;
    }

    const rdfType = rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
    const layerType = rdf.namedNode(this.mapping.layerGrouping.layerClass);

    for (const quad of this.dataset) {
      if (quad.predicate.equals(rdfType) && quad.object.equals(layerType)) {
        const layerUri = quad.subject as NamedNode;
        
        // Build layer from configured properties
        const layer: Partial<MultiverseLayer> = {};
        let layerKey = '';
        
        // Extract properties based on mapping configuration
        for (const propMapping of this.mapping.properties) {
          const propertyValue = this.getPropertyValue(layerUri, rdf.namedNode(propMapping.rdfProperty));
          
          if (propertyValue) {
            const transformedValue = propMapping.transform 
              ? propMapping.transform(propertyValue)
              : propertyValue;

            switch (propMapping.visualAttribute) {
              case 'label':
                layer.name = transformedValue;
                break;
              case 'color':
                layer.color = transformedValue;
                break;
              case 'height':
                layer.height = transformedValue;
                break;
            }
          }
        }

        // Generate layer key
        layerKey = this.mapping.layerGrouping.extractLayerId(layerUri.value);
        
        if (layer.name && layerKey) {
          layers[layerKey] = {
            name: layer.name,
            color: layer.color || 0x666666, // Default gray color
            height: layer.height || 0, // Default height
          };
        }
      }
    }

    return layers;
  }

  /**
   * Extract cross-layer connections between entities using configuration
   */
  private extractCrossLayerConnections(): SharedConnection[] {
    if (!this.dataset) return [];

    const connections: SharedConnection[] = [];
    
    // Check if cross-layer connections are configured
    if (!this.mapping.crossLayerConnections) {
      return connections;
    }

    const connectsPredicate = rdf.namedNode(this.mapping.crossLayerConnections.rdfPredicate);

    for (const quad of this.dataset) {
      if (quad.predicate.equals(connectsPredicate)) {
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