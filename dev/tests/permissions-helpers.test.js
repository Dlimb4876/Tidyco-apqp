import { jest } from '@jest/globals'

// Mock global state before importing
global.currentUserRole = 'viewer'
global.currentUserPermissions = {}
global.appState = {}

const { canEdit, canViewSection, canViewPortalTab, canViewPageKey, hasPermission, isPermissionError, safeWarn, safeError } = await import('../utils/js/helpers.js')

describe('Permission helpers', () => {
  beforeEach(() => {
    global.currentUserRole = 'viewer'
    global.currentUserPermissions = {}
  })

  it('should export canEdit function', () => {
    expect(typeof canEdit).toBe('function')
  })

  it('should export canViewSection function', () => {
    expect(typeof canViewSection).toBe('function')
  })

  it('should export canViewPortalTab function', () => {
    expect(typeof canViewPortalTab).toBe('function')
  })

  it('should export canViewPageKey function', () => {
    expect(typeof canViewPageKey).toBe('function')
  })

  it('should export hasPermission function', () => {
    expect(typeof hasPermission).toBe('function')
  })

  it('canEdit should return boolean based on role', () => {
    global.currentUserRole = 'editor'
    const result = canEdit()
    expect(typeof result).toBe('boolean')
  })

  it('canViewSection should return boolean', () => {
    const result = canViewSection('settings')
    expect(typeof result).toBe('boolean')
  })

  it('hasPermission should check permission flags', () => {
    global.currentUserPermissions = { test_permission: true }
    const hasIt = hasPermission('test_permission')
    expect(typeof hasIt).toBe('boolean')
  })

  it('should export isPermissionError function', () => {
    expect(typeof isPermissionError).toBe('function')
  })

  it('should export safeWarn function', () => {
    expect(typeof safeWarn).toBe('function')
  })

  it('should export safeError function', () => {
    expect(typeof safeError).toBe('function')
  })

  it('isPermissionError should detect RLS violation errors', () => {
    const rlsError = { message: 'new row violates row-level security policy for table "me_teams"' }
    expect(isPermissionError(rlsError)).toBe(true)
  })

  it('isPermissionError should detect permission denied errors', () => {
    const permError = { message: 'permission denied for table me_teams' }
    expect(isPermissionError(permError)).toBe(true)
  })

  it('isPermissionError should detect PGRST116 errors', () => {
    const pgrstError = { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
    expect(isPermissionError(pgrstError)).toBe(true)
  })

  it('isPermissionError should return false for genuine errors', () => {
    const genuineError = { message: 'Network error: connection refused' }
    expect(isPermissionError(genuineError)).toBe(false)
  })

  it('isPermissionError should return false for null/undefined', () => {
    expect(isPermissionError(null)).toBe(false)
    expect(isPermissionError(undefined)).toBe(false)
  })
})
