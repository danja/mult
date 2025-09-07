/**
 * Configuration system for mapping RDF vocabularies to visualization elements
 * This allows the application to work with any RDF vocabulary, not just the multiverse domain
 */

// Core mapping interfaces
export interface EntityTypeMapping {
  /** RDF class URI (e.g., "http://example.org/vocab/Person") */
  rdfClass: string;
  /** Display name for this entity type */
  label: string;
  /** Unique identifier for this entity type in the visualization */
  typeId: string;
}

export interface PropertyMapping {
  /** RDF property URI */
  rdfProperty: string;
  /** What visualization attribute this maps to */
  visualAttribute: 'label' | 'position' | 'layer' | 'color' | 'subtitle' | 'height';
  /** Whether this property is required for the entity to be visualized */
  required?: boolean;
  /** Optional transform function for property values */
  transform?: (value: string) => any;
}

export interface RelationshipMapping {
  /** RDF predicate URI that represents a connection */
  rdfPredicate: string;
  /** Display label for this relationship type */
  label: string;
  /** Visual style identifier */
  styleId?: string;
}

export interface LayerGrouping {
  /** RDF property that determines layer membership (e.g., "belongsToUniverse") */
  layerProperty: string;
  /** How to extract layer identifier from the property value */
  extractLayerId: (propertyValue: string) => string;
  /** RDF class that defines layer/group entities */
  layerClass?: string;
}

export interface VisualizationMapping {
  /** Supported entity types that can be visualized as nodes */
  entityTypes: EntityTypeMapping[];
  
  /** How RDF properties map to visualization attributes */
  properties: PropertyMapping[];
  
  /** Which RDF predicates represent relationships between entities */
  relationships: RelationshipMapping[];
  
  /** How entities are grouped into layers */
  layerGrouping: LayerGrouping;
  
  /** Cross-layer connection mappings */
  crossLayerConnections?: {
    /** RDF predicate for cross-layer connections */
    rdfPredicate: string;
    /** Display label */
    label: string;
  };

  /** Required namespaces for this mapping */
  namespaces: Record<string, string>;
}

// Default multiverse mapping (maintains backward compatibility)
export const DEFAULT_MULTIVERSE_MAPPING: VisualizationMapping = {
  entityTypes: [
    {
      rdfClass: 'http://example.org/multiverse/vocab/Character',
      label: 'Character',
      typeId: 'character'
    },
    {
      rdfClass: 'http://example.org/multiverse/vocab/Movie', 
      label: 'Movie',
      typeId: 'movie'
    }
  ],
  
  properties: [
    {
      rdfProperty: 'http://www.w3.org/2000/01/rdf-schema#label',
      visualAttribute: 'label',
      required: true
    },
    {
      rdfProperty: 'http://example.org/multiverse/vocab/hasPosition',
      visualAttribute: 'position',
      required: true,
      transform: (value: string) => {
        const coords = value.split(',').map(Number);
        return { x: coords[0], y: coords[1], z: coords[2] };
      }
    },
    {
      rdfProperty: 'http://example.org/multiverse/vocab/belongsToUniverse',
      visualAttribute: 'layer',
      required: true,
      transform: (value: string) => value.split('/').pop() || ''
    },
    {
      rdfProperty: 'http://example.org/multiverse/vocab/hasSubtitle',
      visualAttribute: 'subtitle',
      required: false
    },
    {
      rdfProperty: 'http://example.org/multiverse/vocab/hasColor',
      visualAttribute: 'color',
      required: false,
      transform: (value: string) => parseInt(value, 16)
    },
    {
      rdfProperty: 'http://example.org/multiverse/vocab/hasHeight',
      visualAttribute: 'height',
      required: false,
      transform: (value: string) => parseFloat(value)
    }
  ],
  
  relationships: [
    {
      rdfPredicate: 'http://example.org/multiverse/vocab/appearsIn',
      label: 'appears in'
    },
    {
      rdfPredicate: 'http://example.org/multiverse/vocab/cameoIn',
      label: 'cameo in'
    }
  ],
  
  layerGrouping: {
    layerProperty: 'http://example.org/multiverse/vocab/belongsToUniverse',
    extractLayerId: (value: string) => value.split('/').pop() || '',
    layerClass: 'http://example.org/multiverse/vocab/Universe'
  },
  
  crossLayerConnections: {
    rdfPredicate: 'http://example.org/multiverse/vocab/connectsTo',
    label: 'connects to'
  },
  
  namespaces: {
    ex: 'http://example.org/multiverse/',
    mv: 'http://example.org/multiverse/vocab/',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    xsd: 'http://www.w3.org/2001/XMLSchema#'
  }
};

// Example alternative mapping for a generic organizational chart
export const EXAMPLE_ORG_CHART_MAPPING: VisualizationMapping = {
  entityTypes: [
    {
      rdfClass: 'http://xmlns.com/foaf/0.1/Person',
      label: 'Person',
      typeId: 'person'
    },
    {
      rdfClass: 'http://example.org/org/Department',
      label: 'Department', 
      typeId: 'department'
    }
  ],
  
  properties: [
    {
      rdfProperty: 'http://xmlns.com/foaf/0.1/name',
      visualAttribute: 'label',
      required: true
    },
    {
      rdfProperty: 'http://example.org/org/hasPosition',
      visualAttribute: 'position',
      required: true,
      transform: (value: string) => {
        const coords = value.split(',').map(Number);
        return { x: coords[0], y: coords[1], z: coords[2] };
      }
    },
    {
      rdfProperty: 'http://example.org/org/belongsToDepartment',
      visualAttribute: 'layer',
      required: true,
      transform: (value: string) => value.split('/').pop() || ''
    },
    {
      rdfProperty: 'http://example.org/org/jobTitle',
      visualAttribute: 'subtitle',
      required: false
    }
  ],
  
  relationships: [
    {
      rdfPredicate: 'http://example.org/org/reportsTo',
      label: 'reports to'
    },
    {
      rdfPredicate: 'http://example.org/org/collaboratesWith',
      label: 'collaborates with'
    }
  ],
  
  layerGrouping: {
    layerProperty: 'http://example.org/org/belongsToDepartment',
    extractLayerId: (value: string) => value.split('/').pop() || '',
    layerClass: 'http://example.org/org/Department'
  },
  
  namespaces: {
    foaf: 'http://xmlns.com/foaf/0.1/',
    org: 'http://example.org/org/',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
  }
};

/**
 * Validate a visualization mapping configuration
 */
export function validateMapping(mapping: VisualizationMapping): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!mapping.entityTypes || mapping.entityTypes.length === 0) {
    errors.push('At least one entity type mapping is required');
  }
  
  // Check for required properties
  const hasLabel = mapping.properties.some(p => p.visualAttribute === 'label' && p.required);
  const hasPosition = mapping.properties.some(p => p.visualAttribute === 'position' && p.required);
  const hasLayer = mapping.properties.some(p => p.visualAttribute === 'layer' && p.required);
  
  if (!hasLabel) errors.push('A required label property mapping is needed');
  if (!hasPosition) errors.push('A required position property mapping is needed');
  if (!hasLayer) errors.push('A required layer property mapping is needed');
  
  // Check entity type uniqueness
  const typeIds = mapping.entityTypes.map(e => e.typeId);
  const uniqueTypeIds = new Set(typeIds);
  if (typeIds.length !== uniqueTypeIds.size) {
    errors.push('Entity type IDs must be unique');
  }
  
  // Check namespace completeness
  if (!mapping.namespaces || Object.keys(mapping.namespaces).length === 0) {
    errors.push('At least one namespace mapping is required');
  }
  
  return errors;
}