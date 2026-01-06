// Main Application Orchestrator

import Camera from './components/Camera.js';
import BoundaryEditor from './components/BoundaryEditor.js';
import storage from './utils/storage.js';
import { CONFIG } from './config/constants.js';

class BBASApp {
    constructor() {
        this.camera = null;
        this.boundaryEditor = null;
        this.canvas = null;
        this.ctx = null;

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

        // Confidence slider
        document.getElementById('confidence-threshold').addEventListener('input', (e) => {
            document.getElementById('confidence-value').textContent = e.target.value;
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

            // Resize canvas to match video
            this.canvas.width = dimensions.width;
            this.canvas.height = dimensions.height;

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
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BBASApp());
} else {
    new BBASApp();
}
