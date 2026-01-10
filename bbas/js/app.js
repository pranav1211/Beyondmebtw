// Main Application Orchestrator

import Camera from './components/Camera.js';
import BoundaryEditor from './components/BoundaryEditor.js';
import Detector from './components/Detector.js';
import storage from './utils/storage.js';
import { CONFIG } from './config/constants.js';
import { isPointInPolygon } from './utils/geometry.js';

class BBASApp {
    constructor() {
        this.camera = null;
        this.boundaryEditor = null;
        this.detector = null;
        this.canvas = null;
        this.ctx = null;

        // Detection state
        this.detectionLoop = null;
        this.lastDetections = [];

        this.init();
    }

    async init() {
        console.log('[BBAS] Application initializing...');

        // Get DOM elements
        const videoElement = document.getElementById('video');
        const loadingIndicator = document.getElementById('loading-indicator');
        this.canvas = document.getElementById('overlay-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize storage
        try {
            await storage.init();
            console.log('[BBAS] Storage initialized');
        } catch (error) {
            console.error('[BBAS] Storage initialization failed:', error);
        }

        // Initialize camera component
        this.camera = new Camera(videoElement, loadingIndicator);

        // Initialize boundary editor
        this.boundaryEditor = new BoundaryEditor(this.canvas);

        // Initialize detector
        this.detector = new Detector();

        // Setup event listeners
        this.setupEventListeners();

        // Update status
        this.updateStatus('camera', 'Off', false);
        this.updateStatus('model', 'Not Loaded', false);
        this.updateStatus('detection', 'Idle', false);

        // Update boundary count
        this.updateBoundaryCount();

        console.log('[BBAS] Application ready');
    }
    
    setupEventListeners() {
        // Camera controls
        document.getElementById('start-camera-btn').addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera-btn').addEventListener('click', () => this.stopCamera());

        // Boundary controls
        document.getElementById('draw-boundary-btn').addEventListener('click', () => this.drawBoundary());
        document.getElementById('clear-boundary-btn').addEventListener('click', () => this.clearBoundary());
        document.getElementById('save-boundary-btn').addEventListener('click', () => this.saveBoundary());
        document.getElementById('load-boundary-btn').addEventListener('click', () => this.loadBoundary());

        // Detection controls
        document.getElementById('load-model-btn').addEventListener('click', () => this.loadModel());
        document.getElementById('start-detection-btn').addEventListener('click', () => this.startDetection());
        document.getElementById('stop-detection-btn').addEventListener('click', () => this.stopDetection());

        // Confidence slider
        document.getElementById('confidence-threshold').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('confidence-value').textContent = value;
            if (this.detector) {
                this.detector.setConfidenceThreshold(value);
            }
        });

