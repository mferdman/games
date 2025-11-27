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

  // Row padding for QWERTY stagger effect (subtle shift left)
  const getRowPadding = (rowIndex: number): string => {
    if (rowIndex === 0) return '';           // Top row: no offset
    if (rowIndex === 1) return '';   // Middle row: tiny shift left
    if (rowIndex === 2) return '';   // Bottom row: small shift left
    return '';
  };

  return (
    <div className="flex flex-col items-center p-2 space-y-2">
      {keyboard.map((row, rowIndex) => (
        <div key={rowIndex} className={`flex gap-1 ${getRowPadding(rowIndex)}`}>
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
