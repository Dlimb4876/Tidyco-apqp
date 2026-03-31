import { jest } from '@jest/globals'

// Mock state variables that can be updated by tests
global.mockSupa = {
  from: jest.fn()
};

// Mock supa.js before importing anything that uses it
jest.unstable_mockModule('../core/js/supa.js', () => ({
  supabase: {
    from: (table) => global.mockSupa.from(table)
  },
  currentUser: { id: 'user-1' }
}))

jest.unstable_mockModule('../core/js/state.js', () => ({
  appState: { currentSection: 'product-development', productDevelopmentTab: 'products' },
  db: { projects: [] },
  getFamilies: jest.fn(() => []),
  findFamilyRecord: jest.fn(),
  findProjectByProductId: jest.fn(),
  syncProjectFamily: jest.fn()
}))

jest.unstable_mockModule('../core/js/db.js', () => ({
  save: jest.fn()
}))

jest.unstable_mockModule('../utils/js/navigation.js', () => ({
  navigate: jest.fn(),
  render: jest.fn()
}))

jest.unstable_mockModule('../utils/js/realtime.js', () => ({
  createRealtimeSubscription: jest.fn(),
  removeRealtimeSubscription: jest.fn()
}))

// Import the module under test
const { productsDataUpdateProduct, productsState } = await import('../portals/product-development/product-management/js/products-data.js')

describe('Product to Batch work_location sync', () => {
  let mockUpdate;
  let mockEq;
  let mockNeq;
  let mockSelect;
  let mockSingle;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup chainable mocks
    mockSingle = jest.fn().mockImplementation(async () => {
        // Return data that matches what was supposedly updated
        const lastUpdate = mockUpdate.mock.calls[mockUpdate.mock.calls.length - 1][0];
        return { 
            data: { 
                id: 'p1', 
                work_location: lastUpdate.work_location !== undefined ? lastUpdate.work_location : 'Unit 2',
                name: lastUpdate.name || 'Product 1'
            }, 
            error: null 
        };
    });
    mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockNeq = jest.fn().mockReturnValue({ select: mockSelect, single: mockSingle });
    mockEq = jest.fn().mockReturnValue({ 
        select: mockSelect, 
        single: mockSingle,
        neq: mockNeq
    });
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    global.mockSupa.from.mockImplementation((table) => {
      return {
        update: mockUpdate,
        eq: mockEq,
        neq: mockNeq,
        select: mockSelect
      }
    });

    // Initialize state
    productsState.products = [{ id: 'p1', name: 'Product 1', work_location: 'Unit 2' }];
  });

  it('should update production_batches when product work_location changes', async () => {
    const productId = 'p1';
    const updates = { work_location: 'Unit 6' };

    await productsDataUpdateProduct(productId, updates);

    // Verify product was updated
    expect(global.mockSupa.from).toHaveBeenCalledWith('products');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ work_location: 'Unit 6' }));

    // Verify batches were updated (This is what we expect to FAIL before the fix)
    // We check if production_batches was called
    const productionBatchesCall = global.mockSupa.from.mock.calls.find(call => call[0] === 'production_batches');
    expect(productionBatchesCall).toBeDefined();
    
    // Additional verification for the cascading update
    expect(mockUpdate).toHaveBeenCalledWith({ work_location: 'Unit 6' });
    expect(mockEq).toHaveBeenCalledWith('product_id', 'p1');
    expect(mockNeq).toHaveBeenCalledWith('status', 'Complete');
  });

  it('should NOT update production_batches when other fields change', async () => {
    const productId = 'p1';
    const updates = { name: 'New Name' };

    await productsDataUpdateProduct(productId, updates);

    // Verify product was updated
    expect(global.mockSupa.from).toHaveBeenCalledWith('products');
    
    // Verify batches were NOT updated
    const productionBatchesCall = global.mockSupa.from.mock.calls.find(call => call[0] === 'production_batches');
    expect(productionBatchesCall).toBeUndefined();
  });

  it('should update production_batches to null when product work_location is cleared', async () => {
    const productId = 'p1';
    const updates = { work_location: null };

    await productsDataUpdateProduct(productId, updates);

    // Verify batches were updated with null
    const productionBatchesCall = global.mockSupa.from.mock.calls.find(call => call[0] === 'production_batches');
    expect(productionBatchesCall).toBeDefined();
    expect(mockUpdate).toHaveBeenCalledWith({ work_location: null });
  });
});
