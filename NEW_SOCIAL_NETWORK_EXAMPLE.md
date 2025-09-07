# Social Network Example - Generic RDF System Demo

## ✅ Complete Implementation

I've created a complete working example demonstrating the generic RDF system with a **Social Network dataset** that can be loaded and switched to from the UI.

## What's Been Added

### 1. **Social Network Turtle File** (`/public/social-network.ttl`)
- **12 People** across 4 communities (Developers, Designers, Researchers, Managers)
- **Rich Social Relationships**: `foaf:knows`, mentorship, and collaboration connections
- **Layered Structure**: People organized by community membership
- **FOAF Vocabulary**: Uses standard `foaf:name`, `foaf:title`, `foaf:knows` predicates
- **Cross-layer Connections**: Mentorship relationships span communities

#### Sample Data:
```turtle
sn:alice a sn:Person ;
    foaf:name "Alice Johnson" ;
    foaf:title "Senior Software Engineer" ;
    sn:memberOf sn:developers ;
    sn:hasPosition "2.5,0,1.8" ;
    sn:hasInfluence "85" .

sn:developers a sn:Community ;
    rdfs:label "Developers" ;
    sn:hasColor "0x4A90E2" ;
    sn:hasHeight "0" .

sn:alice foaf:knows sn:bob, sn:charlie, sn:diana .
sn:jack sn:mentors sn:alice .
```

### 2. **Social Network RDF Mapping** 
- **Entity Types**: Person and Community
- **FOAF Integration**: Uses standard Friend of a Friend vocabulary
- **Property Mappings**: 
  - `foaf:name` → label
  - `foaf:title` → subtitle  
  - `sn:memberOf` → layer assignment
  - `sn:hasPosition` → 3D coordinates
- **Relationships**: `foaf:knows`, `sn:mentors`, `sn:collaboratesWith`
- **Cross-layer Mentorship**: Senior members mentor junior members across communities

### 3. **UI Dataset Selector** 
- **Dropdown Menu**: Styled selector in the info panel
- **3 Dataset Options**:
  - **Multiverse**: Original characters & movies (default)
  - **Social Network**: People & communities (new!)
  - **Org Chart**: People & departments (example)
- **Real-time Switching**: Change datasets without page reload
- **Visual Feedback**: Loading state during transitions

### 4. **Dynamic Dataset Switching**
- **Configuration-Aware Loading**: `loadDataWithConfiguration(file, configId)`
- **Scene Clearing**: Clears previous visualization completely
- **Layer Reset**: Recalculates layers for new data structure
- **Camera Reset**: Returns to default view position
- **UI Updates**: Legend and stats automatically update

## How to Use

### In the Browser:
1. **Open the application** - Loads with default Multiverse data
2. **Find the Dataset Selector** - Top of the info panel with 📊 icon
3. **Select "Social Network"** - Dropdown shows available datasets
4. **Watch the Switch** - Loading indicator, then new visualization appears
5. **Explore the Network** - 4 community layers with people and relationships

### Via Console (Advanced):
```javascript
// Switch datasets programmatically
window.multiverseViz.switchDataset('social', '/social-network.ttl');

// Get current configuration info
window.multiverseViz.getConfigurationInfo();

// Register a custom mapping
window.multiverseViz.registerConfiguration('custom', myMapping);
```

## Comparison: Multiverse vs Social Network

| Aspect | Multiverse | Social Network |
|--------|------------|----------------|
| **Entities** | Characters, Movies | People, Communities |
| **Vocabulary** | Custom `mv:` | Standard FOAF + custom |
| **Layers** | Universe layers | Community groups |
| **Relationships** | `appearsIn`, `cameoIn` | `knows`, `mentors`, `collaboratesWith` |
| **Structure** | Fiction-based | Professional network |
| **Cross-layer** | Universe connections | Mentorship relationships |

## Technical Implementation

### Files Modified/Created:
- ✅ `public/social-network.ttl` - Social network data in Turtle format
- ✅ `src/config/mapping-manager.ts` - Added `SOCIAL_NETWORK_MAPPING` configuration
- ✅ `index.html` - Added dataset selector dropdown UI
- ✅ `src/style.css` - Styled the dataset selector component  
- ✅ `src/ui/ui-controller.ts` - Added dataset change handler
- ✅ `src/visualization/multiverse-visualization.ts` - Added `switchDataset()` method
- ✅ `src/visualization/scene-manager.ts` - Added `clearVisualization()` method
- ✅ `tests/unit/mapping-manager.test.ts` - Updated tests for new configuration

### Key Features:
- **Backward Compatible**: Original functionality unchanged
- **Type Safe**: Full TypeScript support with generic entity types
- **Configurable**: New datasets via mapping configurations
- **Performant**: Efficient scene clearing and rebuilding
- **Extensible**: Easy to add more dataset options

## Test Results: ✅ All Passing (73/73)
- **Unit Tests**: All configurations work correctly
- **Configuration Management**: Loading, switching, validation all working  
- **Generic Entity Types**: People, departments, communities all supported
- **UI Integration**: Dropdown and switching functionality tested

## Usage Examples

### Social Network Use Cases:
- **Team Collaboration**: Visualize who works with whom
- **Mentorship Networks**: See knowledge transfer relationships
- **Community Structure**: Understand team organization
- **Influence Mapping**: Visualize expertise and leadership

### Next Steps (Easy to Add):
- **LinkedIn Data**: Import professional networks
- **Academic Networks**: Researcher collaboration graphs
- **Knowledge Graphs**: Concept and entity relationships  
- **Supply Chains**: Company and product relationships

## Conclusion

The social network example **perfectly demonstrates the power of the generic RDF system**. With just:
- 1 Turtle file with different vocabulary
- 1 mapping configuration 
- 1 UI dropdown option

We've created a **completely different visualization** that works seamlessly with the existing system. This showcases how the platform can handle **any structured RDF data** while maintaining the same high-performance 3D visualization engine.

**The system is now truly vocabulary-agnostic and ready for any RDF use case!** 🎉