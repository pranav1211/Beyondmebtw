// Configuration constants for BBAS

export const CONFIG = {
    // Camera settings
    CAMERA: {
        IDEAL_RESOLUTION: {
            width: 640,
            height: 480
        },
        FRAME_RATE: 30,
        FACING_MODE: 'environment' // 'user' for front camera
    },
    
    // Detection settings
    DETECTION: {
        INFERENCE_INTERVAL: 200, // ms (5 FPS)
        DEFAULT_CONFIDENCE: 0.5,
        PERSON_CLASS_ID: 0, // YOLO person class
        NMS_THRESHOLD: 0.45
    },
    
    // Model paths (will be served from CDN or local)
    MODELS: {
        YOLOV8N: {
            name: 'YOLOv8n',
            path: '/bbas/models/yolov8n.onnx',
            size: '6 MB',
            speed: 'Fast'
        },
        YOLOV8S: {
            name: 'YOLOv8s',
            path: '/bbas/models/yolov8s.onnx',
            size: '22 MB',
            speed: 'Medium'
        }
    },
    
    // Boundary editor settings
    BOUNDARY: {
        MIN_POINTS: 3,
        POINT_RADIUS: 6,
        LINE_WIDTH: 3,
        COLORS: {
            RESTRICTED: 'rgba(233, 69, 96, 0.5)',
            DRAWING: 'rgba(0, 173, 181, 0.7)',
            POINT: '#00adb5',
            LINE: '#e94560'
        }
    },
    
    // Alert settings
    ALERT: {
        DEFAULT_COOLDOWN: 3000, // ms
        VOICE_RATE: 1.0,
        VOICE_PITCH: 1.0,
        VISUAL_DURATION: 2000 // ms
    },

    // Performance settings
    PERFORMANCE: {
        FPS_UPDATE_INTERVAL: 1000 // ms - update FPS counter every second
    },

    // Storage keys
    STORAGE: {
        BOUNDARIES: 'bbas_boundaries',
        SETTINGS: 'bbas_settings'
    }
};

// Error messages
export const ERROR_MESSAGES = {
    CAMERA_NOT_FOUND: 'No camera device found. Please connect a camera.',
    CAMERA_PERMISSION_DENIED: 'Camera access denied. Please grant camera permissions.',
    CAMERA_IN_USE: 'Camera is already in use by another application.',
    CAMERA_GENERIC: 'Failed to access camera. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
    CAMERA_STARTED: 'Camera started successfully',
    CAMERA_STOPPED: 'Camera stopped',
    MODEL_LOADED: 'Model loaded successfully',
    BOUNDARY_SAVED: 'Boundary saved',
    BOUNDARY_LOADED: 'Boundary loaded'
};

// Events
export const EVENTS = {
    CAMERA_READY: 'camera:ready',
    CAMERA_ERROR: 'camera:error',
    CAMERA_STOPPED: 'camera:stopped',
    MODEL_LOADED: 'model:loaded',
    MODEL_ERROR: 'model:error',
    DETECTION_STARTED: 'detection:started',
    DETECTION_STOPPED: 'detection:stopped',
    PERSON_DETECTED: 'person:detected',
    BOUNDARY_VIOLATION: 'boundary:violation'
};
