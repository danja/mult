import * as THREE from 'three';

// RDF and data types
export interface MultiverseNode {
  id: string;
  label: string;
  layer: string;
  x: number;
  y: number;
  z: number;
  subtitle?: string;
  type: 'character' | 'movie';
}

export interface MultiverseTriple {
  subject: string;
  predicate: string;
  object: string;
  layer: string;
}

export interface MultiverseLayer {
  name: string;
  color: number;
  height: number;
}

export interface SharedConnection {
  id: string;
  connectTo: string;
}

// Visualization types
export interface VisualizationNode {
  userData: MultiverseNode;
  position: THREE.Vector3;
  material: THREE.MeshBasicMaterial;
}

export interface VisualizationEdge {
  curve: THREE.QuadraticBezierCurve3;
  tube: THREE.Mesh;
  labelDiv: HTMLElement;
}

export interface CameraControls {
  radius: number;
  theta: number;
  phi: number;
}

// UI types
export type LabelMode = 'smart' | 'all' | 'none';

export interface UIState {
  animating: boolean;
  labelMode: LabelMode;
  showVerticalConnections: boolean;
  layersVisible: Record<string, boolean>;
  performanceMode: boolean;
}

export interface TouchState {
  isTouching: boolean;
  lastTouches: Touch[];
  pinchStartDist: number;
  lastX: number;
  lastY: number;
}

// Configuration types
export interface VisualizationConfig {
  dpr: number;
  edgeSegments: number;
  halos: boolean;
  labelSmartDistance: number;
  updateEvery: number;
}

// RDF Query types
export interface RDFQueryResult {
  nodes: MultiverseNode[];
  triples: MultiverseTriple[];
  layers: Record<string, MultiverseLayer>;
  sharedConnections: SharedConnection[];
}

// Event types
export interface NodeClickEvent {
  node: MultiverseNode;
  position: THREE.Vector3;
}

export interface LayerToggleEvent {
  layerName: string;
  visible: boolean;
}