import { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, duration = 2000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      // Small delay to trigger animation
      requestAnimationFrame(() => setVisible(true));

      const timer = setTimeout(() => {
        setVisible(false);
        // Wait for animation to complete before dismissing
        setTimeout(onDismiss, 300);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, duration, onDismiss]);

  if (!currentMessage && !visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className={`mt-4 px-6 py-3 bg-gray-900 text-white rounded-lg shadow-lg font-medium text-sm transition-all duration-300 ease-out ${
          visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4'
        }`}
      >
        {currentMessage}
      </div>
    </div>
  );
}
