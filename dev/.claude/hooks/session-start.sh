#!/bin/bash
set -euo pipefail

# Only run in remote/web environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Installing npm dependencies..."
cd "$CLAUDE_PROJECT_DIR"
npm install

echo "Installing Playwright CLI..."
npm install --save-dev @playwright/test

echo "Installing Playwright browsers (chromium)..."
npx playwright install --with-deps chromium || echo "Warning: Browser install failed — may need to retry or use a pre-installed browser."

echo "Session setup complete."
