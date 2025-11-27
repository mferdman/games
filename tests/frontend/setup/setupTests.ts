import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server.js';

/**
 * Global test setup for frontend tests.
 * This file is loaded before all tests via vitest.config.ts setupFiles.
 */

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  console.log('🔌 MSW server started - API calls will be mocked');
});

// Reset handlers between tests to ensure test isolation
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
  console.log('🔌 MSW server stopped');
});

// Set up environment
process.env.NODE_ENV = 'test';

console.log('🧪 Frontend test environment initialized');
