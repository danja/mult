# Generic RDF Visualization System

The RDF visualization system has been enhanced to support **any RDF vocabulary**, not just the original multiverse domain. This guide shows how to configure and use the system with different RDF data sources.

## Overview

The system now uses **configurable mappings** to define:
- Which RDF classes represent visualizable entities
- How RDF properties map to visualization attributes (position, color, layer, etc.)
- Which RDF predicates represent relationships between entities
- How entities are grouped into layers
- Cross-layer connections

## Backward Compatibility

**All existing code and data files continue to work unchanged.** The system defaults to the original multiverse configuration.

## Quick Start with Custom RDF Data

### 1. Using Built-in Configurations

```typescript
import { multiverseDataService, mappingManager } from '@/data';

// List available configurations
console.log(multiverseDataService.getAvailableConfigurations());
// Output: ['default', 'multiverse', 'orgchart']

// Load data with organizational chart mapping
const orgData = await multiverseDataService.loadDataWithConfiguration(
  'my-org-data.ttl', 
  'orgchart'
);
```

### 2. Creating a Custom Configuration

```typescript
import { mappingManager } from '@/data';
import type { VisualizationMapping } from '@/config/rdf-mapping';

// Define mapping for scientific publication network
const scienceMapping: VisualizationMapping = {
  entityTypes: [
    {
      rdfClass: 'http://purl.org/ontology/bibo/Article',
      label: 'Research Paper',
      typeId: 'paper'
    },
    {
      rdfClass: 'http://xmlns.com/foaf/0.1/Person', 
      label: 'Researcher',
      typeId: 'researcher'
    }
  ],
  
  properties: [
    {
      rdfProperty: 'http://purl.org/dc/terms/title',
      visualAttribute: 'label',
      required: true
    },
    {
      rdfProperty: 'http://example.org/hasPosition',
      visualAttribute: 'position', 
      required: true,
      transform: (value: string) => {
        const [x, y, z] = value.split(',').map(Number);
        return { x, y, z };
      }
    },
    {
      rdfProperty: 'http://purl.org/dc/terms/subject',
      visualAttribute: 'layer',
      required: true,
      transform: (value: string) => value.replace(/.*\//, '') // Extract last part of URI
    }
  ],
  
  relationships: [
    {
      rdfPredicate: 'http://purl.org/dc/terms/references',
      label: 'cites'
    },
    {
      rdfPredicate: 'http://xmlns.com/foaf/0.1/knows',
      label: 'collaborates with'
    }
  ],
  
  layerGrouping: {
    layerProperty: 'http://purl.org/dc/terms/subject',
    extractLayerId: (value: string) => value.replace(/.*\//, ''),
    layerClass: 'http://www.w3.org/2004/02/skos/core#Concept'
  },
  
  namespaces: {
    bibo: 'http://purl.org/ontology/bibo/',
    foaf: 'http://xmlns.com/foaf/0.1/', 
    dc: 'http://purl.org/dc/terms/',
    skos: 'http://www.w3.org/2004/02/skos/core#'
  }
};

// Register and use the configuration
mappingManager.registerConfiguration('science', scienceMapping);
const data = await multiverseDataService.loadDataWithConfiguration('papers.ttl', 'science');
```

## Configuration Examples

### Social Network Visualization

```typescript
const socialNetworkMapping = {
  entityTypes: [
    { rdfClass: 'http://xmlns.com/foaf/0.1/Person', label: 'Person', typeId: 'person' }
  ],
  properties: [
    { rdfProperty: 'http://xmlns.com/foaf/0.1/name', visualAttribute: 'label', required: true },
    { rdfProperty: 'http://example.org/location', visualAttribute: 'position', required: true },
    { rdfProperty: 'http://example.org/community', visualAttribute: 'layer', required: true }
  ],
  relationships: [
    { rdfPredicate: 'http://xmlns.com/foaf/0.1/knows', label: 'knows' }
  ],
  // ... rest of configuration
};
```

### Knowledge Graph Visualization

```typescript
const knowledgeGraphMapping = {
  entityTypes: [
    { rdfClass: 'http://www.w3.org/2004/02/skos/core#Concept', label: 'Concept', typeId: 'concept' },
    { rdfClass: 'http://example.org/Entity', label: 'Entity', typeId: 'entity' }
  ],
  relationships: [
    { rdfPredicate: 'http://www.w3.org/2004/02/skos/core#related', label: 'related to' },
    { rdfPredicate: 'http://www.w3.org/2004/02/skos/core#broader', label: 'broader than' }
  ],
  // ... rest of configuration
};
```

