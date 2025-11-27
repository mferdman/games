import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

/**
 * MSW server for Node.js environment (tests).
 * This server intercepts HTTP requests and returns mock responses.
 */
export const server = setupServer(...handlers);
