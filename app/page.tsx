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
              onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5">
                <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.584 2.236 6.393L4 29l7.828-2.05C13.41 27.633 14.686 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.13 0-2.237-.188-3.28-.558l-.234-.08-4.65 1.217 1.24-4.527-.153-.236C7.188 18.237 7 17.13 7 16c0-4.963 4.037-9 9-9s9 4.037 9 9-4.037 9-9 9zm5.07-6.29c-.276-.138-1.637-.808-1.89-.9-.253-.092-.437-.138-.62.138-.184.276-.713.9-.874 1.085-.161.184-.322.207-.598.069-.276-.138-1.166-.43-2.222-1.37-.822-.733-1.377-1.637-1.54-1.913-.161-.276-.017-.425.122-.563.126-.125.276-.322.414-.483.138-.161.184-.276.276-.46.092-.184.046-.345-.023-.483-.069-.138-.62-1.497-.85-2.05-.224-.54-.453-.467-.62-.476l-.529-.01c-.161 0-.46.069-.701.322-.241.253-.92.9-.92 2.192 0 1.292.943 2.54 1.074 2.717.138.184 1.855 2.833 4.5 3.858.63.217 1.12.346 1.504.443.632.161 1.21.138 1.666.084.508-.06 1.637-.669 1.87-1.316.23-.646.23-1.2.161-1.316-.069-.115-.253-.184-.529-.322z" />
              </svg>
              <span>Quran Chat Whatsapp</span>
            </button>
            <button
              onClick={() => router.push('/belajar-quran')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
              <span>Belajar Quran Dari 0 Online</span>
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
              className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
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
    <div className="min-h-screen w-full flex flex-col items-center bg-white">
      {/* Header ala Intercom */}
      <div className="w-full max-w-md mx-auto sticky top-0 z-10">
        <div className="bg-blue-600 rounded-b-3xl px-6 pt-10 pb-6 relative shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white rounded-full p-2 shadow">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2" fill="#fff"/></svg>
            </div>
            <span className="text-white text-2xl font-bold">Ahlan Bikum!</span>
          </div>
          <div className="text-white text-base font-semibold mb-1">Jangan lupa baca Al Quran ya 😊</div>
          <div className="text-white text-base font-semibold">Mau tadabbur dan baca ayat apa hari ini?</div>
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
  );
}
