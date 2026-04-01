import { execSync } from 'child_process'
import { copyFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Build with electron-forge first
console.log('Building app with electron-forge...')
execSync('npm run electron:build', { stdio: 'inherit' })

// Create a simple batch installer
const installerBatch = `@echo off
setlocal enabledelayedexpansion

REM Tidyco APQP Desktop App Installer
echo Installing Tidyco APQP...

set "INSTALL_DIR=%PROGRAMFILES%\\Tidyco\\APQP"

REM Create installation directory
if not exist "!INSTALL_DIR!" mkdir "!INSTALL_DIR!"

REM Extract ZIP to installation directory
echo Extracting files...
for %%A in (*.zip) do (
  powershell -Command "Expand-Archive -Path '%%A' -DestinationPath '!INSTALL_DIR!' -Force"
)

REM Create Start Menu shortcut
echo Creating shortcuts...
set "SHORTCUT_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Tidyco"
if not exist "!SHORTCUT_DIR!" mkdir "!SHORTCUT_DIR!"

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Tidyco\\APQP.lnk'); $Shortcut.TargetPath = '!INSTALL_DIR!\\Tidyco APQP\\Tidyco APQP.exe'; $Shortcut.WorkingDirectory = '!INSTALL_DIR!\\Tidyco APQP'; $Shortcut.Save()"

REM Create Desktop shortcut
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\\Desktop\\Tidyco APQP.lnk'); $Shortcut.TargetPath = '!INSTALL_DIR!\\Tidyco APQP\\Tidyco APQP.exe'; $Shortcut.WorkingDirectory = '!INSTALL_DIR!\\Tidyco APQP'; $Shortcut.Save()"

echo.
echo Installation complete!
echo Tidyco APQP has been installed to: !INSTALL_DIR!
echo.
pause
`

// Write installer batch file
writeFileSync('TidycoAPQP-Setup.bat', installerBatch)
console.log('✓ Installer created: TidycoAPQP-Setup.bat')
console.log('')
console.log('Distribution files are ready:')
console.log('- out/make/zip/win32/x64/tidyco-apqp-win32-x64-1.0.0.zip')
console.log('- TidycoAPQP-Setup.bat (installer script)')
console.log('')
console.log('To distribute:')
console.log('1. Zip together the Setup.bat and the ZIP file')
console.log('2. Users run Setup.bat to install')
