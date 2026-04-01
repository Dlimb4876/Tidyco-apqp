# Tidyco APQP Desktop App

This is a minimal Electron wrapper that opens your hosted Tidyco APQP portal in a desktop application window.

## What It Does

- Downloads and installs as a standalone desktop app
- Opens your portal URL in a native window
- Always loads the latest code from your hosted portal
- Toggle between production and development versions
- No updates needed—your portal updates instantly reach all users

## Features

### Dev/Production Toggle
Users can switch between versions in the app menu:
- **Settings** → **Use Development Version** (Ctrl+Shift+D)
- Shows checkmark (✓) when using dev version
- Preference is saved and persists on restart

URLs:
- **Production**: https://dlimb4876.github.io/Tidyco-apqp/
- **Development**: https://dlimb4876.github.io/Tidyco-apqp/dev/

## Development

### Run Locally
```bash
npm run electron
```

### Run with DevTools
```bash
npm run electron -- --dev
```

### Build Package
```bash
npm run electron:build
```

Creates: `out/make/zip/win32/x64/tidyco-apqp-win32-x64-1.0.0.zip` (380 MB)

## Installation

Users can extract the ZIP and run `Tidyco APQP.exe` directly, or use a batch installer script (if created).

## Configuration

Settings are saved to: `%APPDATA%/tidyco-apqp/app-config.json`

Stores:
- `useDevVersion` - Whether to load the dev URL

## Distribution

1. Extract the built ZIP file
2. Package `Tidyco APQP.exe` for distribution
3. Users run the executable

## Under the Hood

- Electron v31 (Chromium-based)
- No bundled code—always fetches latest from your hosted URL
- ~380MB download size
- Works on Windows 7+

## Maintenance

- Update your portal code → publish to GitHub Pages
- No new installer needed
- Users see updates on next app restart (when they reload the portal URL)

## Icon

Currently uses `favicon.ico` from project root. To customize:
1. Create a 512x512 PNG icon
2. Replace `favicon.ico`
3. Rebuild

