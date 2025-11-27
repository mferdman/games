import { useNavigate } from 'react-router-dom';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  won: boolean;
  attempts: number;
  targetWord?: string;
  aiImageUrl?: string;
}

export function CompletionModal({
  isOpen,
  onClose,
  won,
  attempts,
  targetWord,
  aiImageUrl,
}: CompletionModalProps) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onClose();
    navigate('/');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header - fixed size */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="text-center">
          {won ? (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                🎉 You got it in {attempts} {attempts === 1 ? 'attempt' : 'attempts'}!
              </h2>
              {targetWord && (
                <p className="text-4xl font-bold text-blue-600 uppercase tracking-wide">
                  {targetWord}
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Better luck tomorrow!
              </h2>
              {targetWord && (
                <p className="text-2xl font-bold text-gray-700 uppercase">
                  The word was: {targetWord}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image - flexible size */}
      {aiImageUrl && (
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4" style={{ minHeight: 0 }}>
          <img
            src={aiImageUrl}
            alt="AI generated illustration"
            className="max-w-full max-h-full sm:max-w-[min(100%,60vh)] rounded-lg object-contain"
            style={{ minHeight: 0, minWidth: 0 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Buttons - fixed size */}
      <div className="flex-shrink-0 p-6 pt-4">
        <div className="flex justify-between space-x-3">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
          <Button onClick={handleGoHome}>
            Back to Home
          </Button>
        </div>
      </div>
    </Modal>
  );
}