## Property Mapping Details

### Visualization Attributes

- **`label`** - Display name for the entity
- **`position`** - 3D coordinates `{x, y, z}`
- **`layer`** - Which layer/group the entity belongs to  
- **`color`** - Visual color (number or hex)
- **`subtitle`** - Additional descriptive text
- **`height`** - Layer height positioning

### Transform Functions

Transform functions convert RDF property values to visualization formats:

```typescript
{
  rdfProperty: 'http://example.org/coordinates',
  visualAttribute: 'position',
  transform: (value: string) => {
    const coords = value.split(',').map(Number);
    return { x: coords[0], y: coords[1], z: coords[2] };
  }
}
```

## Configuration Management API

### Loading Configurations

```typescript
// From JSON object
mappingManager.loadConfigurationFromJSON('myconfig', configObject);

// From URL
await mappingManager.loadConfigurationFromURL('remote', 'https://example.com/config.json');

// Switch active configuration
mappingManager.setActiveConfiguration('myconfig');
```

### Configuration Information

```typescript
// List all configurations
const configs = mappingManager.listConfigurationIds();

// Get detailed info
const info = mappingManager.getConfigurationInfo('science');
console.log(info.entityTypes); // ['paper', 'researcher']
console.log(info.namespaces);  // ['bibo', 'foaf', 'dc', 'skos']
```

### Import/Export

```typescript
// Export configuration as JSON
const json = mappingManager.exportConfiguration('science');

// Clone configuration
mappingManager.cloneConfiguration('science', 'science-modified');
```

## RDF Data Requirements

For any RDF vocabulary to work with the visualization, the data must include:

### Required Properties (configurable)
1. **Entity Label** - Human-readable name (`rdfs:label`, `foaf:name`, `dc:title`, etc.)
2. **3D Position** - Coordinates for visualization (`ex:hasPosition`, etc.)
3. **Layer Assignment** - Group membership (`ex:belongsToGroup`, `foaf:memberOf`, etc.)

### Optional Properties
- **Subtitle/Description** - Additional text
- **Color** - Visual styling information
- **Height** - Layer positioning

### Example RDF Data

```turtle
@prefix ex: <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

ex:alice a foaf:Person ;
  foaf:name "Alice Smith" ;
  ex:hasPosition "1.5,0,2.3" ;
  ex:memberOf ex:engineering ;
  ex:jobTitle "Senior Developer" .

ex:bob a foaf:Person ;
  foaf:name "Bob Jones" ;
  ex:hasPosition "-1.2,0,1.8" ;
  ex:memberOf ex:design ;
  foaf:knows ex:alice .

ex:engineering a ex:Department ;
  rdfs:label "Engineering" ;
  ex:hasColor "0x4287f5" ;
  ex:hasHeight "0" .
```

## Migration from Domain-Specific Code

### Before (Hard-coded)
```typescript
// Old: Hard-coded to multiverse vocabulary
const loader = new RDFDataLoader();
await loader.loadTTL('universe.ttl');
const data = loader.queryMultiverseData();
```

### After (Configurable)
```typescript
// New: Works with any vocabulary
const loader = new RDFDataLoader(myCustomMapping);
await loader.loadTTL('my-data.ttl');
const data = loader.queryData();

// Or use the service
const data = await multiverseDataService.loadDataWithConfiguration(
  'my-data.ttl', 
  'my-config'
);
```

### Existing Code Still Works
```typescript
// This continues to work unchanged
const data = await multiverseDataService.loadData('universe.ttl');
```

## Advanced Usage

### Runtime Configuration Switching

```typescript
// Switch configurations without reloading
multiverseDataService.switchConfiguration('orgchart');
const orgData = await multiverseDataService.refreshData('org.ttl');
```

### Configuration Validation

```typescript
import { validateMapping } from '@/config/rdf-mapping';

const errors = validateMapping(myMapping);
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
}
```

### Custom Entity Types

The system now supports unlimited entity types:

```typescript
// Before: Only 'character' | 'movie'
type: 'character'

// After: Any string
type: 'researcher' | 'publication' | 'institution' | 'concept'
```

This generic system maintains full backward compatibility while enabling visualization of any structured RDF data.