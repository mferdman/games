import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-lg text-left shadow-xl transform transition-all w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
