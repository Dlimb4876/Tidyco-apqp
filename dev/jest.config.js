export default {
  testEnvironment: 'jsdom',
  setupFiles: ['./jest.setup.js'],
  transform: {},
  moduleNameMapper: {
    '^chart\.js$': '<rootDir>/tests/__mocks__/chart.js',
    '^@supabase/supabase-js$': '<rootDir>/tests/__mocks__/@supabase/supabase-js.js'
  }
}
