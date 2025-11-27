/**
 * Global test setup for backend tests.
 * This file is loaded before all tests via vitest.config.ts setupFiles.
 */

// Set environment to test mode
process.env.NODE_ENV = 'test';
process.env.VITEST = 'true';

// Disable OpenAI API calls in tests (expensive!)
process.env.OPENAI_API_KEY = 'test-key-disabled';

// Set up test-specific environment variables
process.env.DATABASE_PATH = ':memory:';
process.env.WHITELIST_PATH = './data/whitelist.txt';
process.env.SESSION_SECRET = 'test-secret';

// Mock console.log/info to reduce noise during tests (optional)
// Uncomment if you want quieter test output
// global.console = {
//   ...console,
//   log: vi.fn(),
//   info: vi.fn(),
// };

// Global test timeout (can be overridden per-test)
// @ts-ignore
globalThis.testTimeout = 10000;

console.log('🧪 Test environment initialized');
console.log('📝 NODE_ENV:', process.env.NODE_ENV);
console.log('🔒 OpenAI API calls DISABLED for tests');
