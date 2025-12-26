import seedrandom from 'seedrandom';
import fs from 'fs';
import path from 'path';
import { paths } from '../../config/env.js';
import type {
  GamePlugin,
  GameConfig,
  GameState,
  MoveValidation,
  AIContentRequest,
} from '../types.js';

/**
 * Ferdle-specific state data
 */
interface FerdleStateData {
  targetWord: string;
  guesses: Array<{
    word: string;
    clues: ('correct' | 'present' | 'absent')[];
  }>;
  letterStates: Record<string, 'correct' | 'present' | 'absent'>;
  language: 'en' | 'ru';
}

/**
 * Ferdle game plugin
 */
export class FerdleGame implements GamePlugin {
  private dictionary: Set<string>;
  private targets: string[];
  private shuffledTargets: string[];
  private language: 'en' | 'ru';
  private wordLength: number;
  private maxAttempts = 10;

  constructor(language: 'en' | 'ru', wordLength: number) {
    this.language = language;
    this.wordLength = wordLength;
    this.dictionary = new Set();
    this.targets = [];
    this.shuffledTargets = [];

    this.loadWordLists();
  }

  /**
   * Load word lists from files
   */
  private loadWordLists(): void {
    const dictionaryFile = path.join(
      paths.gameAssets,
      'ferdle',
      `dictionary-${this.language}.json`
    );

    const targetsFile = path.join(
      paths.gameAssets,
      'ferdle',
      `targets-${this.language}.json`
    );

    try {
      // Load dictionary (all valid words) and filter by word length
      const dictData = JSON.parse(fs.readFileSync(dictionaryFile, 'utf-8'));
      this.dictionary = new Set(
        dictData
          .map((w: string) => w.toLowerCase())
          .filter((w: string) => w.length === this.wordLength)
      );

      // Load targets (words that can be daily answers) and filter by word length
      const targetData = JSON.parse(fs.readFileSync(targetsFile, 'utf-8'));
      this.targets = targetData
        .map((w: string) => w.toLowerCase())
        .filter((w: string) => w.length === this.wordLength);

      // Create deterministic shuffled order for daily word selection
      this.shuffledTargets = this.shuffleWithSeed(
        this.targets,
        `ferdle-${this.language}-${this.wordLength}`
      );

      console.log(
        `✅ Loaded Ferdle ${this.language}: ${this.dictionary.size} dictionary words, ${this.targets.length} targets (${this.wordLength} letters)`
      );
    } catch (error) {
      console.error(`❌ Error loading word lists for ${this.language}:`, error);
      throw error;
    }
  }

