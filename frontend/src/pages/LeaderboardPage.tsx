import { useEffect, useState } from 'react';
import { Container } from '../components/layout/Container';
import { Spinner } from '../components/common/Spinner';
import { leaderboardAPI, gameAPI } from '../services/api.service';
import type { LeaderboardEntry, GameConfig } from '../types';

export function LeaderboardPage() {
  const [games, setGames] = useState<GameConfig[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      loadLeaderboard();
    }
  }, [selectedGame, selectedPeriod]);

  async function loadGames() {
    try {
      const gamesData = await gameAPI.getGames();
      setGames(gamesData);
      if (gamesData.length > 0) {
        setSelectedGame(gamesData[0].id);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaderboard() {
    try {
      setLoading(true);
      const [leaderboardData, userRankData] = await Promise.all([
        leaderboardAPI.getLeaderboard(selectedGame, selectedPeriod),
        leaderboardAPI.getUserRank(selectedGame, selectedPeriod),
      ]);
      setLeaderboard(leaderboardData);
      setUserRank(userRankData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const periods = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
  ];

  return (
    <Container>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Leaderboard</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game
              </label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="large" />
          </div>
        ) : (
          <>
            {userRank && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Rank
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      #{userRank.rank}
                    </div>
                    <div className="text-sm text-gray-600">Rank</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {userRank.games_played}
                    </div>
                    <div className="text-sm text-gray-600">Played</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(userRank.success_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {userRank.current_streak}
                    </div>
                    <div className="text-sm text-gray-600">Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {userRank.average_attempts?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Avg Attempts</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full min-w-0">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Played
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win%
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Streak
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Avg
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No leaderboard data yet. Play some games to get started!
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry) => (
                      <tr key={entry.user_id}>
                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.rank}
                        </td>
                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {entry.avatar_url && (
                              <img
                                src={entry.avatar_url}
                                alt={entry.name}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                              {entry.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {entry.games_played}
                        </td>
                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {(entry.success_rate * 100).toFixed(0)}%
                        </td>
                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {entry.current_streak}
                        </td>
                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                          {entry.average_attempts?.toFixed(1) || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
