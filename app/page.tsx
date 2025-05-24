'use client';

import React, { useEffect, useState } from 'react';
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
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Ahlan Bikum! 👋</p>
          <p>Silakan pilih menu di bawah ini :</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/iquran')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>Interactive Quran</span>
            </button>
            <button
              onClick={() => router.push('/itajwidmudah')}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
              <span>Interactive Tajwid Mudah</span>
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
        {/* Header ala Intercom */}
        <div className="w-full max-w-md mx-auto sticky top-0 z-10">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-b-3xl px-6 pt-10 pb-6 relative shadow">
            {/* Install button for mobile browser */}
            {typeof window !== 'undefined' && isMobileBrowser && !isStandalone && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleInstallClick}
                  className="text-white hover:text-blue-200 transition-colors p-2 rounded-full bg-blue-500/30 hover:bg-blue-700/60"
                  aria-label="Install App"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
              </div>
            )}
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
            <div className="text-white text-sm font-normal font-poppins">Quran Friendly, Tajwid Easy ✨</div>
            <div className="text-white text-sm font-normal font-poppins">Baca, Tadabbur dan Tajwid Interactive 🚀</div>
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
      </div>
    </>
  );
}
