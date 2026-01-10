/* ========================================
   BBAS - YOLO Detector Component
   Person detection using YOLOv8 ONNX model
   ======================================== */

import { CONFIG } from '../config/constants.js';

class Detector {
  constructor() {
    this.session = null;
    this.modelPath = null;
    this.isLoaded = false;
    this.isRunning = false;
    this.inputSize = 640; // YOLOv8 standard input size
    this.confidenceThreshold = CONFIG.DETECTION.DEFAULT_CONFIDENCE;
    this.nmsThreshold = CONFIG.DETECTION.NMS_THRESHOLD;

    console.log('[Detector] Detector initialized');
  }

  /**
   * Load YOLO model
   * @param {string} modelName - Model name (yolov8n or yolov8s)
   */
  async loadModel(modelName = 'yolov8n', progressCallback = null) {
    try {
      console.log(`[Detector] Loading model: ${modelName}`);

      // Get model path from config
      const modelConfig = CONFIG.MODELS[modelName.toUpperCase()];
      if (!modelConfig) {
        throw new Error(`Unknown model: ${modelName}`);
      }

      this.modelPath = modelConfig.path;

      // Report progress
      if (progressCallback) {
        progressCallback({ status: 'loading', progress: 0, message: 'Initializing...' });
      }

      // Create ONNX Runtime session with WebGL backend
      const options = {
        executionProviders: ['webgl', 'wasm'],
        graphOptimizationLevel: 'all'
      };

      this.session = await ort.InferenceSession.create(this.modelPath, options);

      this.isLoaded = true;

      if (progressCallback) {
        progressCallback({ status: 'loaded', progress: 100, message: 'Model loaded successfully' });
      }

      console.log('[Detector] Model loaded successfully');
      console.log('[Detector] Input names:', this.session.inputNames);
      console.log('[Detector] Output names:', this.session.outputNames);

      return true;

    } catch (error) {
      console.error('[Detector] Failed to load model:', error);
      this.isLoaded = false;

      if (progressCallback) {
        progressCallback({ status: 'error', progress: 0, message: error.message });
      }

      throw error;
    }
  }

  /**
   * Preprocess image for YOLO input
   * Resize to 640x640 and normalize
   */
  preprocessImage(imageData, width, height) {
    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    canvas.width = this.inputSize;
    canvas.height = this.inputSize;
    const ctx = canvas.getContext('2d');

    // Draw and resize image
    ctx.drawImage(
      this.createImageBitmap(imageData, width, height),
      0, 0, width, height,
      0, 0, this.inputSize, this.inputSize
    );

    // Get resized image data
    const resizedData = ctx.getImageData(0, 0, this.inputSize, this.inputSize);

    // Convert to float32 tensor [1, 3, 640, 640]
    // Normalize to [0, 1] and convert from HWC to CHW format
    const float32Data = new Float32Array(3 * this.inputSize * this.inputSize);

    for (let i = 0; i < this.inputSize * this.inputSize; i++) {
      float32Data[i] = resizedData.data[i * 4] / 255.0; // R
      float32Data[this.inputSize * this.inputSize + i] = resizedData.data[i * 4 + 1] / 255.0; // G
      float32Data[2 * this.inputSize * this.inputSize + i] = resizedData.data[i * 4 + 2] / 255.0; // B
    }

    return float32Data;
  }

  /**
   * Helper to create ImageBitmap-like object from ImageData
   */
  createImageBitmap(imageData, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const imgData = new ImageData(imageData, width, height);
    ctx.putImageData(imgData, 0, 0);

    return canvas;
  }

  /**
   * Run detection on video frame
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {Array} Array of detections [{x, y, width, height, confidence}]
   */
  async detect(videoElement) {
    if (!this.isLoaded || !this.session) {
      throw new Error('Model not loaded');
    }

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;

    // Extract frame
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;

    // Preprocess
    const inputTensor = this.preprocessImage(imageData, width, height);

    // Create ONNX tensor
    const tensor = new ort.Tensor('float32', inputTensor, [1, 3, this.inputSize, this.inputSize]);

    // Run inference
    const feeds = {};
    feeds[this.session.inputNames[0]] = tensor;

    const results = await this.session.run(feeds);
    const output = results[this.session.outputNames[0]];

    // Postprocess
    const detections = this.postprocess(output.data, width, height);

    return detections;
  }

