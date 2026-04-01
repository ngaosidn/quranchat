'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { FcGoogle } from 'react-icons/fc';

interface Message {
  type: 'user' | 'bot';
  content: React.ReactNode;
}

// TypeScript type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Extended Navigator interface for iOS PWA detection
interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

interface ExtendedWindow extends Window {
  MSStream?: unknown;
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
        <div className="flex flex-col gap-4 bg-white/50 backdrop-blur-md border border-blue-100/50 p-4 rounded-2xl shadow-lg border-l-4 border-l-blue-500">
          <div className="space-y-1">
            <p className="text-xl font-extrabold text-slate-800 font-poppins tracking-tight">Ahlan Bikum! 👋</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Silakan pilih menu utama :</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Primary Action: Quran */}
            <button
              onClick={() => router.push('/iquran')}
              className="group relative flex items-center justify-between gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 text-white p-2.5 rounded-2xl hover:shadow-xl hover:shadow-blue-500/20 transition-all active:scale-[0.96] overflow-hidden border border-blue-400/30"
            >
              <div className="flex items-center gap-2.5 z-10">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner shrink-0 leading-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <span className="font-bold text-sm tracking-wide">Interactive Quran</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 opacity-60 mr-1.5 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Primary Action: Tajwid */}
            <button
              onClick={() => router.push('/itajwidmudah')}
              className="group relative flex items-center justify-between gap-3 bg-gradient-to-r from-purple-500 via-purple-600 to-fuchsia-700 text-white p-2.5 rounded-2xl hover:shadow-xl hover:shadow-purple-500/20 transition-all active:scale-[0.96] overflow-hidden border border-purple-400/30"
            >
              <div className="flex items-center gap-2.5 z-10">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner shrink-0 leading-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                </div>
                <span className="font-bold text-sm tracking-wide">Tajwid Mudah</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 opacity-60 mr-1.5 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Secondary Actions Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => alert('Terima kasih atas dukungan dan doanya!')}
                className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 p-2.5 rounded-2xl hover:bg-amber-100 transition-all font-bold text-[11px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span>Gratitude</span>
              </button>
              <button
                onClick={() => window.open('https://trakteer.id/waquran', '_blank')}
                className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-200 p-2.5 rounded-2xl hover:bg-rose-100 transition-all font-bold text-[11px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-rose-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Support Kami</span>
              </button>
            </div>

            {/* Google Login */}
            <button
              onClick={() => alert('Fitur Google Login akan segera hadir!')}
              className="flex items-center justify-center gap-2.5 bg-white text-slate-700 border border-slate-200 p-2.5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
            >
              <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm tracking-wide">Login via Google</span>
            </button>
          </div>
        </div>
      )
    }
  ]);

  // State untuk PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('ServiceWorker registration successful');
          return registration;
        }).catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
      });
    }
  }, []);

  // Detect PWA and mobile browser
  useEffect(() => {
    const checkPWAInstallation = () => {
      if (typeof window === 'undefined') return;

      // Check for Android PWA
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

      // Check for iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as ExtendedWindow).MSStream;
      const isIOSPWA = isIOS && (navigator as ExtendedNavigator).standalone;

      // Check for other PWA indicators
      const isInPWA = window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;

      const isPWAInstalled = isStandaloneMode || isIOSPWA || isInPWA;
      setIsStandalone(isPWAInstalled);
      setIsMobileBrowser(isMobile() && !isPWAInstalled);
    };

    // Initial check
    checkPWAInstallation();

    // Listen for display mode changes (PWA installation)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkPWAInstallation();
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);
    window.addEventListener('resize', checkPWAInstallation);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', checkPWAInstallation);
    };
  }, []);

  // Handle PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();

      // Check if this is a fresh page load or refresh
      const navigationEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const isFreshLoad = navigationEntry.type === 'navigate' || navigationEntry.type === 'reload';

      // Check if prompt was shown in this session
      const hasShownPrompt = sessionStorage.getItem('hasShownPWAPrompt') === 'true';

      // Store the prompt event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Only show automatic prompt on fresh load or refresh
      if (isFreshLoad && !hasShownPrompt) {
        setShowInstallPrompt(true);
        sessionStorage.setItem('hasShownPWAPrompt', 'true');
      }
    };

    // Check if the browser supports PWA installation
    if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
      window.addEventListener('beforeinstallprompt', handler);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Handle manual install button click
  const handleInstallClick = () => {
    if (deferredPrompt) {
      setShowInstallPrompt(true);
    }
  };

  // Handle successful installation
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setIsStandalone(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center bg-white">
        {/* Modernized Header */}
        <div className="w-full max-w-md mx-auto sticky top-0 z-10">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-b-[2rem] px-6 pt-8 pb-6 relative shadow-2xl shadow-blue-900/30 overflow-hidden border-b border-white/10">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>
            {/* Shimmer Effect */}
            <div className="shimmer-overlay" />
            {/* Glossy Accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/15 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-inner inline-block">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={110}
                    height={38}
                    className="max-w-[120px] h-auto pointer-events-none"
                    priority
                  />
                </div>

                {/* Install button adapted for modern UI */}
                {typeof window !== 'undefined' && isMobileBrowser && !isStandalone && (
                  <button
                    onClick={handleInstallClick}
                    className="text-white hover:text-blue-100 transition-all p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 active:scale-90 shadow-lg"
                    aria-label="Install App"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="space-y-1.5 translate-x-1">
                <div className="text-white text-sm font-semibold font-poppins tracking-wide drop-shadow-sm">Quran Friendly, Tajwid Easy ✨</div>
                <div className="text-blue-100 text-[11px] font-medium font-poppins tracking-wider uppercase opacity-80">Baca, Tadabbur dan Tajwid Interactive 🚀</div>
              </div>
            </div>
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
        {showInstallPrompt && isMobileBrowser && deferredPrompt && !isStandalone && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-sm mx-auto">
              <h2 className="text-lg font-bold mb-2">Install App</h2>
              <p className="mb-4 text-gray-600 text-center text-sm sm:text-base">Install aplikasi ini di perangkat Anda untuk pengalaman terbaik di Android!</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded font-semibold w-full sm:w-auto"
                  onClick={async () => {
                    if (deferredPrompt) {
                      try {
                        // Show the install prompt
                        await deferredPrompt.prompt();
                        // Wait for the user to respond to the prompt
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`User response to the install prompt: ${outcome}`);
                        // We no longer need the prompt. Clear it up
                        setDeferredPrompt(null);
                        // Hide the install prompt
                        setShowInstallPrompt(false);
                      } catch (error) {
                        console.error('Error during install prompt:', error);
                        setShowInstallPrompt(false);
                      }
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

        {/* Floating Footer */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-3rem)] max-w-md px-6 py-2.5 bg-white/60 backdrop-blur-md border border-white/40 shadow-xl rounded-full flex items-center justify-between animate-fade-in pointer-events-none sm:pointer-events-auto select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Siap untuk Belajar</span>
            </div>
          </div>

          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
            <span className="text-slate-400">Copyright</span>
            <span>&copy;</span>
            <span>{new Date().getFullYear()}</span>
            <span className="h-2.5 w-[1px] bg-slate-300 mx-0.5"></span>
            <span className="font-bold text-slate-700 font-poppins">by Tahseena</span>
          </p>
        </div>
      </div>
    </>
  );
}
