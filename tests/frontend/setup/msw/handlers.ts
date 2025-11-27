import { http, HttpResponse } from 'msw';

/**
 * MSW request handlers for mocking API calls in frontend tests.
 * These handlers intercept network requests and return mock responses.
 */

const API_URL = 'http://localhost:3001';

export const handlers = [
  // Auth endpoints
  http.get(`${API_URL}/api/auth/me`, () => {
    return HttpResponse.json({
      id: 'test-user-1',
      email: 'test1@example.com',
      name: 'Test User',
      avatar_url: null,
      groupName: 'test',
    });
  }),

  http.post(`${API_URL}/api/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Game endpoints
  http.get(`${API_URL}/api/games`, () => {
    return HttpResponse.json([
      {
        id: 'ferdle-en-5',
        name: 'Ferdle',
        description: '5-letter word game',
        category: 'word',
        playMode: 'daily',
        maxAttempts: 10,
        supportsLeaderboard: true,
        usesAI: true,
      },
      {
        id: 'ferdle-ru-4',
        name: 'Фердл',
        description: '4-letter Russian word game',
        category: 'word',
        playMode: 'daily',
        maxAttempts: 10,
        supportsLeaderboard: true,
        usesAI: true,
      },
    ]);
  }),

  http.get(`${API_URL}/api/games/today`, () => {
    return HttpResponse.json('2025-11-27');
  }),

  http.get(`${API_URL}/api/games/:gameId/state`, ({ params }) => {
    const { gameId } = params;
    return HttpResponse.json({
      state: {
        gameId,
        userId: 'test-user-1',
        gameDate: '2025-11-27',
        isComplete: false,
        won: false,
        attempts: 0,
        maxAttempts: 10,
        startedAt: Date.now(),
        completedAt: null,
        timeSeconds: null,
        stateData: {
          guesses: [],
          letterStates: {},
          language: gameId === 'ferdle-ru-4' ? 'ru' : 'en',
        },
      },
    });
  }),

  http.post(`${API_URL}/api/games/:gameId/move`, async ({ request }) => {
    const body: any = await request.json();
    const guess = body.move?.guess || '';

    // Mock a winning move if guess is "ROBOT"
    if (guess === 'ROBOT') {
      return HttpResponse.json({
        state: {
          gameId: 'ferdle-en-5',
          userId: 'test-user-1',
          gameDate: '2025-11-27',
          isComplete: true,
          won: true,
          attempts: 1,
          maxAttempts: 10,
          startedAt: Date.now() - 10000,
          completedAt: Date.now(),
          timeSeconds: 10,
          stateData: {
            targetWord: 'ROBOT',
            guesses: [
              {
                word: 'ROBOT',
                clues: ['correct', 'correct', 'correct', 'correct', 'correct'],
              },
            ],
            letterStates: {
              R: 'correct',
              O: 'correct',
              B: 'correct',
              T: 'correct',
            },
            language: 'en',
          },
        },
        aiImage: {
          imageUrl: '/api/images/en/test-robot.png',
          cached: true,
        },
      });
    }

    // Mock an invalid guess
    if (guess.length !== 5) {
      return HttpResponse.json({
        error: 'Word must be 5 letters',
      });
    }

    // Mock a valid but incorrect guess
    return HttpResponse.json({
      state: {
        gameId: 'ferdle-en-5',
        userId: 'test-user-1',
        gameDate: '2025-11-27',
        isComplete: false,
        won: false,
        attempts: 1,
        maxAttempts: 10,
        startedAt: Date.now() - 5000,
        completedAt: null,
        timeSeconds: null,
        stateData: {
          guesses: [
            {
              word: guess,
              clues: ['absent', 'absent', 'absent', 'absent', 'absent'],
            },
          ],
          letterStates: {
            [guess[0]]: 'absent',
            [guess[1]]: 'absent',
            [guess[2]]: 'absent',
            [guess[3]]: 'absent',
            [guess[4]]: 'absent',
          },
          language: 'en',
        },
      },
    });
  }),

  // Leaderboard endpoints
  http.get(`${API_URL}/api/leaderboards/:gameId/:period`, ({ params }) => {
    return HttpResponse.json([
      {
        rank: 1,
        user_id: 'test-user-1',
        name: 'Test User',
        avatar_url: null,
        games_played: 10,
        games_won: 8,
        success_rate: 0.8,
        current_streak: 3,
        best_streak: 5,
        average_attempts: 4.5,
      },
      {
        rank: 2,
        user_id: 'test-user-2',
        name: 'Another User',
        avatar_url: null,
        games_played: 10,
        games_won: 7,
        success_rate: 0.7,
        current_streak: 2,
        best_streak: 4,
        average_attempts: 5.2,
      },
    ]);
  }),

  http.get(`${API_URL}/api/leaderboards/:gameId/:period/me`, () => {
    return HttpResponse.json({
      rank: 1,
      user_id: 'test-user-1',
      name: 'Test User',
      avatar_url: null,
      games_played: 10,
      games_won: 8,
      success_rate: 0.8,
      current_streak: 3,
      best_streak: 5,
      average_attempts: 4.5,
    });
  }),
];
