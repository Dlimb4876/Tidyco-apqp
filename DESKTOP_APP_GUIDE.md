# Tidyco APQP Desktop App

This is a minimal Electron wrapper that opens your hosted Tidyco APQP portal in a desktop application window.

## What It Does

- Downloads and installs as a standalone desktop app
- Opens your portal URL in a native window
- Always loads the latest code from your hosted portal
- No updates needed—your portal updates instantly reach all users

## Development

### Run Locally
```bash
npm run electron
```

### Run with DevTools
```bash
npm run electron:dev
```

### Build Installer
```bash
npm run electron:build
```

This creates:
- `dist/Tidyco APQP Setup 1.0.0.exe` (Windows installer)
- `dist/Tidyco APQP 1.0.0.exe` (Portable executable)

## Configuration

**Portal URL** is defined in `electron/main.js`:
```javascript
mainWindow.loadURL('https://dlimb4876.github.io/Tidyco-apqp/')
```

To change it, update the URL in that file and rebuild.

## Distribution

Users can:
1. Download the `.exe` installer from your GitHub releases
2. Run the installer (standard Windows install wizard)
3. App appears in Start Menu and can create desktop shortcuts
4. Click to open—portal loads instantly

## Under the Hood

- Electron v31 (Chromium-based)
- No bundled code—always fetches latest from your hosted URL
- Lightweight (~150MB download)
- Works on Windows 7+ (can be extended to macOS/Linux)

## Maintenance

- Update your portal code → publish to GitHub Pages
- No new installer needed
- Users see updates on next app restart (when they reload the portal URL)

## Icon

Currently uses `favicon.ico` from project root. To customize:
1. Create a 512x512 PNG icon
2. Replace `favicon.ico`
3. Rebuild installer
