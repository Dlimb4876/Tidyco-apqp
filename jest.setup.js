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
};

// Mock other global functions and variables
global.createRealtimeSubscription = jest.fn();
global.removeRealtimeSubscription = jest.fn();
global.currentUser = { id: 'test-user', email: 'test@test.com' };

// Mocking the DOM — only available in jsdom environment
if (typeof document !== 'undefined') {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
  document.documentElement.innerHTML = html.toString();
}
