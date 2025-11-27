import { config } from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  FRONTEND_URL: z.string().url(),
  SESSION_SECRET: z.string().min(10),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  DATA_DIR: z.string().default('../data'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Failed to validate environment variables');
  }
};

export const env = parseEnv();

// Derive paths
const rootDir = path.join(__dirname, '../..');
export const paths = {
  data: path.resolve(rootDir, env.DATA_DIR),
  database: path.resolve(rootDir, env.DATA_DIR, 'database.sqlite'),
  whitelist: path.resolve(rootDir, env.DATA_DIR, 'whitelist.txt'),
  images: path.resolve(rootDir, env.DATA_DIR, 'images/ai-generated'),
  gameAssets: path.resolve(rootDir, env.DATA_DIR, 'game-assets'),
  cache: path.resolve(rootDir, env.DATA_DIR, 'cache'),
};

console.log('📁 Data directory:', paths.data);
console.log('📁 Database path:', paths.database);
