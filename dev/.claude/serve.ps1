# .claude/serve.ps1 - start a simple HTTP file server from the repo root
#
# Usage (from repo root):
#   PowerShell -ExecutionPolicy Bypass -File .claude\serve.ps1

# Check Node is available (informational only; does not block serving)
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Warning "Node.js was not found on PATH. Agent scripts (.claude/agents/*.js) will not run."
    Write-Warning "Install Node.js from https://nodejs.org/ to enable agent support."
}
else {
    $nodeVersion = (node -v)
    Write-Host "Node.js $nodeVersion found - agent scripts are available."
}

# Resolve repo root relative to this script's location (one level up from .claude/)
$root = Split-Path $PSScriptRoot -Parent
$port = 8000

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Serving $root on http://localhost:$port/"
Write-Host "Open http://localhost:$port/index.html in your browser."
Write-Host "Press Ctrl+C to stop."

$mimeTypes = @{
    '.html'  = 'text/html'
    '.js'    = 'application/javascript'
    '.css'   = 'text/css'
    '.json'  = 'application/json'
    '.png'   = 'image/png'
    '.jpg'   = 'image/jpeg'
    '.svg'   = 'image/svg+xml'
    '.ico'   = 'image/x-icon'
    '.woff2' = 'font/woff2'
    '.md'    = 'text/plain'
}

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = $req.Url.LocalPath -replace '/', '\\'
    if ($urlPath -eq '\\') {
        $urlPath = '\\index.html'
    }

    $file = Join-Path $root $urlPath.TrimStart('\\')

    if (Test-Path $file -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($file)
        if ($mimeTypes.ContainsKey($ext)) {
            $res.ContentType = $mimeTypes[$ext]
        }
        else {
            $res.ContentType = 'application/octet-stream'
        }

        $bytes = [System.IO.File]::ReadAllBytes($file)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    else {
        $res.StatusCode = 404
    }

    $res.OutputStream.Close()
}
