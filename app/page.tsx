'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Message {
  type: 'user' | 'bot';
  content: React.ReactNode;
}

// TypeScript type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isMobile() {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
}

export default function Home() {
  const router = useRouter();
  const [messages] = React.useState<Message[]>([
    {
      type: 'bot',
      content: (
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Ahlan Bikum! 👋</p>
          <p>Silakan pilih menu di bawah ini:</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/quranchat')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>Quran Chat App</span>
            </button>
            <button
              onClick={() => router.push('/kamus-tajwid')}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>Dokumentasi Kaidah Tajwid</span>
            </button>
            <button
              onClick={() => alert('Terima kasih atas dukungan dan doanya!')}
              className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Ucapan Terima Kasih</span>
            </button>
            <button
              onClick={() => window.open('https://trakteer.id/waquran', '_blank')}
              className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Support Kami</span>
            </button>
          </div>
        </div>
      )
    }
  ]);

  // State untuk PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      if (!isMobile()) return;
      const promptEvent = e as unknown as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(promptEvent);
      setShowInstallPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center bg-white">
        {/* Header ala Intercom */}
        <div className="w-full max-w-md mx-auto sticky top-0 z-10">
          <div className="bg-blue-600 rounded-b-3xl px-6 pt-10 pb-6 relative shadow">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <Image 
                  src="/logo.svg" 
                  alt="Logo" 
                  width={120} 
                  height={41} 
                  className="max-w-[120px] h-auto" 
                  priority
                />
              </div>
            </div>
            <div className="text-white text-sm font-normal font-poppins">Teman Ngaji Online-mu yang ingin mudah</div>
            <div className="text-white text-sm font-normal font-poppins">Belajar Al-Quran ✨</div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-end pb-28 sm:pb-4" style={{ minHeight: 'calc(100dvh - 220px)' }}>
          <div className="flex-1 flex flex-col space-y-2.5 sm:space-y-3 px-2 pt-3 sm:pt-4 overflow-y-auto scrollbar-none" style={{ minHeight: 200 }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-end ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}> 
                {msg.type !== 'user' && (
                  <Image src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740" alt="Bot" width={32} height={32} className="rounded-full object-cover mt-1" />
                )}
                <div
                  className={`rounded-2xl px-3.5 sm:px-4 py-2 shadow max-w-[80%] text-sm leading-relaxed transition-all
                    ${msg.type === 'user'
                      ? 'bg-blue-400 text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-blue-100 rounded-bl-md'}
                  `}
                >
                  {msg.content}
                </div>
                {msg.type === 'user' && (
                  <Image src="https://www.svgrepo.com/show/382106/male-avatar-boy-face-man-user-9.svg" alt="You" width={28} height={28} className="rounded-full object-cover ml-2 mb-1" />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* PWA Install Prompt */}
        {showInstallPrompt && isMobile() && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-sm mx-auto">
              <h2 className="text-lg font-bold mb-2">Install App</h2>
              <p className="mb-4 text-gray-600 text-center text-sm sm:text-base">Install aplikasi ini di perangkat Anda untuk pengalaman terbaik di Android!</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full sm:w-auto"
                  onClick={async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === "accepted") setShowInstallPrompt(false);
                    }
                  }}
                >
                  Install
                </button>
                <button
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold w-full sm:w-auto"
                  onClick={() => setShowInstallPrompt(false)}
                >
                  Nanti saja
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
