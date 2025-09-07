import type { VisualizationConfig } from '../types';
import { DEFAULT_MULTIVERSE_MAPPING } from './rdf-mapping';

// Mobile performance optimizations
export const VISUALIZATION_CONFIG: VisualizationConfig = {
  dpr: Math.min(1.5, window.devicePixelRatio || 1), // Cap device pixel ratio
  edgeSegments: 10, // Fewer segments for better performance
  halos: true, // Set false if performance issues
  labelSmartDistance: 24, // Lower = fewer labels visible
  updateEvery: 2, // Throttle frame updates
};

// RDF namespaces (deprecated - use mapping configuration instead)
// Kept for backward compatibility
export const NAMESPACES = {
  ex: 'http://example.org/multiverse/',
  mv: 'http://example.org/multiverse/vocab/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
};

// Default RDF mapping configuration
export const DEFAULT_RDF_MAPPING = DEFAULT_MULTIVERSE_MAPPING;

// Default camera settings
export const DEFAULT_CAMERA_SETTINGS = {
  radius: 26,
  theta: Math.PI / 4,
  phi: Math.PI / 4,
  fov: 70,
  near: 0.1,
  far: 1000,
};

// Bloom effect settings
export const BLOOM_SETTINGS = {
  strength: 0.55,
  radius: 0.35,
  threshold: 0.0,
  performanceModeStrength: 1.1,
};

// Layer visualization settings
export const LAYER_SETTINGS = {
  slabSize: 16,
  slabThickness: 0.14,
  planeOpacity: 0.05,
  nodeRadius: 0.48,
  nodeSphereDetail: { widthSegments: 24, heightSegments: 16 },
  haloScale: 1.8,
  tubeRadius: 0.10,
  tubeRadialSegments: 8,
  verticalColumnRadius: 0.12,
  verticalColumnSegments: 12,
};

// Touch control settings
export const TOUCH_SETTINGS = {
  orbitSensitivity: 0.005,
  zoomSensitivity: 0.25,
  minRadius: 8,
  maxRadius: 60,
  minTheta: 0.0001,
  maxTheta: Math.PI - 0.0001,
};