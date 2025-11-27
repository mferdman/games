import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 whitespace-nowrap">
                <span className="sm:hidden">FG</span>
                <span className="hidden sm:inline">Ferdman Games</span>
              </h1>
            </Link>
            {gameName && (
              <>
                <span className="text-gray-400">•</span>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 whitespace-nowrap">
                  {gameName}
                </h2>
              </>
            )}
          </div>

          <nav className="flex items-center">
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center focus:outline-none"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-8 h-8 rounded-full hover:ring-2 hover:ring-blue-300 transition-all"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      {user.name}
                    </div>
                    <Link
                      to="/leaderboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Leaderboard
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
