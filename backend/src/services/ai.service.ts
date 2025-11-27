import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env, paths } from '../config/env.js';
import { db } from '../config/database.js';
import type { AIContentRequest } from '../games/types.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// In-memory set to track ongoing image generations (prevents race condition)
const generatingImages = new Set<string>();

/**
 * Generate AI image for a word
 */
export async function generateAIImage(request: AIContentRequest): Promise<{
  imageUrl: string;
  cached: boolean;
}> {
  try {
    // Skip OpenAI API calls in test mode (expensive!)
    const IS_TEST = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    if (IS_TEST) {
      console.log(`[TEST MODE] Skipping OpenAI API call for: ${request.word}`);
      return {
        imageUrl: `/api/images/${request.language}/test-placeholder.png`,
        cached: true,
      };
    }

    // Check cache first
    const cached = getCachedImage(request.word, request.language);
    if (cached) {
      console.log(`✅ Using cached AI image for: ${request.word}`);
      return {
        imageUrl: `/api/images/${request.language}/${cached.image_filename}`,
        cached: true,
      };
    }

    console.log(`🎨 Generating AI image for: ${request.word} (${request.language})`);

    // Generate image with DALL-E 3
    const prompt = buildPrompt(request);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    // Download and save image
    const filename = await downloadAndSaveImage(
      imageUrl,
      request.word,
      request.language
    );

    // Cache metadata
    saveImageCache(request, filename);

    console.log(`✅ Generated and cached AI image: ${filename}`);

    return {
      imageUrl: `/api/images/${request.language}/${filename}`,
      cached: false,
    };
  } catch (error) {
    console.error('❌ AI image generation failed:', error);

    // Add to retry queue
    addToRetryQueue(request);

    // Return placeholder
    return {
      imageUrl: '/api/images/placeholder',
      cached: false,
    };
  }
}

/**
 * Build prompt for AI image generation
 * NOTE: Do NOT include the word itself in the prompt as AI is bad at spelling text
 */
function buildPrompt(request: AIContentRequest): string {
  if (request.language === 'ru') {
    return `Создайте красочную, подходящую для детей образовательную иллюстрацию, показывающую концепцию: "${request.definition}".
Изображение должно быть дружелюбным, ярким и помогать детям визуально понять концепцию.
Используйте мультяшный стиль с яркими цветами и простыми, четкими образами.
Используйте самое очевидное и прямое определение концепции - если есть несколько возможных интерпретаций, выберите самую распространенную и простую.
НЕ включайте никакой текст, слова или цифры в само изображение.`;
  }

  return `Create a colorful, kid-appropriate educational illustration showing the concept: "${request.definition}".
The image should be friendly, vibrant, and help children understand the concept visually.
Use a cartoon style with bright colors and simple, clear imagery.
Use the most obvious and straightforward interpretation of the concept - if there are multiple possible meanings, choose the most common and simple one.
Do NOT include any text, words, or numbers in the image itself.`;
}

/**
 * Check if image is cached
 */
function getCachedImage(
  word: string,
  language: string
): { image_filename: string } | null {
  const stmt = db.prepare(
    'SELECT image_filename FROM ai_image_cache WHERE word = ? AND language = ?'
  );
  return stmt.get(word.toLowerCase(), language) as any;
}

/**
 * Download and save image to filesystem
 */
async function downloadAndSaveImage(
  url: string,
  word: string,
  language: string
): Promise<string> {
  // Generate unique filename
  const hash = crypto
    .createHash('md5')
    .update(word + Date.now())
    .digest('hex')
    .substring(0, 8);
  const filename = `${word}_${hash}.png`;
  const filepath = path.join(paths.images, language, filename);

  // Ensure directory exists
  const dir = path.join(paths.images, language);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Download image
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filepath, response.data);

  return filename;
}

/**
 * Save image metadata to cache
 */
function saveImageCache(request: AIContentRequest, filename: string): void {
  const stmt = db.prepare(`
    INSERT INTO ai_image_cache (word, language, prompt, image_filename, definition, generated_at, openai_model)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(word, language) DO UPDATE SET
      prompt = excluded.prompt,
      image_filename = excluded.image_filename,
      definition = excluded.definition,
      generated_at = excluded.generated_at
  `);

  stmt.run(
    request.word.toLowerCase(),
    request.language,
    buildPrompt(request),
    filename,
    request.definition,
    Date.now(),
    'dall-e-3'
  );
}

/**
 * Add failed generation to retry queue
 */
function addToRetryQueue(request: AIContentRequest): void {
  const stmt = db.prepare(`
    INSERT INTO ai_generation_queue (word, language, user_id, game_id, attempts, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    request.word,
    request.language,
    'system', // TODO: pass actual user_id
    'ferdle', // TODO: pass actual game_id
    0,
    'pending',
    Date.now()
  );
}

/**
 * Queue image generation in background (non-blocking)
 * Called when game starts to pre-generate image
 */
export function queueImageGeneration(request: AIContentRequest): void {
  const cacheKey = `${request.word.toLowerCase()}_${request.language}`;

  // Check if already cached
  const cached = getCachedImage(request.word, request.language);
  if (cached) {
    console.log(`✅ Image already cached for: ${request.word}`);
    return;
  }

  // Check if already generating (prevents race condition)
  if (generatingImages.has(cacheKey)) {
    console.log(`⏳ Already generating image for: ${request.word} (${request.language})`);
    return;
  }

  // Mark as generating
  generatingImages.add(cacheKey);
  console.log(`🎨 Queuing background image generation for: ${request.word} (${request.language})`);

  // Generate in background without blocking
  generateAIImage(request)
    .catch((err) => {
      console.error(`❌ Background image generation failed for ${request.word}:`, err);
    })
    .finally(() => {
      // Remove from generating set when done (success or failure)
      generatingImages.delete(cacheKey);
    });
}

/**
 * Get image file path
 */
export function getImagePath(language: string, filename: string): string | null {
  const filepath = path.join(paths.images, language, filename);
  if (fs.existsSync(filepath)) {
    return filepath;
  }
  return null;
}
