# Deployment Guide

## Local Development

1. **Start the development server:**
   ```bash
   node server.js
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

The Node.js server mimics the nginx configuration you'll use in production.

---

## Production Deployment (Nginx)

### 1. Upload Files to Server

Upload the entire `test/` folder to your server:
```bash
# Example using scp
scp -r test/ user@beyondmebtw.com:/var/www/beyondmebtw.com/
```

Or use FTP/SFTP client to upload:
- `index.html`
- `models/` folder (with all .onnx files)

### 2. Configure Nginx

Add the configuration from `nginx-config.conf` to your nginx server block.

**Location:** Usually `/etc/nginx/sites-available/beyondmebtw.com`

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name beyondmebtw.com www.beyondmebtw.com;

    # ... your existing SSL config ...

    # Add this location block
    location /test/ {
        alias /var/www/beyondmebtw.com/test/;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;

        # Security headers for WASM
        add_header 'Cross-Origin-Embedder-Policy' 'require-corp' always;
        add_header 'Cross-Origin-Opener-Policy' 'same-origin' always;

        # MIME types
        types {
            application/octet-stream onnx;
            application/wasm wasm;
            text/html html htm;
            text/css css;
            application/javascript js;
        }

        # Cache ONNX models (they're large and don't change)
        location ~* \.(onnx)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header 'Access-Control-Allow-Origin' '*' always;
        }
    }
}
```

### 3. Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Verify Deployment

Visit: `https://beyondmebtw.com/test/`

Check browser console for any errors.

---

## Troubleshooting

### Camera not working
- Use HTTPS (required for camera access)
- Grant camera permissions in browser

### Models not loading
1. Check files exist: `https://beyondmebtw.com/test/models/yolo12n.onnx`
2. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify CORS headers: Open browser DevTools → Network tab → Check response headers

### WASM errors
- Ensure `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers are set
- Check browser console for specific error messages

---

## File Structure on Server

```
/var/www/beyondmebtw.com/
└── test/
    ├── index.html
    └── models/
        ├── yolo12n.onnx
        ├── yolo11n.onnx
        ├── yolov10n.onnx
        ├── yolov7-tiny_256x256.onnx
        ├── yolov7-tiny_320x320.onnx
        └── yolov7-tiny_640x640.onnx
```

Adjust the `/var/www/beyondmebtw.com/` path in nginx config to match your actual setup.
