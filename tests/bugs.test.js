const fs = require('fs');
const path = require('path');

// Load the script to be tested
const script = fs.readFileSync(path.resolve(__dirname, '../portals/bugs/js/bugs-data.js'), 'utf8');
eval(script);

describe('Bug Data Module', () => {
  test('bugDataInit should be defined', () => {
    expect(typeof bugDataInit).toBe('function');
  });

  test('bugDataInit should run without errors', async () => {
    await expect(bugDataInit()).resolves.not.toThrow();
  });

  test('bugDataManager should be defined on the window object', () => {
    expect(window.bugDataManager).toBeDefined();
  });
});
