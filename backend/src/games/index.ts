import type { GamePlugin, GameConfig } from './types.js';

/**
 * Central game registry
 */
class GameRegistry {
  private games = new Map<string, GamePlugin>();

  /**
   * Register a game plugin
   */
  register(plugin: GamePlugin): void {
    const config = plugin.getConfig();
    if (this.games.has(config.id)) {
      throw new Error(`Game ${config.id} is already registered`);
    }
    this.games.set(config.id, plugin);
    console.log(`🎮 Registered game: ${config.name} (${config.id})`);
  }

  /**
   * Get a game by ID
   */
  get(gameId: string): GamePlugin | null {
    return this.games.get(gameId) || null;
  }

  /**
   * Get all registered games
   */
  getAll(): GamePlugin[] {
    return Array.from(this.games.values());
  }

  /**
   * Get all game configs
   */
  getAllConfigs(): GameConfig[] {
    return this.getAll().map((game) => game.getConfig());
  }

  /**
   * Filter games by category
   */
  getByCategory(category: string): GamePlugin[] {
    return this.getAll().filter(
      (game) => game.getConfig().category === category
    );
  }

  /**
   * Check if a game exists
   */
  has(gameId: string): boolean {
    return this.games.has(gameId);
  }
}

// Export singleton instance
export const gameRegistry = new GameRegistry();
