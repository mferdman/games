import { Tile } from './Tile';
import type { FerdleGuess } from '../../../types';

interface GameRowProps {
  guess?: FerdleGuess;
  currentGuess?: string;
  wordLength: number;
  isActive?: boolean;
}

export function GameRow({ guess, currentGuess, wordLength, isActive }: GameRowProps) {
  const tiles = [];

  if (guess) {
    // Completed guess with clues
    for (let i = 0; i < wordLength; i++) {
      tiles.push(
        <Tile
          key={i}
          letter={guess.word[i] || ''}
          state={guess.clues[i]}
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
    <div className="flex gap-1 justify-center">
      {tiles}
    </div>
  );
}
