import { useEffect, useState, useCallback, useRef } from 'react';
import { Container } from '../components/layout/Container';
import { Spinner } from '../components/common/Spinner';
import { Toast } from '../components/common/Toast';
import { GameBoard } from '../components/games/ferdle/GameBoard';
import { Keyboard } from '../components/games/ferdle/Keyboard';
import { CompletionModal } from '../components/games/ferdle/CompletionModal';
import { gameAPI } from '../services/api.service';
import type { GameState, FerdleState } from '../types';

interface FerdlePageProps {
  gameId: string;
}

export function FerdlePage({ gameId }: FerdlePageProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [gameDate, setGameDate] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const wordLength = gameId.includes('en') ? 5 : 4;
  const language: 'en' | 'ru' = gameId.includes('en') ? 'en' : 'ru';

  useEffect(() => {
    loadGame();
  }, [gameId]);

  useEffect(() => {
    if (gameState?.isComplete) {
      setShowModal(true);
    }
  }, [gameState?.isComplete]);

  // Auto-scroll to bottom when new guesses are added
  useEffect(() => {
    if (scrollRef.current && gameState) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [(gameState?.stateData as FerdleState)?.guesses?.length]);

  async function loadGame() {
    try {
      setLoading(true);
      setError(null);
      const today = await gameAPI.getToday();
      setGameDate(today);
      const result = await gameAPI.getGameState(gameId, today);
      setGameState(result.state);

      // If game is complete and has AI image, set it
      if ((result as any).aiImage) {
        setAiImageUrl((result as any).aiImage.imageUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load game');
      console.error('Error loading game:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = useCallback(
    async (key: string) => {
      if (!gameState || gameState.isComplete) return;

      if (key === 'ENTER') {
        if (currentGuess.length !== wordLength) {
          setError(`Word must be ${wordLength} letters`);
          return;
        }

        try {
          setError(null);
          const result = await gameAPI.submitMove(
            gameId,
            { guess: currentGuess },
            gameDate || undefined
          );

          // Check for error in response
          if ((result as any).error) {
            setError((result as any).error);
            return;
          }

          setGameState(result.state);
          setCurrentGuess('');

          if (result.aiImage) {
            setAiImageUrl(result.aiImage.imageUrl);
          }
        } catch (err: any) {
          setError(err.response?.data?.error || 'Invalid guess');
        }
      } else if (key === '←' || key === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (currentGuess.length < wordLength) {
        setCurrentGuess((prev) => prev + key.toLowerCase());
      }
    },
    [gameState, currentGuess, gameId, wordLength, gameDate]
  );

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('←');
      } else if (e.key.match(/^[a-zа-яё]$/i)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center py-12">
          <Spinner size="large" />
        </div>
      </Container>
    );
  }

  if (!gameState) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load game</p>
        </div>
      </Container>
    );
  }

  const ferdleState = gameState.stateData as FerdleState;

  return (
    <>
      <Toast message={error} onDismiss={() => setError(null)} />
      <div className="max-w-2xl mx-auto px-4" style={{ height: 'calc(100vh - 4rem)', paddingBottom: '180px' }}>
        <div className="flex flex-col h-full">
          {/* Header - stays put */}
          <div className="text-center py-4 flex-shrink-0">
            <p className="text-gray-600">
              {gameState.maxAttempts - gameState.attempts} attempts remaining
            </p>
          </div>

          {/* Game board - scrollable window */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto"
            style={{ scrollbarGutter: 'stable' }}
          >
            <GameBoard
              guesses={ferdleState.guesses}
              currentGuess={currentGuess}
              maxAttempts={gameState.maxAttempts}
              wordLength={wordLength}
              isComplete={gameState.isComplete}
            />
          </div>
        </div>
      </div>

      {/* Keyboard - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-2 sm:px-4 py-2">
          <Keyboard
            letterStates={ferdleState.letterStates}
            onKeyPress={handleKeyPress}
            language={language}
            disabled={gameState.isComplete}
          />
        </div>
      </div>

      <CompletionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        won={gameState.won}
        attempts={gameState.attempts}
        targetWord={ferdleState.targetWord || ferdleState.guesses[ferdleState.guesses.length - 1]?.word}
        aiImageUrl={aiImageUrl || undefined}
      />
    </>
  );
}
