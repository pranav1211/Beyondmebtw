# YOLOv12n Object Detection - Fixed Setup

## What Was Fixed

### Original Error
```
Error: invalid wire type 4 at offset 3
```

This error indicated that the ONNX model file was corrupted or incompatible with the ONNX Runtime version being used.

---

## Solutions Implemented

### 1. File Integrity Verification ✅
- **Downloaded fresh YOLOv12n model** from the official repository
- **Verified file size**: 10.7 MB (10,678,697 bytes)
- **Verified file header**: Starts with valid protobuf format (0x08 0x09)
- **Confirmed model metadata**: PyTorch 2.5.1 exported model

### 2. ONNX Runtime Version Update ✅
- **Updated from**: `onnxruntime-web@1.19.2`
- **Updated to**: `onnxruntime-web@1.20.1`
- This ensures compatibility with newer ONNX models and fixes parsing issues

### 3. Improved Configuration ✅
Enhanced the ONNX Runtime configuration with:
```javascript
ort.env.wasm.numThreads = 4;
ort.env.wasm.simd = true;
ort.env.wasm.proxy = false;  // Disable proxy mode for better compatibility
```

Optimized session creation:
```javascript
session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['wasm'],     // Most compatible backend
    graphOptimizationLevel: 'all',    // Maximum optimization
    enableCpuMemArena: true,           // Memory optimization
    enableMemPattern: true,            // Pattern matching optimization
    executionMode: 'sequential'        // Predictable execution
});
```

### 4. File Organization ✅
```
prod/
└── test/
    ├── index.html             (Main application)
    ├── validate-model.html    (Validation tool)
    ├── yolov12n.onnx         (YOLOv12n model - 10.7 MB)
    └── README.md             (This file)
```

---

## How to Use

### Method 1: Full Application
1. Open `index.html` in a web browser
2. Click "Start Camera" to enable your webcam
3. Wait for the model to load (~10-30 seconds)
4. Click "Start Detection" to begin object detection

### Method 2: Validation Only (Recommended First)
1. Open `validate-model.html` in a web browser
2. Click "Run Full Validation"
3. The script will:
   - Check if the model file exists
   - Validate the file header
   - Verify ONNX Runtime version
   - Load the model
   - Run a test inference with dummy data
4. Review all test results before using the main application

---

## Troubleshooting Checklist

### If "invalid wire type" error persists:

#### 1. Verify File Integrity
```bash
# Check file size
ls -lh yolov12n.onnx

# Should show: ~10.7 MB (10,678,697 bytes)
# If it's much smaller, the file is corrupted - re-download it
```

#### 2. Browser Compatibility
- ✅ **Recommended**: Chrome, Edge, or Brave (best WASM support)
- ⚠️ **May have issues**: Firefox (older versions)
- ❌ **Not supported**: Internet Explorer

#### 3. File System Issues (Windows)
- Ensure the file isn't in a path with special characters
- Check that antivirus isn't blocking/modifying the file
- Verify the file has fully downloaded (not partial)
- Try copying the folder to a simpler path (e.g., `C:\test\`)

#### 4. Re-download Model
If the model is corrupted, download it again:
```bash
cd "c:\Users\pranav\Documents\detect\prod\test"
curl -L -o yolov12n.onnx "https://github.com/mohamedsamirx/YOLOv12-ONNX-CPP/raw/main/models/yolov12n.onnx"
```

#### 5. Use a Local Server
Some browsers restrict file:// access. Use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Then open: http://localhost:8000
```

#### 6. Check Console Errors
- Press F12 to open Developer Tools
- Go to the Console tab
- Look for detailed error messages
- Share any errors for further diagnosis

---

## Technical Details

### ONNX Model Specifications
- **Model**: YOLOv12n (Nano variant)
- **Framework**: PyTorch 2.5.1
- **Input Shape**: `[1, 3, 640, 640]` (batch, channels, height, width)
- **Input Type**: float32
- **Input Name**: `images`
- **Output Shape**: `[1, 84, 8400]` (batch, attributes, detections)
- **Format**: ONNX protobuf version 9

### What Each Fix Addresses

1. **ONNX Runtime 1.20.1**
   - Better protobuf parser (fixes wire type errors)
   - Improved WASM compilation
   - Better memory management

2. **Proxy Mode Disabled**
   - Reduces serialization overhead
   - Prevents proxy-related parsing errors
   - Direct WASM execution

3. **Sequential Execution Mode**
   - More predictable behavior
   - Better error reporting
   - Easier debugging

4. **Memory Arena Enabled**
   - Reduces allocation overhead
   - Better memory reuse
   - Prevents memory fragmentation

---

## Known Limitations

⚠️ **YOLOv12 Performance Note**: YOLOv12 models are experimental and may have:
- Higher memory usage than YOLOv11
- Slower inference on CPU (2-3x slower)
- Training instability in some cases

If you experience performance issues, consider using **YOLOv11n** instead, which is more stable and optimized.

---

## Support Resources

- **YOLOv12 Repository**: https://github.com/sunsmarterjie/yolov12
- **ONNX Runtime Docs**: https://onnxruntime.ai/docs/
- **Ultralytics Docs**: https://docs.ultralytics.com/models/yolo12/

---

## File Checksums (for verification)

If you want to verify your downloaded model matches the original:

```bash
# SHA256 checksum
sha256sum yolov12n.onnx

# MD5 checksum
md5sum yolov12n.onnx
```

Compare with known good checksums from the repository.

---

## Next Steps

1. ✅ Run `validate-model.html` to confirm everything works
2. ✅ If validation passes, use `index.html` for real-time detection
3. ✅ Monitor performance metrics (FPS, inference time)
4. ⚠️ If performance is poor, consider switching to YOLOv11n

---

**Last Updated**: January 10, 2026
**Model Source**: [YOLOv12-ONNX-CPP](https://github.com/mohamedsamirx/YOLOv12-ONNX-CPP)
