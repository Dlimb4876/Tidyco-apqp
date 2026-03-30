import { jest } from '@jest/globals'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read guide.js to validate structure
const guideContent = fs.readFileSync(path.resolve(__dirname, '../utils/js/guide.js'), 'utf8')

// Mock showModal and closeModal
global.showModal = jest.fn()
global.closeModal = jest.fn()

// Load DOM from index.html
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8')
document.documentElement.innerHTML = html.toString()

describe('Guide module', () => {
  it('should have GUIDE_CONTENT constant', () => {
    expect(guideContent).toContain('const GUIDE_CONTENT')
  })

  it('should have showGuide function', () => {
    expect(guideContent).toContain('function showGuide')
  })

  it('should reference guide modal elements', () => {
    expect(guideContent).toContain('guideModalTitle')
    expect(guideContent).toContain('guideModalBody')
  })

  it('should call showModal with modalGuide', () => {
    expect(guideContent).toContain("showModal('modalGuide')")
  })

  it('should have guide content for hub', () => {
    expect(guideContent).toContain('hub:')
  })
})
