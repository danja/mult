import { CameraControls, TouchState } from '@/types';
import { TOUCH_SETTINGS } from '@/config';

export class TouchControls {
  private touchState: TouchState = {
    isTouching: false,
    lastTouches: [],
    pinchStartDist: 0,
    lastX: 0,
    lastY: 0,
  };

  private controls: CameraControls;
  private canvas: HTMLCanvasElement;
  private onCameraUpdate: (controls: CameraControls) => void;

  constructor(
    canvas: HTMLCanvasElement, 
    initialControls: CameraControls,
    onCameraUpdate: (controls: CameraControls) => void
  ) {
    this.canvas = canvas;
    this.controls = { ...initialControls };
    this.onCameraUpdate = onCameraUpdate;
    
    this.setupEventListeners();
  }

  /**
   * Set up touch event listeners
   */
  private setupEventListeners(): void {
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
  }

  /**
   * Handle touch start events
   */
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

  /**
   * Handle touch move events
   */
  private onTouchMove(event: TouchEvent): void {
    if (!this.touchState.isTouching) return;
    
    if (event.touches.length === 1 && this.touchState.lastTouches.length === 1) {
      // Single finger orbit
      const dx = event.touches[0].clientX - this.touchState.lastX;
      const dy = event.touches[0].clientY - this.touchState.lastY;
      
      this.controls.phi -= dx * TOUCH_SETTINGS.orbitSensitivity;
      this.controls.theta -= dy * TOUCH_SETTINGS.orbitSensitivity;
      
      // Constrain theta to prevent camera flipping
      this.controls.theta = Math.max(
        TOUCH_SETTINGS.minTheta, 
        Math.min(TOUCH_SETTINGS.maxTheta, this.controls.theta)
      );
      
      this.touchState.lastX = event.touches[0].clientX;
      this.touchState.lastY = event.touches[0].clientY;
      
      this.onCameraUpdate(this.controls);
      
    } else if (event.touches.length === 2) {
      // Two finger pinch to zoom
      const currentDist = this.calculateDistance(event.touches[0], event.touches[1]);
      const scaleFactor = currentDist / (this.touchState.pinchStartDist || currentDist);
      
      this.controls.radius /= Math.pow(scaleFactor, TOUCH_SETTINGS.zoomSensitivity);
      
      // Constrain radius
      this.controls.radius = Math.max(
        TOUCH_SETTINGS.minRadius,
        Math.min(TOUCH_SETTINGS.maxRadius, this.controls.radius)
      );
      
      this.touchState.pinchStartDist = currentDist;
      this.onCameraUpdate(this.controls);
    }
    
    this.touchState.lastTouches = Array.from(event.touches);
    event.preventDefault();
  }

  /**
   * Handle touch end events
   */
  private onTouchEnd(event: TouchEvent): void {
    this.touchState.isTouching = false;
    this.touchState.lastTouches = [];
    event.preventDefault();
  }

  /**
   * Calculate distance between two touch points
   */
  private calculateDistance(touch1: Touch, touch2: Touch): number {
    return Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
  }

  /**
   * Update camera controls programmatically
   */
  updateControls(newControls: Partial<CameraControls>): void {
    Object.assign(this.controls, newControls);
    this.onCameraUpdate(this.controls);
  }

  /**
   * Get current camera controls
   */
  getControls(): CameraControls {
    return { ...this.controls };
  }

  /**
   * Reset controls to default position
   */
  reset(): void {
    this.controls.radius = 26;
    this.controls.theta = Math.PI / 4;
    this.controls.phi = Math.PI / 4;
    this.onCameraUpdate(this.controls);
  }

  /**
   * Move to top-down view
   */
  setTopView(): void {
    this.controls.theta = 0.0001;
    this.controls.radius = 30;
    this.onCameraUpdate(this.controls);
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }
}