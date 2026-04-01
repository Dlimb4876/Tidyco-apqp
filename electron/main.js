import { app, BrowserWindow, Menu, globalShortcut } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join, resolve, basename } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { spawn } from 'child_process'

// Handle Squirrel installer events — creates/removes Start Menu & Desktop shortcuts
if (process.platform === 'win32' && process.argv.length > 1) {
  const squirrelCmd = process.argv[1]
  const appFolder = resolve(process.execPath, '..')
  const updateExe = resolve(appFolder, '..', 'Update.exe')
  const exeName = basename(process.execPath)

  const spawnUpdate = (args) => {
    try { spawn(updateExe, args, { detached: true }) } catch {}
  }

  if (squirrelCmd === '--squirrel-install' || squirrelCmd === '--squirrel-updated') {
    spawnUpdate(['--createShortcut', exeName])
    setTimeout(() => app.quit(), 1000)
  } else if (squirrelCmd === '--squirrel-uninstall') {
    spawnUpdate(['--removeShortcut', exeName])
    setTimeout(() => app.quit(), 1000)
  } else if (squirrelCmd === '--squirrel-obsolete') {
    app.quit()
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development'

const PROD_URL = 'https://dlimb4876.github.io/Tidyco-apqp/'
const DEV_URL = 'https://dlimb4876.github.io/Tidyco-apqp/dev/'
const LOCAL_URL = 'http://localhost:8000/index.html'
const CONFIG_PATH = join(app.getPath('userData'), 'app-config.json')

let mainWindow
let useDevVersion = false
let useLocalHost = false
let zoomLevel = 0

// Load configuration
function loadConfig() {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
    useDevVersion = config.useDevVersion || false
    useLocalHost = config.useLocalHost || false
    zoomLevel = config.zoomLevel ?? 0
  } catch {
    // Config doesn't exist yet, use defaults
    useDevVersion = false
    useLocalHost = false
    zoomLevel = 0
  }
}

// Save configuration
function saveConfig() {
  writeFileSync(CONFIG_PATH, JSON.stringify({ useDevVersion, useLocalHost, zoomLevel }, null, 2))
}

// Get current URL based on settings
function getCurrentURL() {
  if (useLocalHost) return LOCAL_URL
  return useDevVersion ? DEV_URL : PROD_URL
}

// Get window title based on current environment
function getWindowTitle() {
  const base = 'Tidyco Operations Portal'
  if (useLocalHost) return `${base} — Local`
  if (useDevVersion) return `${base} — Development`
  return base
}

// Create the browser window
function createWindow() {
  const iconPath = join(__dirname, 'assets', 'Tidyco Logo - large.ico')
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  })

  // Load the portal URL
  mainWindow.loadURL(getCurrentURL())
  mainWindow.setTitle(getWindowTitle())

  // Apply saved zoom level after page loads
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomLevel(zoomLevel)
    mainWindow.setTitle(getWindowTitle())
  })

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App event listeners
app.on('ready', () => {
  loadConfig()
  createWindow()
  createMenu()

  // Hidden localhost toggle: Ctrl+Shift+L
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    useLocalHost = !useLocalHost
    saveConfig()
    if (mainWindow) {
      mainWindow.loadURL(getCurrentURL())
      mainWindow.setTitle(getWindowTitle())
    }
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  // On macOS, keep app running until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow()
  }
})

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Hard Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (!mainWindow) return
            zoomLevel = Math.min(zoomLevel + 0.5, 4)
            mainWindow.webContents.setZoomLevel(zoomLevel)
            saveConfig()
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (!mainWindow) return
            zoomLevel = Math.max(zoomLevel - 0.5, -3)
            mainWindow.webContents.setZoomLevel(zoomLevel)
            saveConfig()
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (!mainWindow) return
            zoomLevel = 0
            mainWindow.webContents.setZoomLevel(zoomLevel)
            saveConfig()
          }
        },
        { type: 'separator' },
        { label: 'Toggle DevTools', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: useDevVersion ? '✓ Using Development Version' : 'Use Development Version',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => {
            useDevVersion = !useDevVersion
            saveConfig()
            // Reload the app with new URL
            if (mainWindow) {
              mainWindow.loadURL(getCurrentURL())
              mainWindow.setTitle(getWindowTitle())
            }
            // Rebuild menu to show updated checkmark
            createMenu()
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

