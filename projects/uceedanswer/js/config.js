// Configuration and constants
const CONFIG = {
    ANSWER_KEY_PATH: 'answer_key.json',
    PDF_WORKER_SRC: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    SIMILARITY_THRESHOLD: 0.7,
    MAX_FILE_SIZE: 50 * 1024 * 1024 // 50MB
};

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.PDF_WORKER_SRC;
