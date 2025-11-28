import { GameRow } from './GameRow';
import type { FerdleGuess } from '../../../types';

interface GameBoardProps {
  guesses: FerdleGuess[];
  currentGuess: string;
  maxAttempts: number;
  wordLength: number;
  isComplete: boolean;
  shake?: boolean;
  popIndex?: number;
  showWinAnimation?: boolean;
}

export function GameBoard({
  guesses,
  currentGuess,
  maxAttempts,
  wordLength,
  isComplete,
  shake,
  popIndex,
  showWinAnimation,
}: GameBoardProps) {
  const MIN_VISIBLE_ROWS = 5;

  const rows = [];

  // Completed guesses
  for (let i = 0; i < guesses.length; i++) {
    const isLastGuess = i === guesses.length - 1;
    rows.push(
      <GameRow
        key={i}
        guess={guesses[i]}
        wordLength={wordLength}
        showWinAnimation={isLastGuess && showWinAnimation}
      />
    );
  }

  // Current guess row (if game not complete)
  if (!isComplete && guesses.length < maxAttempts) {
    rows.push(
      <GameRow
        key={guesses.length}
        currentGuess={currentGuess}
        wordLength={wordLength}
        isActive
        shake={shake}
        popIndex={popIndex}
      />
    );
  }

  // Calculate how many rows to show
  // Show minimum 5 rows, or current attempts (already includes active row), whichever is greater
  const rowsToShow = Math.max(MIN_VISIBLE_ROWS, rows.length);
  const emptyRowCount = Math.min(rowsToShow - rows.length, maxAttempts - rows.length);

  // Add empty rows up to the visible count
  for (let i = 0; i < emptyRowCount; i++) {
    rows.push(
      <GameRow
        key={guesses.length + 1 + i}
        wordLength={wordLength}
      />
    );
  }

  return (
    <div className="space-y-1 pb-1">
      {rows}
    </div>
  );
}
