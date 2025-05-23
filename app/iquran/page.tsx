'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function IquranPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= 604) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Kembali
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="relative w-full aspect-[3/4] mb-6">
            <Image
              src={`https://raw.githubusercontent.com/ngaosidn/dbQuranImages/main/${String(currentPage).padStart(3, '0')}.png`}
              alt={`Halaman ${currentPage}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-4 py-2 rounded-md ${
                currentPage <= 1
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Sebelumnya
            </button>
            <span className="text-gray-600">
              Halaman {currentPage} dari 604
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= 604}
              className={`px-4 py-2 rounded-md ${
                currentPage >= 604
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 