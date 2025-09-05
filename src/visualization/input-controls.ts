import type { CameraControls, TouchState } from '@/types';
import { TOUCH_SETTINGS } from '@/config';

interface MouseState {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  button: number;
}

interface KeyState {
  [key: string]: boolean;
}

export class InputControls {
  private touchState: TouchState = {
    isTouching: false,
    lastTouches: [],
    pinchStartDist: 0,
    lastX: 0,
    lastY: 0,
  };

  private mouseState: MouseState = {
    isDragging: false,
    lastX: 0,
    lastY: 0,
    button: -1,
  };

  private keyState: KeyState = {};
  private keyRepeatTimer: number | null = null;

  private controls: CameraControls;
  private canvas: HTMLCanvasElement;
  private onCameraUpdate: (controls: CameraControls) => void;

  // Configuration
  private readonly KEYBOARD_SENSITIVITY = 0.05;
  private readonly MOUSE_SENSITIVITY = 0.005;
  private readonly WHEEL_SENSITIVITY = 0.1;
  private readonly KEY_REPEAT_DELAY = 16; // ~60fps

  constructor(
    canvas: HTMLCanvasElement, 
    initialControls: CameraControls,
    onCameraUpdate: (controls: CameraControls) => void
  ) {
    this.canvas = canvas;
    this.controls = { ...initialControls };
    this.onCameraUpdate = onCameraUpdate;
    
    this.setupEventListeners();
    this.startKeyboardLoop();
  }

