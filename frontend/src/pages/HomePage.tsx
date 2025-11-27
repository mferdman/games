import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../context/AuthContext';
import { gameAPI } from '../services/api.service';
import type { GameConfig } from '../types';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGames() {
      try {
        const gamesData = await gameAPI.getGames();
        setGames(gamesData);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      </Container>
    );
  }

  const dailyGames = games.filter((g) => g.playMode === 'daily');
  const unlimitedGames = games.filter((g) => g.playMode === 'unlimited');

  return (
    <Container>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}!
        </h2>
        <p className="text-gray-600">Choose a game to play</p>
      </div>

      {dailyGames.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Daily Games</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dailyGames.map((game) => (
              <Card
                key={game.id}
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {game.name}
                </h4>
                <p className="text-gray-600 mb-4">{game.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="capitalize">{game.category}</span>
                  <span>{game.maxAttempts} attempts</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {unlimitedGames.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Unlimited Games
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlimitedGames.map((game) => (
              <Card
                key={game.id}
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {game.name}
                </h4>
                <p className="text-gray-600">{game.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
