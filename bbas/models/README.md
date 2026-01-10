# YOLO Model Setup for BBAS

This folder should contain the YOLOv8 ONNX model file for person detection.

## Quick Download (Recommended)

**Download the pre-converted model directly:**

```bash
# Navigate to the models folder
cd bbas/models/

# Download YOLOv8n ONNX model from HuggingFace
curl -L "https://huggingface.co/SpotLab/YOLOv8Detection/resolve/main/yolov8n.onnx" -o yolov8n.onnx
```

Or download manually:
- Visit: https://huggingface.co/SpotLab/YOLOv8Detection/blob/main/yolov8n.onnx
- Click "Download" button
- Save as `yolov8n.onnx` in this folder

## Alternative: Convert from PyTorch (Advanced)

If you want to convert the model yourself:

### 1. Install Requirements

```bash
pip install ultralytics
```

### 2. Export to ONNX

Create a Python script or run in Python console:

```python
from ultralytics import YOLO

# Load the pretrained YOLOv8n model
model = YOLO("yolov8n.pt")

# Export to ONNX format
model.export(format="onnx", imgsz=640)
```

This will create `yolov8n.onnx` in your current directory.

### 3. Move to Models Folder

```bash
mv yolov8n.onnx /path/to/bbas/models/
```

## Model Options

The system supports two YOLO models:

### YOLOv8n (Nano) - **Recommended**
- **Size:** ~6 MB
- **Speed:** Very Fast (real-time on most devices)
- **Accuracy:** Good
- **File:** `yolov8n.onnx`
- **Best for:** Mobile devices, real-time detection

### YOLOv8s (Small) - Optional
- **Size:** ~22 MB
- **Speed:** Fast
- **Accuracy:** Better
- **File:** `yolov8s.onnx`
- **Best for:** Desktop/high-end devices, better accuracy

To use YOLOv8s, download it similarly:
```bash
curl -L "https://huggingface.co/SpotLab/YOLOv8Detection/resolve/main/yolov8s.onnx" -o yolov8s.onnx
```

## Verify Installation

After downloading, your `bbas/models/` folder should contain:

```
models/
├── README.md (this file)
└── yolov8n.onnx (6 MB)
```

## Testing

1. Start the BBAS application
2. Start camera
3. Click "Load Model" button
4. Select model from dropdown (yolov8n or yolov8s)
5. Click "Start Detection"

If the model loads successfully, you'll see:
- Status indicator: "🧠 Model: Loaded"
- Console log: "Model loaded successfully"

## Troubleshooting

### Error: "Failed to load model"
- Verify the file exists in `/bbas/models/yolov8n.onnx`
- Check file size is approximately 6 MB
- Ensure web server has proper MIME types configured
- Try re-downloading the model

### Error: "Model not found"
- Check the file path in browser console
- Ensure you're accessing via HTTP/HTTPS (not file://)
- Verify service worker is registered properly

### Slow Detection
- Use YOLOv8n (nano) instead of YOLOv8s
- Reduce video resolution in camera settings
- Check browser console for performance warnings

## Model Details

**YOLO (You Only Look Once)** is a real-time object detection system.

- **Input:** 640x640 RGB image
- **Output:** Bounding boxes with class predictions
- **Classes:** 80 COCO classes (person is class 0)
- **Format:** ONNX (Open Neural Network Exchange)

### Person Detection

The system filters detections to only show **person class (class ID = 0)**.

The YOLO person detector recognizes:
- ✅ Full body
- ✅ Partial body (torso, upper body)
- ✅ Head and shoulders
- ✅ Arms and hands (as part of person)
- ✅ Multiple people in frame
- ✅ People at various angles and poses

## License

YOLOv8 models are released under AGPL-3.0 license by Ultralytics.