  /**
   * Set up all event listeners (touch, mouse, keyboard)
   */
  private setupEventListeners(): void {
    // Touch events
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    
    // Mouse events
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), { passive: false });
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: false });
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), { passive: false });
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this), { passive: false });
    
    // Keyboard events (on window for global access)
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Focus events to ensure canvas can receive keyboard input
    this.canvas.addEventListener('click', () => this.canvas.focus());
    this.canvas.tabIndex = 0; // Make canvas focusable
  }

  // ===== TOUCH CONTROLS =====

  private onTouchStart(event: TouchEvent): void {
    this.touchState.isTouching = true;
    this.touchState.lastTouches = Array.from(event.touches);
    
    if (event.touches.length === 2) {
      this.touchState.pinchStartDist = this.calculateDistance(
        event.touches[0], 
        event.touches[1]
      );
    }
    
    if (event.touches.length === 1) {
      this.touchState.lastX = event.touches[0].clientX;
      this.touchState.lastY = event.touches[0].clientY;
    }
    
    event.preventDefault();
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.touchState.isTouching) return;
    
    if (event.touches.length === 1 && this.touchState.lastTouches.length === 1) {
      // Single finger orbit
      const dx = event.touches[0].clientX - this.touchState.lastX;
      const dy = event.touches[0].clientY - this.touchState.lastY;
      
      this.updateOrbit(dx * TOUCH_SETTINGS.orbitSensitivity, dy * TOUCH_SETTINGS.orbitSensitivity);
      
      this.touchState.lastX = event.touches[0].clientX;
      this.touchState.lastY = event.touches[0].clientY;
      
    } else if (event.touches.length === 2) {
      // Two finger pinch to zoom
      const currentDist = this.calculateDistance(event.touches[0], event.touches[1]);
      const scaleFactor = currentDist / (this.touchState.pinchStartDist || currentDist);
      
      this.updateZoom(scaleFactor, TOUCH_SETTINGS.zoomSensitivity);
      this.touchState.pinchStartDist = currentDist;
    }
    
    this.touchState.lastTouches = Array.from(event.touches);
    event.preventDefault();
  }

  private onTouchEnd(event: TouchEvent): void {
    this.touchState.isTouching = false;
    this.touchState.lastTouches = [];
    event.preventDefault();
  }

  // ===== MOUSE CONTROLS =====

  private onMouseDown(event: MouseEvent): void {
    this.mouseState.isDragging = true;
    this.mouseState.lastX = event.clientX;
    this.mouseState.lastY = event.clientY;
    this.mouseState.button = event.button;
    
    this.canvas.focus(); // Ensure canvas has focus for keyboard events
    event.preventDefault();
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.mouseState.isDragging) return;
    
    const dx = event.clientX - this.mouseState.lastX;
    const dy = event.clientY - this.mouseState.lastY;
    
    // Left mouse button for orbit
    if (this.mouseState.button === 0) {
      this.updateOrbit(dx * this.MOUSE_SENSITIVITY, dy * this.MOUSE_SENSITIVITY);
    }
    
    this.mouseState.lastX = event.clientX;
    this.mouseState.lastY = event.clientY;
    
    event.preventDefault();
  }

  private onMouseUp(event: MouseEvent): void {
    this.mouseState.isDragging = false;
    this.mouseState.button = -1;
    event.preventDefault();
  }

  private onWheel(event: WheelEvent): void {
    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
    this.updateZoom(zoomFactor, this.WHEEL_SENSITIVITY);
    event.preventDefault();
  }

  private onContextMenu(event: Event): void {
    event.preventDefault(); // Disable right-click context menu
  }

  // ===== KEYBOARD CONTROLS =====

  private onKeyDown(event: KeyboardEvent): void {
    // Only handle keys when canvas is focused or for global navigation keys
    if (document.activeElement !== this.canvas && !this.isGlobalKey(event.code)) {
      return;
    }

    this.keyState[event.code] = true;
    
    // Prevent arrow keys from scrolling the page
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keyState[event.code] = false;
  }

  private isGlobalKey(code: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(code);
  }

  private startKeyboardLoop(): void {
    const processKeys = () => {
      let needsUpdate = false;
      
      // Arrow keys for orbit
      if (this.keyState['ArrowLeft']) {
        this.controls.phi -= this.KEYBOARD_SENSITIVITY;
        needsUpdate = true;
      }
      if (this.keyState['ArrowRight']) {
        this.controls.phi += this.KEYBOARD_SENSITIVITY;
        needsUpdate = true;
      }
      if (this.keyState['ArrowUp']) {
        this.controls.theta -= this.KEYBOARD_SENSITIVITY;
        needsUpdate = true;
      }
      if (this.keyState['ArrowDown']) {
        this.controls.theta += this.KEYBOARD_SENSITIVITY;
        needsUpdate = true;
      }
      
      // Page Up/Down for zoom
      if (this.keyState['PageUp']) {
        this.controls.radius *= 0.98; // Zoom in
        needsUpdate = true;
      }
      if (this.keyState['PageDown']) {
        this.controls.radius *= 1.02; // Zoom out
        needsUpdate = true;
      }
      
      // Home/End for quick zoom
      if (this.keyState['Home']) {
        this.controls.radius *= 0.95; // Faster zoom in
        needsUpdate = true;
      }
      if (this.keyState['End']) {
        this.controls.radius *= 1.05; // Faster zoom out
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        this.constrainControls();
        this.onCameraUpdate(this.controls);
      }
      
      this.keyRepeatTimer = setTimeout(processKeys, this.KEY_REPEAT_DELAY);
    };
    
    processKeys();
  }

  // ===== CONTROL HELPERS =====

  private updateOrbit(deltaX: number, deltaY: number): void {
    this.controls.phi += deltaX;
    this.controls.theta -= deltaY;
    
    this.constrainControls();
    this.onCameraUpdate(this.controls);
  }

  private updateZoom(scaleFactor: number, sensitivity: number): void {
    this.controls.radius /= Math.pow(scaleFactor, sensitivity);
    
    this.constrainControls();
    this.onCameraUpdate(this.controls);
  }

  private constrainControls(): void {
    // Constrain theta to prevent camera flipping
    this.controls.theta = Math.max(
      TOUCH_SETTINGS.minTheta, 
      Math.min(TOUCH_SETTINGS.maxTheta, this.controls.theta)
    );
    
    // Constrain radius
    this.controls.radius = Math.max(
      TOUCH_SETTINGS.minRadius,
      Math.min(TOUCH_SETTINGS.maxRadius, this.controls.radius)
    );
  }

  private calculateDistance(touch1: Touch, touch2: Touch): number {
    return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
  }

  // ===== PUBLIC METHODS =====

  updateControls(newControls: Partial<CameraControls>): void {
    Object.assign(this.controls, newControls);
    this.constrainControls();
    this.onCameraUpdate(this.controls);
  }

  getControls(): CameraControls {
    return { ...this.controls };
  }

  reset(): void {
    this.controls.radius = 26;
    this.controls.theta = Math.PI / 4;
    this.controls.phi = Math.PI / 4;
    this.onCameraUpdate(this.controls);
  }

  setTopView(): void {
    this.controls.theta = 0.0001;
    this.controls.radius = 30;
    this.onCameraUpdate(this.controls);
  }

  dispose(): void {
    // Clear keyboard loop
    if (this.keyRepeatTimer) {
      clearTimeout(this.keyRepeatTimer);
      this.keyRepeatTimer = null;
    }
    
    // Remove touch event listeners
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    
    // Remove mouse event listeners
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    
    // Remove keyboard event listeners
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}