import { Tile } from './Tile';
import type { FerdleGuess } from '../../../types';

interface GameRowProps {
  guess?: FerdleGuess;
  currentGuess?: string;
  wordLength: number;
  isActive?: boolean;
  shake?: boolean;
  popIndex?: number;
  showWinAnimation?: boolean;
}

export function GameRow({
  guess,
  currentGuess,
  wordLength,
  isActive,
  shake,
  popIndex,
  showWinAnimation
}: GameRowProps) {
  const tiles = [];

  if (guess) {
    // Completed guess with clues
    for (let i = 0; i < wordLength; i++) {
      const isWinningRow = showWinAnimation && guess.clues.every(c => c === 'correct');
      tiles.push(
        <Tile
          key={i}
          letter={guess.word[i] || ''}
          state={guess.clues[i]}
          animation={isWinningRow ? 'bounce' : undefined}
          animationDelay={isWinningRow ? i * 100 : 0}
        />
      );
    }
  } else if (isActive && currentGuess !== undefined) {
    // Current typing row
    for (let i = 0; i < wordLength; i++) {
      tiles.push(
        <Tile
          key={i}
          letter={currentGuess[i] || ''}
          state="empty"
          animation={popIndex === i ? 'pop' : undefined}
        />
      );
    }
  } else {
    // Empty row
    for (let i = 0; i < wordLength; i++) {
      tiles.push(<Tile key={i} letter="" state="empty" />);
    }
  }

  return (
    <div className={`flex gap-1 justify-center ${shake ? 'animate-shake' : ''}`}>
      {tiles}
    </div>
  );
}
