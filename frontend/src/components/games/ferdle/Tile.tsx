interface TileProps {
  letter: string;
  state?: 'correct' | 'present' | 'absent' | 'empty';
}

export function Tile({ letter, state = 'empty' }: TileProps) {
  const stateClasses = {
    correct: 'bg-correct text-white border-correct',
    present: 'bg-present text-white border-present',
    absent: 'bg-absent text-white border-absent',
    empty: 'bg-white border-gray-300',
  };

  return (
    <div
      className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold uppercase ${stateClasses[state]} transition-colors duration-200`}
    >
      {letter}
    </div>
  );
}
