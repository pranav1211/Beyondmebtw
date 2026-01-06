// Main Application Orchestrator

import Camera from './components/Camera.js';
import { CONFIG } from './config/constants.js';

class BBASApp {
    constructor() {
        this.camera = null;
        this.canvas = null;
        this.ctx = null;

        this.init();
    }

    init() {
        console.log('[BBAS] Application initializing...');

        // Get DOM elements
        const videoElement = document.getElementById('video');
        const loadingIndicator = document.getElementById('loading-indicator');
        this.canvas = document.getElementById('overlay-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize camera component
        this.camera = new Camera(videoElement, loadingIndicator);

        // Setup event listeners
        this.setupEventListeners();

        // Update status
        this.updateStatus('camera', 'Off', false);
        this.updateStatus('model', 'Not Loaded', false);
        this.updateStatus('detection', 'Idle', false);

        console.log('[BBAS] Application ready');
    }
    
    setupEventListeners() {
        // Camera controls
        document.getElementById('start-camera-btn').addEventListener('click', () => this.startCamera());
        document.getElementById('stop-camera-btn').addEventListener('click', () => this.stopCamera());

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
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BBASApp());
} else {
    new BBASApp();
}
