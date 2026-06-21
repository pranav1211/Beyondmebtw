# F1 Haptic Trailer: Android Recreation

This is a recreation of the **Formula 1 haptic trailer**, originally made for Apple devices, now adapted for **Android devices with vibration feedback**.  
It syncs vibrations with the trailer video, letting you **feel the trailer** through haptic feedback.

## 📖 Usage
1. Run it at: [https://beyondmebtw.com/projects/f1hapticandroid](https://beyondmebtw.com/projects/f1hapticandroid)  
2. Alternatively, clone this repo and access the F1 haptic trailer from other sources. Ensure it is the correct version with a runtime of **2:11**, and use that as the source instead of the existing one.


## 🚀 Features
- Fullscreen trailer playback with synchronized haptic vibrations.  
- Works on mobile devices that support the [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).  
- Test vibration button to verify device compatibility.  
- Responsive design, optimized for mobile-first experience.  
- Automatic handling of playback scenarios:  
  - Resumes vibration correctly if starting mid-event.  
  - Plays only the remaining portion of a vibration when jumping ahead.

## 📂 How It Works
- The trailer video plays in sync with a hardcoded timeline of vibration events.  
- If playback starts mid-event, vibrations are trimmed so they remain aligned.  
- On pause or seek, vibrations stop immediately to maintain accuracy.


## ⚖️ License & Disclaimer
This project is licensed under the **[MIT License](LICENSE)**.  

This project is a **non-commercial, educational recreation** of the Formula 1 haptic trailer designed for Apple devices.  
No copyright infringement is intended. This project is **not affiliated with, endorsed by, or connected to Apple Inc., Formula 1, or any of their subsidiaries or partners**.
