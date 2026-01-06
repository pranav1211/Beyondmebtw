/* ========================================
   BBAS - Camera Component
   Handles camera initialization, stream management,
   and frame extraction
   ======================================== */

import { CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES, EVENTS } from '../config/constants.js';
import logger from '../utils/logger.js';

class Camera {
  constructor(videoElement, loadingOverlay) {
    this.videoElement = videoElement;
    this.loadingOverlay = loadingOverlay;
    this.stream = null;
    this.isActive = false;
    this.devices = [];
    this.currentDeviceId = null;
    
    // Frame extraction
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fps = 0;
    
    // Canvas for frame extraction
    this.frameCanvas = document.createElement('canvas');
    this.frameContext = this.frameCanvas.getContext('2d', { willReadFrequently: true });
    
    // Event listeners storage
    this.eventListeners = new Map();
    
    logger.info('Camera', 'Camera component initialized');
  }
  
  /**
   * Initialize camera and enumerate devices
   */
  async initialize() {
    logger.info('Camera', 'Initializing camera...');
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      // Enumerate available devices
      await this.enumerateDevices();
      
      logger.info('Camera', `Found ${this.devices.length} camera device(s)`);
      return true;
      
    } catch (error) {
      logger.error('Camera', 'Failed to initialize camera', error);
      this.emit(EVENTS.CAMERA_ERROR, { error });
      throw error;
    }
  }
  
  /**
   * Enumerate available camera devices
   */
  async enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(device => device.kind === 'videoinput');
      
      logger.debug('Camera', 'Available devices:', this.devices);
      
      if (this.devices.length === 0) {
        throw new Error(ERROR_MESSAGES.CAMERA_NOT_FOUND);
      }
      
      return this.devices;
      
    } catch (error) {
      logger.error('Camera', 'Failed to enumerate devices', error);
      throw error;
    }
  }
  
  /**
   * Start camera stream
   */
  async start(deviceId = null) {
    logger.info('Camera', 'Starting camera stream...', { deviceId });
    
    // Show loading overlay
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
    }
    
    try {
      // Stop existing stream if any
      if (this.stream) {
        await this.stop();
      }
      
      // Build constraints
      const constraints = this.buildConstraints(deviceId);
      logger.debug('Camera', 'Using constraints:', constraints);
      
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set video source
      this.videoElement.srcObject = this.stream;
      
      // Wait for video to be ready
      await this.waitForVideoReady();
      
      // Update state
      this.isActive = true;
      this.currentDeviceId = deviceId;
      
      // Setup frame canvas
      this.setupFrameCanvas();
      
      // Start FPS counter
      this.startFPSCounter();
      
      // Hide loading overlay
      if (this.loadingOverlay) {
        this.loadingOverlay.classList.add('hidden');
      }
      
      // Emit ready event
      this.emit(EVENTS.CAMERA_READY, {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight,
        deviceId: this.currentDeviceId
      });
      
      logger.info('Camera', SUCCESS_MESSAGES.CAMERA_STARTED, {
        resolution: `${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`
      });
      
      return true;
      
    } catch (error) {
      logger.error('Camera', 'Failed to start camera', error);
      
      // Hide loading overlay
      if (this.loadingOverlay) {
        this.loadingOverlay.classList.add('hidden');
      }
      
      // Emit error event with user-friendly message
      const errorMessage = this.getErrorMessage(error);
      this.emit(EVENTS.CAMERA_ERROR, { error, message: errorMessage });
      
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Build camera constraints
   */
  buildConstraints(deviceId = null) {
    const constraints = {
      video: {
        width: { ideal: CONFIG.CAMERA.IDEAL_RESOLUTION.width },
        height: { ideal: CONFIG.CAMERA.IDEAL_RESOLUTION.height },
        frameRate: { ideal: CONFIG.CAMERA.FRAME_RATE }
      },
      audio: false
    };
    
    // Add device ID if specified
    if (deviceId) {
      constraints.video.deviceId = { exact: deviceId };
    } else if (CONFIG.CAMERA.FACING_MODE) {
      constraints.video.facingMode = CONFIG.CAMERA.FACING_MODE;
    }
    
    return constraints;
  }
  
  /**
   * Wait for video element to be ready
   */
  waitForVideoReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video load timeout'));
      }, 10000);
      
      if (this.videoElement.readyState >= 2) {
        clearTimeout(timeout);
        resolve();
      } else {
        this.videoElement.addEventListener('loadeddata', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      }
    });
  }
  
  /**
   * Setup frame extraction canvas
   */
  setupFrameCanvas() {
    this.frameCanvas.width = this.videoElement.videoWidth;
    this.frameCanvas.height = this.videoElement.videoHeight;
    
    logger.debug('Camera', 'Frame canvas setup', {
      width: this.frameCanvas.width,
      height: this.frameCanvas.height
    });
  }
  
  /**
   * Stop camera stream
   */
  async stop() {
    logger.info('Camera', 'Stopping camera stream...');
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        logger.debug('Camera', 'Track stopped', { label: track.label });
      });
      
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    this.isActive = false;
    this.stopFPSCounter();
    
    this.emit(EVENTS.CAMERA_STOPPED);
    
    logger.info('Camera', 'Camera stream stopped');
  }
  
  /**
   * Get current frame as ImageData
   */
  getFrame() {
    if (!this.isActive || !this.videoElement.videoWidth) {
      return null;
    }
    
    try {
      // Draw current video frame to canvas
      this.frameContext.drawImage(
        this.videoElement,
        0, 0,
        this.frameCanvas.width,
        this.frameCanvas.height
      );
      
      // Get image data
      const imageData = this.frameContext.getImageData(
        0, 0,
        this.frameCanvas.width,
        this.frameCanvas.height
      );
      
      this.frameCount++;
      
      return imageData;
      
    } catch (error) {
      logger.error('Camera', 'Failed to get frame', error);
      return null;
    }
  }
  
  /**
   * Get current frame as canvas (for model input)
   */
  getFrameCanvas() {
    if (!this.isActive || !this.videoElement.videoWidth) {
      return null;
    }
    
    try {
      this.frameContext.drawImage(
        this.videoElement,
        0, 0,
        this.frameCanvas.width,
        this.frameCanvas.height
      );
      
      this.frameCount++;
      
      return this.frameCanvas;
      
    } catch (error) {
      logger.error('Camera', 'Failed to get frame canvas', error);
      return null;
    }
  }
  
  /**
   * Get current frame as Blob (for saving/uploading)
   */
  async getFrameBlob(type = 'image/jpeg', quality = 0.9) {
    const canvas = this.getFrameCanvas();
    if (!canvas) return null;
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });
  }
  
  /**
   * Start FPS counter
   */
  startFPSCounter() {
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    
    this.fpsInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - this.lastFrameTime;
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      
      this.lastFrameTime = now;
      this.frameCount = 0;
      
      logger.debug('Camera', `FPS: ${this.fps}`);
      
    }, CONFIG.PERFORMANCE.FPS_UPDATE_INTERVAL);
  }
  
  /**
   * Stop FPS counter
   */
  stopFPSCounter() {
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }
  }
  
  /**
   * Get FPS
   */
  getFPS() {
    return this.fps;
  }
  
  /**
   * Get video dimensions
   */
  getDimensions() {
    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight
    };
  }
  
  /**
   * Get camera info
   */
  getInfo() {
    const track = this.stream ? this.stream.getVideoTracks()[0] : null;
    const settings = track ? track.getSettings() : null;
    
    return {
      isActive: this.isActive,
      deviceId: this.currentDeviceId,
      dimensions: this.getDimensions(),
      fps: this.fps,
      settings: settings
    };
  }
  
  /**
   * Switch to different camera
   */
  async switchCamera(deviceId) {
    logger.info('Camera', 'Switching camera', { deviceId });
    
    if (this.currentDeviceId === deviceId) {
      logger.warn('Camera', 'Already using this camera');
      return;
    }
    
    await this.start(deviceId);
  }
  
  /**
   * Get error message from error object
   */
  getErrorMessage(error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return ERROR_MESSAGES.CAMERA_PERMISSION_DENIED;
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return ERROR_MESSAGES.CAMERA_NOT_FOUND;
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return ERROR_MESSAGES.CAMERA_IN_USE;
    } else {
      return ERROR_MESSAGES.CAMERA_GENERIC;
    }
  }
  
  /**
   * Event emitter methods
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }
  
  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  
  emit(event, data) {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error('Camera', 'Error in event listener', { event, error });
      }
    });
  }
  
  /**
   * Cleanup
   */
  destroy() {
    logger.info('Camera', 'Destroying camera component');
    
    this.stop();
    this.stopFPSCounter();
    this.eventListeners.clear();
    
    if (this.frameCanvas) {
      this.frameCanvas.width = 0;
      this.frameCanvas.height = 0;
    }
  }
}

export default Camera;
