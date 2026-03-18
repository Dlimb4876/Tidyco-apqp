# Testing Conventions

## Test Setup
- **Framework**: Jest 30
- **DOM Testing**: jsdom
- **Test files**: `tests/*.test.js`
- **Run tests**: `npm test`
- **Full quality check**: `npm run check:all` (runs tests + linting + formatting)

## Test File Naming
Test files should mirror the module they test:
- Module: `core/js/state.js` → Test: `tests/state.test.js`
- Module: `utils/js/helpers.js` → Test: `tests/helpers.test.js`

## Test Structure
Use Jest conventions:

```javascript
describe('functionName', () => {
  it('should do X when Y', () => {
    // Arrange
    const input = ...;

    // Act
    const result = functionName(input);

    // Assert
    expect(result).toBe(...);
  });
});
```

## Mocking Supabase
For database-dependent tests, mock the Supabase client:

```javascript
jest.mock('../core/js/auth.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [...], error: null })
    }))
  }
}));
```

## Testing Async Code
Use `async`/`await` in test functions:

```javascript
it('should fetch data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

## Coverage Goals
- Aim for >80% code coverage on critical paths
- Test error handling and edge cases
- Don't test implementation details; test behavior

## Running Tests
```bash
npm test                # Run all tests
npm test -- --watch    # Run in watch mode
npm run check:all      # Run tests + lint + format check
```

## Debugging Tests
Add `console.log()` and run with:
```bash
npm test -- --detectOpenHandles
```

Keep test logs focused — remove debug logs before committing.
