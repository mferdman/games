interface TileProps {
  letter: string;
  state?: 'correct' | 'present' | 'absent' | 'empty';
  animation?: 'pop' | 'bounce';
  animationDelay?: number;
}

export function Tile({ letter, state = 'empty', animation, animationDelay = 0 }: TileProps) {
  const stateClasses = {
    correct: 'bg-correct text-white border-correct',
    present: 'bg-present text-white border-present',
    absent: 'bg-absent text-white border-absent',
    empty: 'bg-white border-gray-300',
  };

  const animationClass = animation === 'pop'
    ? 'animate-pop'
    : animation === 'bounce'
      ? 'animate-bounce-wave'
      : '';

  const animationStyle = animationDelay > 0
    ? { animationDelay: `${animationDelay}ms` }
    : undefined;

  return (
    <div
      className={`w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold uppercase ${stateClasses[state]} transition-colors duration-200 ${animationClass}`}
      style={animationStyle}
    >
      {letter}
    </div>
  );
}
