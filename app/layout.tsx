'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from "react";
import PreCacheDialog from "./components/PreCacheDialog";

const inter = Inter({ subsets: ["latin"] });

// Extended Navigator interface for iOS PWA detection
interface ExtendedNavigator extends Navigator {
  standalone?: boolean;
}

// Extended Window interface for MSStream
interface ExtendedWindow extends Window {
  MSStream?: unknown;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showPreCacheDialog, setShowPreCacheDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Check if app is running as PWA
    const checkPWAInstallation = () => {
      // Check for Android PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Check for iOS PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as ExtendedWindow).MSStream;
      const isIOSPWA = isIOS && (navigator as ExtendedNavigator).standalone;
      
      // Check for other PWA indicators
      const isInPWA = window.matchMedia('(display-mode: fullscreen)').matches || 
                     window.matchMedia('(display-mode: minimal-ui)').matches;
      
      const wasInstalled = isPWAInstalled;
      const isNowInstalled = isStandalone || isIOSPWA || isInPWA;
      
      setIsPWAInstalled(isNowInstalled);

      // If PWA was just installed, show pre-cache dialog
      if (!wasInstalled && isNowInstalled) {
        const hasPreCached = localStorage.getItem('hasPreCached');
        if (!hasPreCached) {
          setShowPreCacheDialog(true);
        }
      }
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

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful with scope:', registration.scope);
          })
          .catch(err => {
            console.error('ServiceWorker registration failed:', err);
          });
      });
    }

    // Listen for progress updates from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_PROGRESS') {
          setDownloadProgress(event.data.progress);
          if (event.data.progress === 100) {
            setIsDownloading(false);
            setShowPreCacheDialog(false);
            localStorage.setItem('hasPreCached', 'true');
          }
        }
      });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', checkPWAInstallation);
    };
  }, [isPWAInstalled]);

  const handlePreCache = () => {
    setIsDownloading(true);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'START_CACHING' });
    }
  };

  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        {isPWAInstalled && (
          <PreCacheDialog
            isOpen={showPreCacheDialog}
            onClose={() => setShowPreCacheDialog(false)}
            onConfirm={handlePreCache}
            isDownloading={isDownloading}
            progress={downloadProgress}
          />
        )}
      </body>
    </html>
  );
}
