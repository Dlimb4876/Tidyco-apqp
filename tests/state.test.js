import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('State Module (state.js)', () => {
  let stateContent

  beforeAll(() => {
    stateContent = fs.readFileSync(path.resolve(__dirname, '../core/js/state.js'), 'utf8')
  })

  describe('Core Exports', () => {
    it('should export db object with projects array', () => {
      expect(stateContent).toContain('export let db =')
      expect(stateContent).toContain('projects:')
    })

    it('should export currentUserRole', () => {
      expect(stateContent).toContain('export let currentUserRole =')
    })

    it('should export prog helper function', () => {
      expect(stateContent).toContain('export function prog()')
    })

    it('should export findProjectByProductId helper', () => {
      expect(stateContent).toContain('export function findProjectByProductId(')
    })

    it('should export getDefaultGateSelection helper', () => {
      expect(stateContent).toContain('export function getDefaultGateSelection(')
    })

    it('should export normalizeGateSelections helper', () => {
      expect(stateContent).toContain('export function normalizeGateSelections(')
    })

    it('should reference GATE_DEFS', () => {
      expect(stateContent).toContain('GATE_DEFS')
    })
  })

  describe('Navigation State', () => {
    it('should have default currentSection as hub', () => {
      expect(stateContent).toContain("currentSection: 'hub'")
    })

    it('should have progId initialized as null', () => {
      expect(stateContent).toContain('progId: null')
    })
  })

  describe('Tab States', () => {
    it('should have apqpTab defaulting to ctq', () => {
      expect(stateContent).toContain("apqpTab: 'ctq'")
    })

    it('should have bomSubTab defaulting to tree', () => {
      expect(stateContent).toContain("bomSubTab: 'tree'")
    })

    it('should have capacityTab defaulting to root', () => {
      expect(stateContent).toContain("capacityTab: 'root'")
    })

    it('should have prodCapTab and pmCapTab defaults', () => {
      expect(stateContent).toContain("prodCapTab: 'dashboard'")
      expect(stateContent).toContain("pmCapTab: 'tasks'")
    })
  })

  describe('Filter States', () => {
    it('should initialize pfmeaRpnFilter as all', () => {
      expect(stateContent).toContain("pfmeaRpnFilter: 'all'")
    })

    it('should initialize ctq source and coverage filters', () => {
      expect(stateContent).toContain("ctqSourceFilter: 'all'")
      expect(stateContent).toContain("ctqCoverageFilter: 'all'")
    })

    it('should initialize trackerSubAsmFilter', () => {
      expect(stateContent).toContain("trackerSubAsmFilter: 'all'")
    })
  })

  describe('Picker States', () => {
    it('should initialize ctq picker state', () => {
      expect(stateContent).toContain('ctqPickTarget: null')
      expect(stateContent).toMatch(/ctqPickSelected\s*:\s*\[\]/)
    })

    it('should initialize bom picker state', () => {
      expect(stateContent).toContain('bomPickTarget: null')
      expect(stateContent).toMatch(/bomPickSelected\s*:\s*\[\]/)
      expect(stateContent).toMatch(/bomPickFilter\s*:\s*'all'/)
    })

    it('should initialize bom tree expanded as Set', () => {
      expect(stateContent).toContain('bomTreeExpanded: new Set()')
      expect(stateContent).toContain('bomAawTreeExpanded: new Set()')
    })
  })

  describe('Collection States', () => {
    it('should initialize collapsedGroups as Set', () => {
      expect(stateContent).toContain('collapsedGroups: new Set()')
    })

    it('should initialize ABC catalogue data as empty array', () => {
      expect(stateContent).toMatch(/abcCatalogueData\s*:\s*\[\]/)
      expect(stateContent).toContain('abcPickResults: []')
      expect(stateContent).toContain('abcPickSelected: []')
    })

    it('should initialize abcPickTarget', () => {
      expect(stateContent).toContain('abcPickTarget:')
    })
  })

  describe('Action Centre State', () => {
    it('should initialize actionCentreData as null', () => {
      expect(stateContent).toContain('actionCentreData: null')
    })

    it('should initialize actionCentreLoading as false', () => {
      expect(stateContent).toContain('actionCentreLoading: false')
    })

    it('should initialize actionCentreTab and actionCentreStatusFilter', () => {
      expect(stateContent).toContain("actionCentreTab: 'all'")
      expect(stateContent).toContain("actionCentreStatusFilter: 'open'")
    })
  })

  describe('Settings State', () => {
    it('should initialize settingsActiveTab as families', () => {
      expect(stateContent).toContain("settingsActiveTab: 'families'")
    })

    it('should initialize settings data states', () => {
      expect(stateContent).toContain('settingsTeamsData: null')
      expect(stateContent).toContain('settingsTeamsLoading: false')
    })
  })

  describe('MCS State', () => {
    it('should initialize mcsApproverConfig as null', () => {
      expect(stateContent).toContain('mcsApproverConfig: null')
      expect(stateContent).toContain('mcsApproverConfigLoading: false')
    })

    it('should initialize mcsList as empty array', () => {
      expect(stateContent).toContain('mcsList: []')
    })

    it('should have mcsCurrentFilter', () => {
      expect(stateContent).toContain('mcsCurrentFilter:')
    })
  })

  describe('Capacity Defaults', () => {
    it('should have prodCapUtilizationFactor defaulting to 1.0', () => {
      expect(stateContent).toContain('prodCapUtilizationFactor: 1.0')
    })

    it('should have bomSubTab and bomPartsRegisterView defaults', () => {
      expect(stateContent).toContain("bomPartsRegisterView: 'total'")
      expect(stateContent).toContain("bomAbcFilter: 'all'")
    })
  })

  describe('Documentation', () => {
    it('should contain role enum hint', () => {
      expect(stateContent).toContain("'admin' | 'editor' | 'viewer'")
    })

    it('should contain APQP tab hint', () => {
      expect(stateContent).toContain('ctq|pfd|pfmea|cp')
    })

    it('should contain RPN filter hint', () => {
      expect(stateContent).toMatch(/all|high|r1_49|r50_99|r100_199|r200_plus/)
    })
  })
})
