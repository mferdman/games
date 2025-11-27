interface KeyboardProps {
  letterStates: Record<string, 'correct' | 'present' | 'absent'>;
  onKeyPress: (key: string) => void;
  language: 'en' | 'ru';
  disabled?: boolean;
}

const KEYBOARDS = {
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['←', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER'],
  ],
  ru: [
    ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
    ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
    ['←', 'Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', 'ENTER'],
  ],
};

export function Keyboard({ letterStates, onKeyPress, language, disabled }: KeyboardProps) {
  const keyboard = KEYBOARDS[language];

  const getKeyClass = (key: string) => {
    if (key === 'ENTER' || key === '←') {
      return 'bg-gray-400 hover:bg-gray-500 text-white px-4';
    }

    const state = letterStates[key.toLowerCase()];
    if (state === 'correct') {
      return 'bg-correct text-white';
    } else if (state === 'present') {
      return 'bg-present text-white';
    } else if (state === 'absent') {
      return 'bg-absent text-white';
    }

    return 'bg-gray-200 hover:bg-gray-300 text-gray-900';
  };

  const getRowOffset = (rowIndex: number) => {
    if (rowIndex === 1) return 'ml-4'; // Middle row offset
    if (rowIndex === 2) return 'ml-8'; // Bottom row offset
    return '';
  };

  return (
    <div className="max-w-lg mx-auto p-2 space-y-2">
      {keyboard.map((row, rowIndex) => (
        <div key={rowIndex} className={`flex justify-center gap-1 ${getRowOffset(rowIndex)}`}>
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              disabled={disabled}
              className={`${getKeyClass(key)} px-2 py-3 rounded font-semibold text-sm min-w-[2rem] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {key === '←' ? '⌫' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
