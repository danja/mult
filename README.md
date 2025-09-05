# RDF Multiverse Visualization

A modern, interactive 3D visualization tool for exploring RDF data representing a multiverse of interconnected entities. Built with TypeScript, Three.js, and RDF-Ext, this application provides an immersive way to navigate and understand complex relationship graphs.

## 🚀 **Live Demo**

**[View Live Demo →](https://danja.github.io/mult/)**

The visualization is automatically deployed to GitHub Pages from the main branch.

![RDF Multiverse Visualization](https://via.placeholder.com/800x400/0f172a/64d2ff?text=RDF+Multiverse+Visualization)

## 🌟 Features

### 🎨 **Interactive 3D Visualization**
- **Multi-layered Universe Display**: Visualize different universes/layers in 3D space with distinct heights and colors
- **Dynamic Node Rendering**: Characters and movies represented as glowing spheres with customizable materials
- **Curved Edge Relationships**: Bezier curves connecting related entities with animated labels
- **Cross-Universe Connections**: Vertical columns showing shared entities across different universes

### 🎮 **Multi-Modal Input Controls**
- **Touch Controls**: 1-finger orbit • 2-finger pinch to zoom
- **Mouse Controls**: Click & drag to orbit • Wheel to zoom  
- **Keyboard Controls**: Arrow keys orbit • Page Up/Down zoom • Home/End fast zoom
- **Smart Camera**: Smooth orbital movement with constraints to prevent flipping
- **Multiple View Modes**: Top-down view, reset to default, and free exploration

### 🏷️ **Advanced Labeling System**
- **Smart Labels**: Distance-based label visibility for optimal readability
- **Three Label Modes**: Smart, All, or None based on user preference
- **Edge Labels**: Contextual relationship labels with predicate information

### 🎚️ **Real-time Controls**
- **Layer Visibility**: Toggle individual universe layers on/off
- **Animation Control**: Enable/disable floating node animations
- **Performance Mode**: Adjustable bloom effects for different device capabilities
- **Vertical Connections**: Toggle cross-universe connection visibility

### 📱 **Mobile-First Design**
- **Responsive UI**: Adapts to different screen sizes and orientations
- **Safe Area Support**: iOS notch and Android navigation bar compatible
- **Touch-Friendly Interface**: Large touch targets and gesture-optimized controls
- **Performance Optimized**: Reduced particle density and effects for mobile devices

### 🔧 **RDF Data Integration**
- **Standards Compliant**: Uses RDF-Ext for proper RDF data handling
- **Turtle Format Support**: Loads data from .ttl files with full vocabulary support
- **Dynamic Data Loading**: Async data loading with progress indicators
- **Error Handling**: Graceful error handling with user feedback

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- Modern web browser with WebGL support

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/rdf-multiverse-visualization.git
   cd rdf-multiverse-visualization
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Build for GitHub Pages deployment
npm run build:gh-pages

# Preview the production build
npm run preview
```

## 📦 **Deployment**

### GitHub Pages (Automatic)

The project is configured for automatic deployment to GitHub Pages:

1. **Push to main branch** - GitHub Actions will automatically build and deploy
2. **Live URL**: https://danja.github.io/mult/
3. **Build artifacts** are stored in the `dist/` directory
4. **Custom domain** can be configured in repository settings

The deployment workflow includes:
- Node.js 18 environment
- Dependency installation with `npm ci`  
- Production build with optimized assets
- Automatic deployment to GitHub Pages

## 📊 Data Format

The application expects RDF data in Turtle (.ttl) format. Here's the structure:

### Vocabulary

```turtle
@prefix ex: <http://example.org/multiverse/> .
@prefix mv: <http://example.org/multiverse/vocab/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
```

### Entity Types

- `mv:Universe` - Represents a universe/layer
- `mv:Character` - Character entities
- `mv:Movie` - Movie/film entities

### Properties

- `mv:belongsToUniverse` - Links entities to their universe
- `mv:hasPosition` - 3D coordinates (format: "x,y,z")
- `mv:hasColor` - Color in hex format (e.g., "0xff3b30")
- `mv:hasHeight` - Y-coordinate for layer positioning
- `mv:appearsIn` - Character appears in movie
- `mv:cameoIn` - Character has cameo in movie
- `mv:connectsTo` - Cross-universe connections

### Example Data

```turtle
# Universe definition
ex:MCU a mv:Universe ;
    rdfs:label "MCU" ;
    mv:hasColor "0xff3b30" ;
    mv:hasHeight "0" .

# Character definition
ex:PeterParker_MCU a mv:Character ;
    rdfs:label "Peter Parker" ;
    mv:belongsToUniverse ex:MCU ;
    mv:hasPosition "0,0,0" ;
    mv:hasSubtitle "Tom Holland" .

# Movie definition
ex:NWH a mv:Movie ;
    rdfs:label "No Way Home" ;
    mv:belongsToUniverse ex:MCU ;
    mv:hasPosition "-6,0,1.6" .

# Relationship
ex:PeterParker_MCU mv:appearsIn ex:NWH .

# Cross-universe connection
ex:PeterParker_MCU mv:connectsTo ex:PeterParker_Raimi .
```

## 🏗️ Architecture

### Project Structure

```
src/
├── config/           # Configuration constants
├── data/            # RDF data handling
│   ├── rdf-loader.ts      # RDF parsing and loading
│   └── multiverse-data.ts # Data service wrapper
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── visualization/   # 3D visualization engine
│   ├── scene-manager.ts        # Three.js scene management
│   ├── touch-controls.ts       # Mobile touch handling
│   └── multiverse-visualization.ts # Main visualization controller
├── ui/              # User interface components
│   └── ui-controller.ts       # UI state management
└── main.ts          # Application entry point

data/
└── universe.ttl     # RDF data file

tests/
├── unit/            # Unit tests (Vitest)
└── e2e/             # End-to-end tests (Playwright)
```

### Core Technologies

- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Three.js](https://threejs.org/)** - 3D graphics library
- **[RDF-Ext](https://github.com/rdf-ext/rdf-ext)** - RDF processing library
- **[Vitest](https://vitest.dev/)** - Fast unit testing
- **[Playwright](https://playwright.dev/)** - End-to-end testing

### Design Patterns

- **MVC Architecture**: Clear separation of data, visualization, and UI concerns
- **Event-Driven**: Loose coupling between components through event handlers
- **Reactive UI**: UI updates automatically based on visualization state
- **Mobile-First**: Touch controls and responsive design prioritized

## 🧪 Testing

### Unit Tests

Run unit tests with Vitest:

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui
```

### End-to-End Tests

Run E2E tests with Playwright:

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e
```

### Coverage

Generate test coverage report:

```bash
npm run test:run -- --coverage
```

## 📱 Mobile Support

### Touch Gestures

- **Single finger drag**: Orbit camera around the scene
- **Two finger pinch**: Zoom in/out
- **Button taps**: All UI controls are touch-optimized

### Performance Optimizations

- Reduced particle density on mobile devices
- Lower device pixel ratio capping
- Fewer geometry segments for edges
- Optional halo effects that can be disabled

### Responsive Design

- Adaptive UI panel sizing
- Safe area inset support for iOS
- High contrast and reduced motion accessibility support

## 🎛️ API Reference

### MultiverseVisualization

Main visualization controller class:

```typescript
const visualization = new MultiverseVisualization(containerElement);

// Initialize with data
await visualization.initialize('/universe.ttl');

// Control methods
visualization.toggleAnimation();
visualization.setLabelMode('smart' | 'all' | 'none');
visualization.toggleLayer(layerName);
visualization.resetCamera();
visualization.setTopView();

// State access
const uiState = visualization.getUIState();
const data = visualization.getData();
const stats = visualization.getDataStats();
```

### UIController

UI management class:

```typescript
const uiController = new UIController(visualization);

// Show/hide loading
uiController.showLoading();
uiController.hideLoading();

// Update UI from visualization state
uiController.updateFromVisualization();
```

### RDFDataLoader

Data loading and parsing:

```typescript
const loader = new RDFDataLoader();
await loader.loadTTL('/universe.ttl');
const data = loader.queryMultiverseData();
```

## 🔧 Configuration

### Visualization Settings

Edit `src/config/index.ts` to customize:

```typescript
export const VISUALIZATION_CONFIG = {
  dpr: Math.min(1.5, window.devicePixelRatio),
  edgeSegments: 10,
  halos: true,
  labelSmartDistance: 24,
  updateEvery: 2,
};
```

### Performance Tuning

- **Reduce `edgeSegments`** for better performance on low-end devices
- **Disable `halos`** if frame rate is too low
- **Increase `updateEvery`** to throttle UI updates further
- **Lower `labelSmartDistance`** to show fewer labels

## 🐛 Troubleshooting

### Common Issues

**White/blank screen:**
- Check browser console for errors
- Ensure WebGL is supported and enabled
- Verify the TTL file is accessible at `/universe.ttl`

**Performance issues:**
- Enable performance mode in the UI
- Reduce visualization settings in config
- Check device specifications meet requirements

**Touch controls not working:**
- Ensure the page isn't being scrolled by other elements
- Check that touch-action CSS is properly set
- Verify mobile viewport meta tag is present

**Data not loading:**
- Check TTL file format and syntax
- Verify all required properties are present
- Look for network errors in developer tools

### Debug Mode

The application exposes a global debug object:

```javascript
// In browser console
window.multiverseViz.exportState(); // Get current state
window.multiverseViz.refreshData(); // Reload data
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Make your changes
6. Run tests: `npm run test:run && npm run test:e2e`
7. Commit changes: `git commit -m 'Add amazing feature'`
8. Push to branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Code Style

- TypeScript with strict mode enabled
- ESLint and Prettier for code formatting
- Comprehensive JSDoc comments for public APIs
- Unit tests for utility functions
- E2E tests for user interactions

### Pull Request Guidelines

- Include tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow existing code patterns
- Add meaningful commit messages

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js community** for the excellent 3D graphics library
- **RDF-EXT project** for robust RDF processing tools
- **Vite team** for the lightning-fast build system
- **Original visualization inspiration** from the reference implementation

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-username/rdf-multiverse-visualization/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/rdf-multiverse-visualization/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/rdf-multiverse-visualization/discussions)

---

Built with ❤️ using modern web technologies for exploring the interconnected nature of multiversal data.