        // Alert cooldown slider
        document.getElementById('alert-cooldown').addEventListener('input', (e) => {
            document.getElementById('cooldown-value').textContent = e.target.value;
        });
    }
    
    async startCamera() {
        try {
            const startBtn = document.getElementById('start-camera-btn');
            const stopBtn = document.getElementById('stop-camera-btn');

            startBtn.disabled = true;

            await this.camera.start();

            // Get dimensions from camera
            const dimensions = this.camera.getDimensions();

            // Match canvas to video dimensions (no extension for now)
            this.canvas.width = dimensions.width;
            this.canvas.height = dimensions.height;

            // Reset canvas position
            this.canvas.style.left = '0';
            this.canvas.style.top = '0';

            console.log(`[BBAS] Canvas: ${dimensions.width}x${dimensions.height}, Video: ${dimensions.width}x${dimensions.height}`);

            stopBtn.disabled = false;

            // Enable boundary editor
            document.getElementById('draw-boundary-btn').disabled = false;
            document.getElementById('load-boundary-btn').disabled = false;

            // Enable model loading
            document.getElementById('load-model-btn').disabled = false;

            this.updateStatus('camera', 'Active', true);
            console.log('[BBAS] Camera started successfully');

        } catch (error) {
            document.getElementById('start-camera-btn').disabled = false;

            console.error('[BBAS] Failed to start camera:', error.message);
            alert(`Camera error: ${error.message}`);
        }
    }
    
    stopCamera() {
        this.camera.stop();
        
        document.getElementById('start-camera-btn').disabled = false;
        document.getElementById('stop-camera-btn').disabled = true;
        document.getElementById('draw-boundary-btn').disabled = true;
        document.getElementById('clear-boundary-btn').disabled = true;
        document.getElementById('save-boundary-btn').disabled = true;
        document.getElementById('load-boundary-btn').disabled = true;
        document.getElementById('load-model-btn').disabled = true;
        
        this.updateStatus('camera', 'Off', false);
    }
    
    updateStatus(type, text, isActive) {
        const statusMap = {
            camera: '📷 Camera',
            model: '🧠 Model',
            detection: '👁️ Detection'
        };

        const element = document.getElementById(`${type}-status`);
        element.textContent = `${statusMap[type]}: ${text}`;
        element.style.borderColor = isActive ? CONFIG.BOUNDARY.COLORS.POINT : '';
    }

    // Boundary Editor Methods

    drawBoundary() {
        const drawBtn = document.getElementById('draw-boundary-btn');
        const clearBtn = document.getElementById('clear-boundary-btn');
        const saveBtn = document.getElementById('save-boundary-btn');

        if (this.boundaryEditor.isDrawing) {
            // Stop drawing
            this.boundaryEditor.stopDrawing();
            drawBtn.textContent = 'Draw Boundary';
            drawBtn.classList.remove('btn-warning');
            drawBtn.classList.add('btn-primary');
        } else {
            // Start drawing
            this.boundaryEditor.startDrawing();
            drawBtn.textContent = 'Stop Drawing';
            drawBtn.classList.remove('btn-primary');
            drawBtn.classList.add('btn-warning');
            clearBtn.disabled = false;
        }

        // Update button states
        this.updateBoundaryButtons();
    }

    clearBoundary() {
        if (confirm('Clear all boundaries? This cannot be undone.')) {
            this.boundaryEditor.clear();
            this.updateBoundaryCount();
            this.updateBoundaryButtons();
            console.log('[BBAS] Boundaries cleared');
        }
    }

    async saveBoundary() {
        try {
            const boundaries = this.boundaryEditor.getBoundaries();

            if (boundaries.length === 0) {
                alert('No boundaries to save. Draw at least one boundary first.');
                return;
            }

            const id = await storage.saveBoundaries(boundaries);
            console.log('[BBAS] Boundaries saved with ID:', id);
            alert(`Boundaries saved successfully! (ID: ${id})`);

        } catch (error) {
            console.error('[BBAS] Failed to save boundaries:', error);
            alert('Failed to save boundaries. Check console for details.');
        }
    }

    async loadBoundary() {
        try {
            // Get latest boundaries
            const data = await storage.getLatestBoundaries();

            if (!data) {
                alert('No saved boundaries found.');
                return;
            }

            // Load boundaries into editor
            this.boundaryEditor.setBoundaries(data.boundaries);
            this.updateBoundaryCount();
            this.updateBoundaryButtons();

            console.log('[BBAS] Boundaries loaded:', data.name);
            alert(`Loaded: ${data.name}\n${data.count} boundary(ies)`);

        } catch (error) {
            console.error('[BBAS] Failed to load boundaries:', error);
            alert('Failed to load boundaries. Check console for details.');
        }
    }

    updateBoundaryCount() {
        const count = this.boundaryEditor ? this.boundaryEditor.getBoundaryCount() : 0;
        document.getElementById('boundary-count').textContent = `Boundaries: ${count}`;
    }

    updateBoundaryButtons() {
        const boundaries = this.boundaryEditor.getBoundaries();
        const hasBoundaries = boundaries.length > 0;

        document.getElementById('save-boundary-btn').disabled = !hasBoundaries;
        document.getElementById('clear-boundary-btn').disabled = !hasBoundaries && !this.boundaryEditor.isDrawing;
    }

    // Detection Methods

    async loadModel() {
        try {
            const modelSelect = document.getElementById('model-select');
            const modelName = modelSelect.value;
            const loadBtn = document.getElementById('load-model-btn');
            const startBtn = document.getElementById('start-detection-btn');

            loadBtn.disabled = true;
            loadBtn.textContent = 'Loading...';

            this.updateStatus('model', 'Loading...', false);

            // Load model with progress callback
            await this.detector.loadModel(modelName, (progress) => {
                console.log('[BBAS] Model loading progress:', progress);
                if (progress.status === 'loading') {
                    this.updateStatus('model', progress.message, false);
                }
            });

            this.updateStatus('model', 'Loaded', true);
            loadBtn.textContent = 'Model Loaded';
            startBtn.disabled = false;

            console.log('[BBAS] Model loaded successfully');

        } catch (error) {
            console.error('[BBAS] Failed to load model:', error);
            this.updateStatus('model', 'Load Failed', false);
            document.getElementById('load-model-btn').disabled = false;
            document.getElementById('load-model-btn').textContent = 'Load Model';
            alert(`Failed to load model: ${error.message}\n\nMake sure the model file exists at: /bbas/models/yolov8n.onnx`);
        }
    }

    async startDetection() {
        if (!this.detector.isLoaded) {
            alert('Please load the model first!');
            return;
        }

        if (!this.camera.isActive) {
            alert('Please start the camera first!');
            return;
        }

        if (this.detectionLoop) {
            console.warn('[BBAS] Detection already running');
            return;
        }

        console.log('[BBAS] Starting detection...');

        const startBtn = document.getElementById('start-detection-btn');
        const stopBtn = document.getElementById('stop-detection-btn');

        startBtn.disabled = true;
        stopBtn.disabled = false;

        this.updateStatus('detection', 'Running', true);

        // Start detection loop
        this.runDetectionLoop();
    }

    stopDetection() {
        if (this.detectionLoop) {
            clearTimeout(this.detectionLoop);
            this.detectionLoop = null;
        }

        const startBtn = document.getElementById('start-detection-btn');
        const stopBtn = document.getElementById('stop-detection-btn');

        startBtn.disabled = false;
        stopBtn.disabled = true;

        this.updateStatus('detection', 'Stopped', false);

        // Clear detections from canvas
        this.lastDetections = [];
        this.redrawCanvas();

        console.log('[BBAS] Detection stopped');
    }

    async runDetectionLoop() {
        try {
            // Get video element
            const videoElement = document.getElementById('video');

            // Run detection
            const detections = await this.detector.detect(videoElement);
            this.lastDetections = detections;

            // Check boundary violations
            this.checkBoundaryViolations(detections);

            // Redraw canvas with boundaries and detections
            this.redrawCanvas();

        } catch (error) {
            console.error('[BBAS] Detection error:', error);
        }

        // Schedule next detection
        if (this.detectionLoop !== null) {
            this.detectionLoop = setTimeout(() => this.runDetectionLoop(), CONFIG.DETECTION.INFERENCE_INTERVAL);
        }
    }

    checkBoundaryViolations(detections) {
        const boundaries = this.boundaryEditor.getBoundaries();
        if (boundaries.length === 0) return;

        for (const detection of detections) {
            // Check center point of bounding box
            const centerX = detection.x + detection.width / 2;
            const centerY = detection.y + detection.height / 2;
            const centerPoint = { x: centerX, y: centerY };

            // Check if center is in any boundary
            for (const boundary of boundaries) {
                if (isPointInPolygon(centerPoint, boundary)) {
                    console.warn('[BBAS] ⚠️ BOUNDARY VIOLATION DETECTED!');
                    this.triggerAlert(detection);
                    break;
                }
            }
        }
    }

    triggerAlert(detection) {
        // Visual alert
        if (document.getElementById('visual-alerts').checked) {
            const alertOverlay = document.getElementById('alert-overlay');
            const alertText = document.getElementById('alert-text');
            const message = document.getElementById('alert-message').value;

            alertText.textContent = message;
            alertOverlay.classList.remove('hidden');

            setTimeout(() => {
                alertOverlay.classList.add('hidden');
            }, 2000);
        }

        // Voice alert
        if (document.getElementById('voice-alerts').checked && 'speechSynthesis' in window) {
            const message = document.getElementById('alert-message').value;
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    }

    redrawCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Redraw boundaries
        if (this.boundaryEditor) {
            this.boundaryEditor.draw();
        }

        // Draw detections
        this.drawDetections(this.lastDetections);
    }

    drawDetections(detections) {
        for (const detection of detections) {
            // Draw bounding box
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(detection.x, detection.y, detection.width, detection.height);

            // Draw confidence label
            const label = `Person ${(detection.confidence * 100).toFixed(0)}%`;
            const labelY = detection.y > 30 ? detection.y - 10 : detection.y + 20;

            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(label, detection.x, labelY);
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BBASApp());
} else {
    new BBASApp();
}
