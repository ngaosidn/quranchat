'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { FcGoogle } from 'react-icons/fc';
import { FiLogOut } from 'react-icons/fi';

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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [possibleLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Object.keys(localStorage).some(key => key.includes('auth-token'));
  });
  const supabase = createClient();
  const [messages, setMessages] = React.useState<Message[]>([
    {
      type: 'bot',
      content: <div /> // Initial placeholder
    }
  ]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : '',
      },
    });
    if (error) alert('Login Gagal: ' + error.message);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert('Logout Gagal: ' + error.message);
  };

  useEffect(() => {
    setMessages((prev) => {
      const newMessages = [...prev];

      // Only show skeleton if we haven't finished auth check AND there's a potential session
      if (authLoading && possibleLoggedIn) {
        newMessages[0] = {
          ...newMessages[0],
          content: (
            <div className="flex flex-col gap-4 bg-white/50 backdrop-blur-md border border-blue-100/50 p-4 rounded-2xl shadow-lg border-l-4 border-l-blue-200 animate-pulse w-[280px]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-200 rounded-2xl"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 w-full bg-slate-100/80 rounded-2xl"></div>
                ))}
              </div>
            </div>
          )
        };
        return newMessages;
      }

      newMessages[0] = {
        ...newMessages[0],
        content: (
          <div className="flex flex-col gap-4 bg-white/50 backdrop-blur-md border border-blue-100/50 p-4 rounded-2xl shadow-lg border-l-4 border-l-blue-500">
            <div
              className={`flex items-center gap-3 ${user ? 'cursor-pointer hover:opacity-80 transition-opacity active:scale-[0.98]' : ''}`}
              onClick={() => user && setShowProfileModal(true)}
            >
              {user?.user_metadata?.avatar_url && (
                <div className="relative shrink-0">
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    width={44}
                    height={44}
                    className="rounded-2xl border-2 border-white/50 shadow-md ring-1 ring-blue-100/50"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              )}
              {user && !user.user_metadata?.avatar_url && (
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/50 shadow-md">
                    {(user.user_metadata?.display_name?.[0] || user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              )}
              <div className="space-y-0.5">
                <p className="text-base font-bold text-slate-800 font-poppins tracking-tight leading-tight transition-all">
                  {user ? `Ahlan, ${user.user_metadata.display_name || user.user_metadata.full_name || 'Akhy'}! 👋` : 'Ahlan Bikum! 👋'}
                </p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-none">
                  {user ? 'Pilih menu dibawah :' : 'Pilih menu utama Anda :'}
                </p>
              </div>
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
                onClick={() => handleProtectedAction('/itajwidmudah', 'Tajwid Mudah')}
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

              {/* Primary Action: Hadist */}
              <button
                onClick={() => handleProtectedAction(null, 'Hadist')}
                className="group relative flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 text-white p-2.5 rounded-2xl hover:shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-[0.96] overflow-hidden border border-emerald-400/30"
              >
                <div className="flex items-center gap-2.5 z-10">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner shrink-0 leading-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <span className="font-bold text-sm tracking-wide">Hadist</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 opacity-60 mr-1.5 group-hover:translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {/* Primary Action: Fiqih 4 Madzhab */}
              <button
                onClick={() => handleProtectedAction(null, 'Fiqih 4 Madzhab')}
                className="group relative flex items-center justify-between gap-3 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-700 text-white p-2.5 rounded-2xl hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-[0.96] overflow-hidden border border-amber-400/30"
              >
                <div className="flex items-center gap-2.5 z-10">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner shrink-0 leading-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18" />
                    </svg>
                  </div>
                  <span className="font-bold text-sm tracking-wide">Fiqih 4 Madzhab</span>
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

              {/* Google Login/Logout */}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2.5 bg-rose-50 text-rose-700 border border-rose-200 p-2.5 rounded-2xl hover:bg-rose-100 transition-all shadow-sm group active:scale-95"
                >
                  <FiLogOut className="w-5 h-5 group-hover:scale-110 transition-transform text-rose-500" />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-bold text-sm tracking-wide">Logout</span>
                    <span className="text-[10px] opacity-70 truncate max-w-[150px]">{user.email}</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center gap-2.5 bg-white text-slate-700 border border-slate-200 p-2.5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
                >
                  <FcGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm tracking-wide">Login via Google</span>
                </button>
              )}
            </div>
          </div>
        )
      };
      return newMessages;
    });
  }, [user, router, authLoading, possibleLoggedIn]);

  // State untuk PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Helper for toast notifications
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Sync profile state when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.user_metadata?.display_name || user.user_metadata?.full_name || '');
      setProfilePhone(user.user_metadata?.phone || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async () => {
    try {
      setIsUpdatingProfile(true);
      const { data, error } = await supabase.auth.updateUser({
        data: {
          display_name: profileName,
          full_name: profileName, // Still try to update standard field
          phone: profilePhone
        }
      });

      if (error) throw error;

      // Force refresh user state from updated data
      if (data?.user) {
        setUser(data.user);
        // Also update profileName to be sure
        setProfileName(data.user.user_metadata?.display_name || data.user.user_metadata?.full_name || '');
      }

      showToast('Profil berhasil disimpan permanen! 💾', 'success');
      setShowProfileModal(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal';
      showToast(`Gagal: ${errorMessage}`, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Helper function for protected actions
  const handleProtectedAction = (path: string | null, featureName: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (path) router.push(path);
    else showToast(`Fitur ${featureName} akan segera hadir! 🔜`, 'success');
  };

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
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-start" style={{ minHeight: 'calc(100dvh - 220px)' }}>
          <div className="flex-1 flex flex-col space-y-2.5 sm:space-y-3 px-2 pt-3 sm:pt-4 pb-32 overflow-y-auto scrollbar-none" style={{ minHeight: 200 }}>
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

        {/* Auth Required Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div
              className="absolute inset-0"
              onClick={() => setShowAuthModal(false)}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500 ease-out">
              {/* Decorative Element */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden"></div>

              <div className="flex flex-col items-center text-center space-y-6 pt-4 sm:pt-0">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-[2rem] shadow-xl shadow-blue-500/20 rotate-3">
                  <FcGoogle className="w-10 h-10 brightness-0 invert" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 font-poppins tracking-tight">Eits, Login dulu! 🛑</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Menu ini khusus untuk pengguna terdaftar. Yuk, login sebentar dengan Google untuk akses penuh!
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => {
                      setShowAuthModal(false);
                      handleLogin();
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                  >
                    <FcGoogle className="w-6 h-6" />
                    <span>Lanjut dengan Google</span>
                  </button>

                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="w-full p-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest"
                  >
                    Nanti Saja
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Update Modal */}
        {showProfileModal && user && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={() => !isUpdatingProfile && setShowProfileModal(false)}></div>
            <div className="relative bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500 ease-out">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full sm:hidden"></div>

              <div className="flex flex-col space-y-6">
                <div className="text-center space-y-2 pt-2 sm:pt-0">
                  <h3 className="text-2xl font-black text-slate-800 font-poppins tracking-tight">Detail Profil Akun 📝</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Kelola data profil Anda dengan mudah.</p>
                </div>

                <div className="space-y-4">
                  {/* Email Field - Disabled */}
                  <div className="group space-y-1.5 transition-all">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email (Akun Utama)</label>
                    <div className="flex items-center gap-3 bg-slate-100/80 p-4 rounded-2xl border border-slate-200 cursor-not-allowed opacity-70">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-600 truncate">{user.email}</span>
                    </div>
                  </div>

                  {/* Name Field - Editable */}
                  <div className="group space-y-1.5 transition-all focus-within:-translate-y-0.5">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">Nama Tampilan</label>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-slate-100 group-focus-within:border-blue-500 transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Nama Anda..."
                        className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full placeholder:text-slate-300"
                        disabled={isUpdatingProfile}
                      />
                    </div>
                  </div>

                  {/* Phone Field - Editable */}
                  <div className="group space-y-1.5 transition-all focus-within:-translate-y-0.5">
                    <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border-2 border-slate-100 group-focus-within:border-indigo-500 transition-all shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-indigo-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                      </svg>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="08123xxx..."
                        className="bg-transparent text-sm font-bold text-slate-800 outline-none w-full placeholder:text-slate-300"
                        disabled={isUpdatingProfile}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-3 pt-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isUpdatingProfile ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowProfileModal(false)}
                    disabled={isUpdatingProfile}
                    className="w-full p-2 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-max max-w-[90vw] animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] shadow-2xl border backdrop-blur-xl transition-all
                ${toast.type === 'success'
                  ? 'bg-blue-600/90 border-blue-400/30 text-white'
                  : 'bg-rose-600/90 border-rose-400/30 text-white'}
              `}
            >
              {toast.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
              <span className="text-sm font-bold tracking-wide">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
