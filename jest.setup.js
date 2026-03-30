import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jest } from '@jest/globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const testDir = path.resolve(__dirname, 'tests')

global.require = createRequire(import.meta.url)
global.__dirname = testDir
globalThis.jest = globalThis.jest || jest

// Mock Supabase
global.supa = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
  auth: {
    getSession: jest.fn(() => ({
        data: {
            session: {
                user: {
                    id: 'test-user',
                    email: 'test@test.com'
                }
            }
        }
      }))
  }
}

// Mock other global functions and variables
global.createRealtimeSubscription = jest.fn()
global.removeRealtimeSubscription = jest.fn()
global.currentUser = { id: 'test-user', email: 'test@test.com' }

// Permission helpers — default to editor (full access) in tests
global.currentUserRole = 'editor'
global.canEdit = jest.fn(() => true)
global.isAdmin = jest.fn(() => false)
global.bomPartsRegisterView = 'total'

// Mocking the DOM — only available in jsdom environment
if (typeof document !== 'undefined') {
  const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8')
  document.documentElement.innerHTML = html.toString()
}
