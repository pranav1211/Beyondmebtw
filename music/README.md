# Live Voice Monitor

A zero-latency audio monitoring web application that allows you to hear your voice in real-time through your headphones - similar to professional studio monitoring systems.

## Features

- **Ultra-low latency**: 10-30ms using Web Audio API
- **Real-time waveform visualization**: See your voice as you speak
- **Volume control**: Adjust monitoring volume on the fly
- **Clean, responsive UI**: Works on desktop and mobile browsers
- **Keyboard shortcuts**: Press spacebar to start/stop
- **PWA Support**: Install as a native app on any device
- **Offline capable**: Works without internet after installation

## How It Works

This application uses the Web Audio API to create a direct audio path:
```
Microphone → MediaStreamSource → GainNode → AnalyserNode → Speakers
```

### Technical Details

- **API**: Web Audio API with MediaStream
- **Latency Settings**: Interactive latency hint, disabled audio processing
- **Sample Rate**: 48kHz (optimal for most systems)
- **Buffer Size**: Minimal (controlled by browser)
- **Audio Processing**: Echo cancellation, noise suppression, and auto-gain control disabled for lowest latency

## Setup & Usage

### Installing as PWA (Progressive Web App)

**Desktop (Chrome/Edge):**
1. Visit the website (must be HTTPS or localhost)
2. Look for the "📱 Install App" button in the interface
3. Click it and follow the prompts
4. Or click the install icon in the address bar

**Mobile (Android/iOS):**
1. Open the website in Chrome (Android) or Safari (iOS)
2. Tap the "📱 Install App" button
3. Or use browser menu → "Add to Home Screen"
4. The app will appear on your home screen like a native app

**Benefits of PWA Installation:**
- Launch from home screen/desktop
- Runs in standalone window (no browser UI)
- Works offline after first load
- Faster loading times
- Native app experience

### Quick Start

1. Open `index.html` in a modern web browser (Chrome/Edge recommended)
2. Connect your headphones (important to prevent feedback!)
3. Click "Start Monitoring" or press spacebar
4. Allow microphone access when prompted
5. Speak into your microphone - you'll hear yourself instantly!

### Browser Compatibility

**Best Performance:**
- Chrome/Edge (Chromium): ~10-20ms latency
- Safari: ~15-25ms latency

**Good Performance:**
- Firefox: ~20-30ms latency

**Requirements:**
- HTTPS (or localhost) - required for microphone access
- Modern browser with Web Audio API support

## Project Structure

```
.
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout
├── audio-monitor.js    # Audio processing logic
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker for offline support
├── icon-192.png        # App icon (192x192)
├── icon-512.png        # App icon (512x512)
└── README.md          # This file
```

## Development

### Running Locally

**Option 1: Simple HTTP Server (Python)**
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

**Option 2: Node.js HTTP Server**
```bash
npx http-server -p 8000
```

**Option 3: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### Code Architecture

**AudioMonitor Class** (`audio-monitor.js`)
- `startMonitoring()`: Initializes audio context and connects audio nodes
- `stopMonitoring()`: Cleans up resources and disconnects audio
- `updateVolume()`: Controls monitoring volume
- `visualize()`: Draws real-time waveform

**Audio Graph:**
```
MediaStreamSource
      ↓
   GainNode (volume control)
      ↓
  AnalyserNode (visualization)
      ↓
AudioDestination (speakers)
```

## Optimization Tips

### Reducing Latency Further

1. **Use ASIO Drivers** (Windows): Install ASIO4ALL for lower system latency
2. **Adjust Buffer Size**: Lower system audio buffer in sound settings
3. **Close Background Apps**: Reduce CPU load for better audio performance
4. **Use Wired Headphones**: Bluetooth adds 100-200ms latency
5. **Disable Audio Enhancements**: Turn off Windows/Mac audio processing

### Performance Tuning

The code is already optimized with:
- `latencyHint: 'interactive'` for lowest latency
- All audio processing disabled
- Efficient canvas rendering with requestAnimationFrame
- Minimal DOM manipulation

## Common Issues

### No Audio Heard
- Check headphones are connected
- Verify microphone permissions granted
- Ensure volume slider is not at 0%
- Check system audio settings

### High Latency
- Close other audio applications
- Use Chrome/Edge instead of Firefox
- Check system audio buffer settings
- Disable audio enhancements in OS

### Feedback/Echo
- **Always use headphones!** Speakers will create feedback loops
- If using headphones and still hearing echo, reduce volume

## Advanced Features (Future)

Potential enhancements:
- Audio effects (reverb, EQ, compression)
- Recording functionality
- Multi-track support
- Cloud sync for settings
- Mobile app version

## Technical Notes

### Why This Approach?

1. **Web Audio API**: Native browser support, no plugins
2. **MediaStream**: Direct microphone access with low overhead
3. **No Server**: Everything runs client-side for zero network latency
4. **Vanilla JS**: No framework overhead, maximum performance

### Latency Breakdown

- **Input Latency**: ~5-10ms (microphone ADC)
- **Processing Latency**: ~2-5ms (Web Audio API)
- **Output Latency**: ~5-15ms (speaker DAC)
- **Total**: ~12-30ms (acceptable for most users)

Professional studio monitors achieve <5ms using dedicated hardware, but 10-30ms is imperceptible for most use cases.

## License

MIT License - feel free to use and modify!

## Credits

Built with vanilla JavaScript and the Web Audio API.
