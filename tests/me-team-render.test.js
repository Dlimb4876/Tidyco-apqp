import { jest } from '@jest/globals'

const { capTeamSortBy, capGetTeamSortIcon } = await import('../portals/capacity/shared/js/cap-team.js')

describe('Team tab sorting', () => {
  it('should export capTeamSortBy function', () => {
    expect(typeof capTeamSortBy).toBe('function')
  })

  it('should export capGetTeamSortIcon function', () => {
    expect(typeof capGetTeamSortIcon).toBe('function')
  })

  it('capTeamSortBy should toggle sort direction', () => {
    const initialIcon = capGetTeamSortIcon('name', 'ME')
    capTeamSortBy('name', 'ME')
    const afterFirstClick = capGetTeamSortIcon('name', 'ME')
    expect(initialIcon).not.toBe(afterFirstClick)
  })

  it('capGetTeamSortIcon should return sort indicator', () => {
    const icon = capGetTeamSortIcon('name', 'ME')
    expect(typeof icon).toBe('string')
    expect(['↕', '↑', '↓']).toContain(icon)
  })
})
