class AudioMonitor {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyserNode = null;
        this.isMonitoring = false;
        
        // UI Elements
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusEl = document.getElementById('status');
        this.latencyEl = document.getElementById('latency');
        this.sampleRateEl = document.getElementById('sampleRate');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.canvas = document.getElementById('visualizer');
        this.canvasCtx = this.canvas.getContext('2d');
        
        this.initEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startMonitoring());
        this.stopBtn.addEventListener('click', () => this.stopMonitoring());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 40;
        this.canvas.height = container.clientHeight - 40;
    }
    
    async startMonitoring() {
        try {
            this.updateStatus('Requesting microphone access...', '#ffc107');
            
            // Request microphone with optimal settings for low latency
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            const audioConstraints = {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                latency: 0
            };
            
            // Mobile optimization: try lower sample rate first for better latency
            if (isMobile) {
                audioConstraints.sampleRate = { ideal: 16000, min: 8000 };
            } else {
                audioConstraints.sampleRate = 16000;
            }
            
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints
            });
            
            // Create AudioContext with lowest possible latency
            // Mobile-optimized settings
            const contextOptions = {
                latencyHint: 'interactive',
                sampleRate: 16000
            };
            
            // Try to force smaller buffer size on mobile (Safari/iOS specific)
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                contextOptions.latencyHint = 0.001; // Request 1ms latency (will use minimum possible)
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)(contextOptions);
            
            // Mobile browsers (especially iOS) require user interaction to resume context
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create audio nodes
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.gainNode = this.audioContext.createGain();
            this.analyserNode = this.audioContext.createAnalyser();
            
            // Configure analyser for visualization
            this.analyserNode.fftSize = 2048;
            this.analyserNode.smoothingTimeConstant = 0.8;
            
            // Connect the audio graph: source -> gain -> analyser -> destination
            this.sourceNode.connect(this.gainNode);
            this.gainNode.connect(this.analyserNode);
            this.analyserNode.connect(this.audioContext.destination);
            
            // Set initial volume
            this.gainNode.gain.value = 1.0;
            
            // Update UI
            this.isMonitoring = true;
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.volumeSlider.disabled = false;
            this.updateStatus('Monitoring Active', '#28a745');
            
            // Display audio context info
            const baseLatency = this.audioContext.baseLatency || 0;
            const outputLatency = this.audioContext.outputLatency || 0;
            const totalLatency = ((baseLatency + outputLatency) * 1000).toFixed(1);
            this.latencyEl.textContent = `${totalLatency} ms`;
            this.sampleRateEl.textContent = `${this.audioContext.sampleRate} Hz`;
            
            // Warn about high latency (likely Bluetooth)
            if (totalLatency > 30) {
                console.warn('High latency detected:', totalLatency, 'ms');
                console.warn('This is often caused by Bluetooth headphones. Use wired headphones for <15ms latency.');
                
                // Show warning in UI if on mobile
                if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                    setTimeout(() => {
                        if (confirm(`⚠️ High latency detected (${totalLatency}ms).\n\nAre you using Bluetooth headphones?\n\nSwitch to WIRED headphones for 100ms+ lower latency!\n\nClick OK to continue anyway.`)) {
                            console.log('User acknowledged latency warning');
                        }
                    }, 500);
                }
            }
            
            // Start visualization
            this.visualize();
            
            console.log('Audio Monitor Started');
            console.log('Base Latency:', baseLatency);
            console.log('Output Latency:', outputLatency);
            console.log('Total Latency:', totalLatency, 'ms');
            
        } catch (error) {
            console.error('Error starting audio monitor:', error);
            this.updateStatus('Error: ' + error.message, '#dc3545');
            alert('Could not access microphone. Please ensure you have granted permission.');
        }
    }
    
    stopMonitoring() {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        if (this.analyserNode) {
            this.analyserNode.disconnect();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Reset state
        this.isMonitoring = false;
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyserNode = null;
        
        // Update UI
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.volumeSlider.disabled = true;
        this.updateStatus('Stopped', '#6c757d');
        this.latencyEl.textContent = '-- ms';
        this.sampleRateEl.textContent = '-- Hz';
        
        // Clear canvas
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        console.log('Audio Monitor Stopped');
    }
    
    updateVolume(value) {
        if (this.gainNode) {
            const volume = value / 100;
            this.gainNode.gain.value = volume;
            this.volumeValue.textContent = `${value}%`;
        }
    }
    
    updateStatus(message, color) {
        this.statusEl.textContent = message;
        this.statusEl.style.color = color;
    }
    
    visualize() {
        if (!this.isMonitoring) return;
        
        requestAnimationFrame(() => this.visualize());
        
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteTimeDomainData(dataArray);
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        this.canvasCtx.fillStyle = '#1a1a2e';
        this.canvasCtx.fillRect(0, 0, width, height);
        
        // Draw waveform
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.strokeStyle = '#667eea';
        this.canvasCtx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;
            
            if (i === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.canvasCtx.lineTo(width, height / 2);
        this.canvasCtx.stroke();
        
        // Draw center line
        this.canvasCtx.strokeStyle = '#764ba2';
        this.canvasCtx.lineWidth = 1;
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(0, height / 2);
        this.canvasCtx.lineTo(width, height / 2);
        this.canvasCtx.stroke();
    }
}

// Initialize the audio monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const monitor = new AudioMonitor();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (!monitor.isMonitoring) {
                monitor.startMonitoring();
            } else {
                monitor.stopMonitoring();
            }
        }
    });
});