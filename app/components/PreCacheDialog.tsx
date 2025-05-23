'use client';

interface PreCacheDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDownloading: boolean;
  progress: number;
}

export default function PreCacheDialog({
  isOpen,
  onClose,
  onConfirm,
  isDownloading,
  progress
}: PreCacheDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-sm mx-auto">
        <h2 className="text-lg font-bold mb-2">Pre-cache Aplikasi</h2>
        <p className="mb-4 text-gray-600 text-center text-sm sm:text-base">
          {isDownloading 
            ? 'Mengunduh konten untuk penggunaan offline...' 
            : 'Unduh konten aplikasi untuk penggunaan offline?'}
        </p>
        
        {isDownloading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center mt-2">
              {progress}% selesai
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!isDownloading && (
            <>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full sm:w-auto"
                onClick={onConfirm}
              >
                Ya, Unduh
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold w-full sm:w-auto"
                onClick={onClose}
              >
                Nanti saja
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 