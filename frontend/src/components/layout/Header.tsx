import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Determine game name from current route
  const getGameName = () => {
    if (location.pathname.includes('ferdle-en')) return 'Ferdle';
    if (location.pathname.includes('ferdle-ru')) return 'Фердл';
    return null;
  };

  const gameName = getGameName();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Ferdman Games</h1>
            </Link>
            {gameName && (
              <>
                <span className="text-gray-400">•</span>
                <h2 className="text-xl font-semibold text-gray-900">{gameName}</h2>
              </>
            )}
          </div>

          <nav className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Leaderboard
                </Link>

                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                  <Button variant="secondary" size="small" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
