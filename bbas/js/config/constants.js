// Configuration constants for BBAS

export const CONFIG = {
    // Camera settings
    CAMERA: {
        IDEAL_WIDTH: 640,
        IDEAL_HEIGHT: 480,
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
    
    // Storage keys
    STORAGE: {
        BOUNDARIES: 'bbas_boundaries',
        SETTINGS: 'bbas_settings'
    }
};
