'use client';

import { useState, useRef, useEffect } from 'react';
import { FaTrash } from "react-icons/fa";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// TypeScript type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  isCommand?: boolean;
  imageUrl?: string;
}

// Fungsi deteksi mobile
function isMobile() {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
}

export default function RTM() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([{
    type: 'bot',
    content: 'Selamat datang di Rumus Tajwid Mudah (RTM)! 🎓\n\nSilakan pilih menu di bawah ini :\n\n1. Mad Thabi\'i (2 Harakat)'
  }]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const SHOW_ANNOUNCEMENT = process.env.NEXT_PUBLIC_SHOW_ANNOUNCEMENT === 'true';
  useEffect(() => {
    if (SHOW_ANNOUNCEMENT) {
      router.replace('/');
    }
  }, [SHOW_ANNOUNCEMENT, router]);

  // Load messages from localStorage on client-side only
  useEffect(() => {
    const savedMessages = localStorage.getItem('rtmChatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('rtmChatHistory', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
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

  const handleCommand = async (command: string) => {
    setLoading(true);
    
    // Add user message
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: command === '1' ? 'Mad Thabi\'i' : command 
    }]);

    try {
      // Add bot response with image
      const imageUrl = 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 1 - Mad Thabi\'i.jpg';
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Berikut adalah penjelasan Mad Thabi\'i:',
        imageUrl: imageUrl
      }]);
    } catch (error) {
      console.error('Error details:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Maaf, terjadi kesalahan saat mengambil data. Silakan coba lagi.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim().toLowerCase();
    setInput('');
    setLoading(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    // Handle commands
    if (userMessage === '1' || 
        userMessage === 'mad 2 harakat' || 
        userMessage === 'mad thabii' || 
        userMessage === 'mad thabi\'i') {
      await handleCommand('1');
    } else {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Perintah tidak dikenali. Silakan gunakan tombol menu atau ketik "1" untuk Mad Thabi\'i.'
      }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-white">
      {/* Header */}
      <div className="w-full max-w-md mx-auto sticky top-0 z-10">
        <div className="bg-purple-600 rounded-b-3xl px-6 pt-10 pb-6 relative shadow">
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
          <div className="text-white text-sm font-normal font-poppins">Rumus Tajwid Mudah</div>
          <div className="text-white text-sm font-normal font-poppins">Belajar Tajwid dengan Mudah ✨</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-end pb-28 sm:pb-20" style={{ minHeight: 'calc(100dvh - 220px)' }}>
        <div className="flex-1 flex flex-col space-y-2.5 sm:space-y-3 px-4 pt-3 sm:pt-4 overflow-y-auto scrollbar-none" style={{ minHeight: 200 }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}> 
              {msg.type !== 'user' && (
                <Image src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740" alt="Bot" width={32} height={32} className="rounded-full object-cover mt-1" />
              )}
              <div
                className={`rounded-2xl px-3.5 sm:px-4 py-2 shadow max-w-[85%] text-sm leading-relaxed transition-all whitespace-pre-line
                  ${msg.type === 'user'
                    ? 'bg-purple-400 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-purple-100 rounded-bl-md'}
                `}
              >
                {msg.content}
                {msg.imageUrl && (
                  <div className="mt-2">
                    <Image 
                      src={msg.imageUrl}
                      alt="Tajwid Explanation"
                      width={400}
                      height={300}
                      className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity w-full"
                      onClick={() => setSelectedImage(msg.imageUrl || null)}
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              {msg.type === 'user' && (
                <Image src="https://www.svgrepo.com/show/382106/male-avatar-boy-face-man-user-9.svg" alt="You" width={28} height={28} className="rounded-full object-cover ml-2 mb-1" />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto z-20 bg-white rounded-t-2xl shadow-lg px-3.5 sm:px-4 py-2 sm:py-2.5 border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2.5 sm:gap-3">
          <button 
            type="button" 
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
            aria-label="Clear chat history"
            onClick={() => {
              setMessages([{
                type: 'bot',
                content: 'Selamat datang di Rumus Tajwid Mudah (RTM)! 🎓\n\nSilakan pilih menu di bawah ini :\n\n1. Mad Thabi\'i (2 Harakat)'
              }]);
              localStorage.removeItem('rtmChatHistory');
            }}
          >
            <FaTrash className="w-5 h-5" />
          </button>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base w-full"
            placeholder="Ketik pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow transition-all shrink-0 ${
              loading || !input.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 active:scale-95'
            }`}
          >
            Kirim
          </button>
        </form>
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && isMobile() && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-sm mx-auto">
            <h2 className="text-lg font-bold mb-2">Install App</h2>
            <p className="mb-4 text-gray-600 text-center text-sm sm:text-base">Install aplikasi ini di perangkat Anda untuk pengalaman terbaik di Android!</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded font-semibold w-full sm:w-auto"
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

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Image 
            src={selectedImage}
            alt="Tajwid Explanation"
            width={800}
            height={600}
            className="max-w-full max-h-[90vh] object-contain"
            onError={(e) => {
              console.error('Modal image failed to load:', e);
              setSelectedImage(null);
            }}
          />
        </div>
      )}
    </div>
  );
} 