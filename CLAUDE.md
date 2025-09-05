# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive 3D visualization application for RDF multiverse data built with TypeScript, Three.js, and RDF-Ext. The application renders interconnected entities across multiple universe layers with touch-optimized controls and real-time performance optimizations.

## Common Development Commands

```bash
# Development server
npm run dev

# Build project
npm run build

# Preview production build  
npm run preview

# Type checking (lint equivalent)
npm run lint

# Unit tests
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:ui     # UI interface

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:run -- --coverage
```

## Architecture Overview

### Core Structure
- **MVC Pattern**: Clear separation between data (`src/data/`), visualization (`src/visualization/`), and UI (`src/ui/`)
- **Event-Driven**: Components communicate through event handlers for loose coupling
- **Mobile-First**: Touch controls and responsive design prioritized throughout

### Key Directories
- `src/data/` - RDF data loading and parsing using rdf-ext
- `src/visualization/` - Three.js scene management and 3D rendering engine
- `src/ui/` - User interface controls and state management
- `src/config/` - Performance settings and visualization constants
- `src/types/` - TypeScript type definitions
- `src/utils/` - Shared utility functions
- `data/` - RDF data files in Turtle (.ttl) format
- `tests/unit/` - Vitest unit tests
- `tests/e2e/` - Playwright end-to-end tests

### Data Flow
1. **RDFDataLoader** (`src/data/rdf-loader.ts`) loads and parses .ttl files
2. **MultiverseData** (`src/data/multiverse-data.ts`) transforms RDF into visualization data
3. **MultiverseVisualization** (`src/visualization/multiverse-visualization.ts`) manages Three.js scene
4. **UIController** (`src/ui/ui-controller.ts`) handles user interactions and state updates

### Key Technologies
- **Vite** - Build system with TypeScript path aliases (`@/*` maps to `./src/*`)
- **Three.js** - 3D graphics with custom scene management
- **RDF-Ext** - Standards-compliant RDF processing
- **Vitest** - Unit testing with jsdom environment
- **Playwright** - End-to-end testing

## Performance Configuration

Mobile performance settings in `src/config/index.ts`:
- Device pixel ratio capped at 1.5
- Configurable edge segments (default: 10)  
- Optional halo effects for low-end devices
- Throttled frame updates (every 2 frames)

## Data Format

The application expects RDF data in Turtle format with specific vocabulary:
- **Entities**: `mv:Universe`, `mv:Character`, `mv:Movie`
- **Properties**: `mv:belongsToUniverse`, `mv:hasPosition`, `mv:hasColor`, `mv:connectsTo`
- **Namespaces**: Defined in `src/config/index.ts`

## Testing Strategy

- **Unit Tests**: Utility functions and data processing (`tests/unit/`)
- **E2E Tests**: User interactions and visual rendering (`tests/e2e/`) 
- **Coverage**: Excludes node_modules, tests, dist, and public directories
- **Setup**: Test environment configured in `tests/setup.ts`

## Debug Access

The application exposes global debugging methods:
```javascript
window.multiverseViz.exportState()  // Get current state
window.multiverseViz.refreshData()  // Reload data
```