  /**
   * Postprocess YOLO output
   * Parse detections, apply NMS, filter for person class
   */
  postprocess(output, originalWidth, originalHeight) {
    // YOLOv8 output format: [1, 84, 8400]
    // 84 = 4 bbox coords (xywh) + 80 class scores
    // 8400 = number of predictions

    const numPredictions = 8400;
    const numClasses = 80;
    const personClassId = CONFIG.DETECTION.PERSON_CLASS_ID; // 0 for person

    const boxes = [];

    // Parse predictions
    for (let i = 0; i < numPredictions; i++) {
      // Get class scores (skip first 4 bbox values)
      const classScores = [];
      for (let c = 0; c < numClasses; c++) {
        classScores.push(output[(4 + c) * numPredictions + i]);
      }

      // Get max class score and index
      const maxScore = Math.max(...classScores);
      const classId = classScores.indexOf(maxScore);

      // Filter for person class only and confidence threshold
      if (classId === personClassId && maxScore >= this.confidenceThreshold) {
        // Get bbox coordinates (xywh format, normalized)
        const x_center = output[0 * numPredictions + i];
        const y_center = output[1 * numPredictions + i];
        const w = output[2 * numPredictions + i];
        const h = output[3 * numPredictions + i];

        // Scale to input size (640x640)
        const scaleX = originalWidth / this.inputSize;
        const scaleY = originalHeight / this.inputSize;

        // Convert to xyxy format and scale to original image size
        const x1 = (x_center - w / 2) * scaleX;
        const y1 = (y_center - h / 2) * scaleY;
        const x2 = (x_center + w / 2) * scaleX;
        const y2 = (y_center + h / 2) * scaleY;

        boxes.push({
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
          confidence: maxScore,
          classId: classId
        });
      }
    }

    // Apply Non-Maximum Suppression
    const filteredBoxes = this.applyNMS(boxes, this.nmsThreshold);

    console.log(`[Detector] Detected ${filteredBoxes.length} person(s)`);

    return filteredBoxes;
  }

  /**
   * Apply Non-Maximum Suppression
   */
  applyNMS(boxes, iouThreshold) {
    // Sort by confidence descending
    boxes.sort((a, b) => b.confidence - a.confidence);

    const selected = [];
    const suppressed = new Set();

    for (let i = 0; i < boxes.length; i++) {
      if (suppressed.has(i)) continue;

      selected.push(boxes[i]);

      // Suppress overlapping boxes
      for (let j = i + 1; j < boxes.length; j++) {
        if (suppressed.has(j)) continue;

        const iou = this.calculateIOU(boxes[i], boxes[j]);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }

    return selected;
  }

  /**
   * Calculate Intersection over Union
   */
  calculateIOU(box1, box2) {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const box1Area = box1.width * box1.height;
    const box2Area = box2.width * box2.height;
    const unionArea = box1Area + box2Area - intersectionArea;

    return intersectionArea / unionArea;
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = threshold;
    console.log(`[Detector] Confidence threshold set to ${threshold}`);
  }

  /**
   * Get model info
   */
  getInfo() {
    return {
      isLoaded: this.isLoaded,
      modelPath: this.modelPath,
      inputSize: this.inputSize,
      confidenceThreshold: this.confidenceThreshold,
      nmsThreshold: this.nmsThreshold
    };
  }

  /**
   * Unload model
   */
  async unload() {
    if (this.session) {
      // ONNX Runtime doesn't have explicit cleanup in JS
      this.session = null;
      this.isLoaded = false;
      console.log('[Detector] Model unloaded');
    }
  }
}

export default Detector;