  /**
   * Shuffle array deterministically using Fisher-Yates with seeded RNG
   */
  private shuffleWithSeed(array: string[], seed: string): string[] {
    const rng = seedrandom(seed);
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get daily word for a specific date (deterministic, no repeats until pool exhausted)
   */
  private getDailyWord(date: string): string {
    // Calculate days since epoch (2024-01-01)
    const epoch = new Date('2024-01-01T00:00:00Z').getTime();
    const target = new Date(date + 'T00:00:00Z').getTime();
    const dayNumber = Math.floor((target - epoch) / (24 * 60 * 60 * 1000));

    // Cycle through shuffled list - guarantees no repeats until pool exhausted
    const index = dayNumber % this.shuffledTargets.length;
    return this.shuffledTargets[index];
  }

  getConfig(): GameConfig {
    const langName = this.language === 'en' ? 'English' : 'Русский';
    return {
      id: `ferdle-${this.language}-${this.wordLength}`,
      name: this.language === 'en' ? 'Ferdle' : 'Фердл',
      description: `${langName} ${this.wordLength}-letter word guessing game`,
      category: 'word',
      playMode: 'daily',
      maxAttempts: this.maxAttempts,
      supportsLeaderboard: true,
      usesAI: true,
      metadata: {
        language: this.language,
        wordLength: this.wordLength,
      },
    };
  }

  async initializeGame(userId: string, gameDate?: string): Promise<GameState> {
    if (!gameDate) {
      throw new Error('Game date is required for daily games');
    }

    const targetWord = this.getDailyWord(gameDate);

    const stateData: FerdleStateData = {
      targetWord,
      guesses: [],
      letterStates: {},
      language: this.language,
    };

    return {
      gameId: this.getConfig().id,
      userId,
      gameDate,
      isComplete: false,
      won: false,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      startedAt: Date.now(),
      completedAt: null,
      timeSeconds: null,
      stateData,
    };
  }

  async validateMove(state: GameState, move: any): Promise<MoveValidation> {
    const guess = move?.guess;

    if (typeof guess !== 'string') {
      return { valid: false, error: 'Guess must be a string' };
    }

    const normalizedGuess = guess.toLowerCase().trim();

    // Check length
    if (normalizedGuess.length !== this.wordLength) {
      return {
        valid: false,
        error: `Word must be ${this.wordLength} letters`,
      };
    }

    // Check if in dictionary
    if (!this.dictionary.has(normalizedGuess)) {
      return { valid: false, error: 'Not a word' };
    }

    // Check for duplicate guess
    const stateData = state.stateData as FerdleStateData;
    const alreadyGuessed = stateData.guesses.some(
      (g) => g.word.toLowerCase() === normalizedGuess
    );

    if (alreadyGuessed) {
      return { valid: false, error: 'Already guessed this word' };
    }

    return { valid: true };
  }

  async processMove(state: GameState, move: any): Promise<GameState> {
    const guess = move.guess.toLowerCase().trim();
    const stateData = state.stateData as FerdleStateData;

    // Generate clues for the guess
    const clues = this.generateClues(guess, stateData.targetWord);

    // Update guesses
    stateData.guesses.push({ word: guess, clues });

    // Update letter states for keyboard
    this.updateLetterStates(guess, clues, stateData.letterStates);

    // Increment attempts
    state.attempts++;

    // Check win condition
    if (guess === stateData.targetWord) {
      state.won = true;
      state.isComplete = true;
    }
    // Check loss condition
    else if (state.attempts >= state.maxAttempts) {
      state.won = false;
      state.isComplete = true;
    }

    state.stateData = stateData;

    return state;
  }

  /**
   * Generate clues for a guess
   * This is the critical Wordle algorithm with proper duplicate letter handling
   */
  private generateClues(
    guess: string,
    target: string
  ): ('correct' | 'present' | 'absent')[] {
    const clues: ('correct' | 'present' | 'absent')[] = new Array(
      guess.length
    ).fill('absent');

    // Count available letters in target (for handling duplicates)
    const targetLetterCounts: Record<string, number> = {};
    for (const letter of target) {
      targetLetterCounts[letter] = (targetLetterCounts[letter] || 0) + 1;
    }

    // First pass: mark correct letters (green)
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === target[i]) {
        clues[i] = 'correct';
        targetLetterCounts[guess[i]]--;
      }
    }

    // Second pass: mark present letters (yellow)
    for (let i = 0; i < guess.length; i++) {
      if (clues[i] === 'correct') {
        continue; // Already marked as correct
      }

      const letter = guess[i];
      if (targetLetterCounts[letter] && targetLetterCounts[letter] > 0) {
        clues[i] = 'present';
        targetLetterCounts[letter]--;
      }
    }

    return clues;
  }

  /**
   * Update letter states for keyboard display
   * Priority: correct > present > absent
   */
  private updateLetterStates(
    guess: string,
    clues: ('correct' | 'present' | 'absent')[],
    letterStates: Record<string, 'correct' | 'present' | 'absent'>
  ): void {
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      const clue = clues[i];

      const currentState = letterStates[letter];

      // Priority: correct > present > absent
      if (clue === 'correct') {
        letterStates[letter] = 'correct';
      } else if (clue === 'present' && currentState !== 'correct') {
        letterStates[letter] = 'present';
      } else if (!currentState) {
        letterStates[letter] = clue;
      }
    }
  }

  async getAIContent(state: GameState): Promise<AIContentRequest | null> {
    if (!state.won) {
      return null;
    }

    const stateData = state.stateData as FerdleStateData;

    return {
      word: stateData.targetWord,
      language: this.language,
      definition: `Definition of ${stateData.targetWord}`, // TODO: Get real definition
    };
  }
}

// Create game instances
export const ferdleEnglish = new FerdleGame('en', 5);
export const ferdleRussian = new FerdleGame('ru', 4);
