# PWA Installation Guide

## 🚀 Quick Deploy Options

### Option 1: GitHub Pages (Recommended - Free & Easy)

1. **Create a GitHub repository**
2. **Upload all files** to the repo
3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: Deploy from main branch
   - Save
4. **Access your app** at: `https://yourusername.github.io/repo-name`

The "Install App" button will appear automatically!

### Option 2: Netlify (Drag & Drop)

1. Go to [netlify.com](https://netlify.com)
2. Sign up (free)
3. Drag the entire folder into Netlify
4. Get instant HTTPS URL
5. PWA ready immediately!

### Option 3: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In your project folder: `vercel`
3. Follow prompts
4. Get instant deployment with HTTPS

### Option 4: Local Testing (HTTPS Required)

**Using Python with SSL:**
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Run HTTPS server
python3 -m http.server 8000 --bind 0.0.0.0
```

**Using Node.js:**
```bash
npm install -g http-server
http-server -S -C cert.pem -K key.pem -p 8000
```

**Note:** Browsers will show security warning for self-signed certificates - click "Advanced" → "Proceed"

---

## 📱 How Users Install Your PWA

### Desktop (Chrome/Edge/Brave)

**Method 1: Install Button**
- Click the "📱 Install App" button in the app interface

**Method 2: Browser Install Icon**
- Look for install icon in address bar (desktop icon or +)
- Click and confirm

**Method 3: Menu Option**
- Chrome: Menu (⋮) → "Install Live Voice Monitor"
- Edge: Menu (…) → "Apps" → "Install this site as an app"

### Mobile (Android)

**Chrome:**
1. Tap the "📱 Install App" button, OR
2. Menu (⋮) → "Add to Home Screen"
3. App appears on home screen

### Mobile (iOS/Safari)

**Safari:**
1. Tap Share button (square with arrow)
2. Scroll and tap "Add to Home Screen"
3. Tap "Add"

**Note:** iOS doesn't show the in-app install button due to Apple restrictions

---

## ✅ PWA Features Included

- ✅ **Offline Support**: Works without internet after first load
- ✅ **Install Prompts**: Automatic install button
- ✅ **App Icons**: Custom microphone icons (192px & 512px)
- ✅ **Standalone Mode**: No browser UI when installed
- ✅ **Service Worker**: Caches all assets for fast loading
- ✅ **Theme Colors**: Branded purple gradient
- ✅ **Responsive**: Works on all screen sizes

---

## 🔧 Testing PWA Features

### Chrome DevTools

1. Open DevTools (F12)
2. Go to "Application" tab
3. Check:
   - **Manifest**: Should show all metadata
   - **Service Workers**: Should show "activated and running"
   - **Cache Storage**: Should show cached files

### Lighthouse Audit

1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Check "Progressive Web App"
4. Run audit
5. Should score 90+ for PWA

---

## 📋 Required Files Checklist

Make sure all these files are deployed:

- ✅ `index.html` - Main app
- ✅ `styles.css` - Styling
- ✅ `audio-monitor.js` - Audio logic
- ✅ `manifest.json` - PWA metadata
- ✅ `service-worker.js` - Offline support
- ✅ `icon-192.png` - Small icon
- ✅ `icon-512.png` - Large icon

---

## 🌐 HTTPS Requirement

**PWAs require HTTPS** (except localhost). Free HTTPS options:

- ✅ GitHub Pages (auto HTTPS)
- ✅ Netlify (auto HTTPS)
- ✅ Vercel (auto HTTPS)
- ✅ Cloudflare Pages (auto HTTPS)

All these platforms provide free SSL certificates automatically!

---

## 🎯 Custom Domain (Optional)

If you want a custom domain like `voicemonitor.com`:

1. **Buy domain** (Namecheap, Google Domains, etc.)
2. **Point to your hosting**:
   - GitHub Pages: CNAME record
   - Netlify/Vercel: Follow their DNS instructions
3. **HTTPS auto-configured** by hosting platform

---

## 🐛 Troubleshooting

**Install button not showing:**
- Ensure you're on HTTPS (not HTTP)
- Check manifest.json is loading (DevTools → Network)
- Clear browser cache and reload

**Service worker not registering:**
- Check browser console for errors
- Ensure service-worker.js path is correct
- Try hard refresh (Ctrl+Shift+R)

**Icons not showing:**
- Verify icon files are in same folder as index.html
- Check manifest.json has correct icon paths
- Icons must be PNG format

**App not working offline:**
- Visit the app once while online first
- Check Service Worker is activated (DevTools → Application)
- Verify all files are cached

---

## 📚 Further Reading

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

## 🎉 You're Done!

Your Live Voice Monitor is now a fully installable PWA that works like a native app!
