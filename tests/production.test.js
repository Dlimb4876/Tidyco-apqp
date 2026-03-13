const fs = require('fs');
const path = require('path');

// Mocking the global objects and functions that the production scripts depend on.
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
};

global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();
global.currentUser = { id: 'test-user', email: 'test@test.com' };
global.db = { programmes: [] };
global.getFamilies = () => [];
global.prodState = {
    products: [],
    batches: [],
    activeUnit: 'Unit 2'
};

// Mocking the DOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
document.documentElement.innerHTML = html.toString();

// Dynamically import the scripts to be tested
const dataScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/data.js'), 'utf8');
const schedulingScript = fs.readFileSync(path.resolve(__dirname, '../portals/production/js/scheduling.js'), 'utf8');
eval(dataScript);
eval(schedulingScript);

describe('Production Portal', () => {
    describe('Scheduling', () => {
        test('renderScheduling should run without errors', () => {
            expect(() => renderScheduling()).not.toThrow();
        });
    });
});
