import axios from 'axios';
import type { User, GameConfig, GameState, LeaderboardEntry } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  async getMe(): Promise<User> {
    const response = await api.get('/api/auth/me');
    return response.data.user;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  getLoginUrl(): string {
    return `${API_URL}/auth/google`;
  },
};

// Game API
export const gameAPI = {
  async getGames(): Promise<GameConfig[]> {
    const response = await api.get('/api/games');
    return response.data.games;
  },

  async getGameState(gameId: string, date?: string): Promise<{ state: GameState; aiImage?: any }> {
    const params = date ? { date } : {};
    const response = await api.get(`/api/games/${gameId}/state`, { params });
    return response.data;
  },

  async submitMove(
    gameId: string,
    move: any,
    date?: string
  ): Promise<{ state: GameState; aiImage?: any }> {
    const response = await api.post(`/api/games/${gameId}/move`, { move, date });
    return response.data;
  },

  async getToday(): Promise<string> {
    const response = await api.get('/api/games/today');
    return response.data.date;
  },
};

// Leaderboard API
export const leaderboardAPI = {
  async getLeaderboard(
    gameId: string,
    period: string
  ): Promise<LeaderboardEntry[]> {
    const response = await api.get(`/api/leaderboards/${gameId}/${period}`);
    return response.data.leaderboard;
  },

  async getUserRank(
    gameId: string,
    period: string
  ): Promise<LeaderboardEntry | null> {
    const response = await api.get(`/api/leaderboards/${gameId}/${period}/me`);
    return response.data.userRank;
  },
};

export default api;
