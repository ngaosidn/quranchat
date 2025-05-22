'use client';

import { useState, useRef, useEffect } from 'react';
import { FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
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
  audioUrl?: string;
}

// Fungsi deteksi mobile
function isMobile() {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
}

export default function RTM() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ [id: string]: number }>({});
  const [audioDurations, setAudioDurations] = useState<{ [id: string]: number }>({});
  const audioRefs = useRef<{ [id: string]: HTMLAudioElement | null }>({});

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load messages from localStorage on client-side only
  useEffect(() => {
    const loadMessages = () => {
      if (typeof window !== 'undefined') {
        const savedMessages = localStorage.getItem('rtmChatHistory');
        console.log('Loading saved messages:', savedMessages);
        if (savedMessages) {
          try {
            const parsedMessages = JSON.parse(savedMessages);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
              console.log('Setting messages from localStorage:', parsedMessages);
              setMessages(parsedMessages);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Error parsing saved messages:', error);
          }
        }
        // If no messages were loaded or error occurred, set initial message
        setMessages([{
          type: 'bot',
          content: 'Selamat datang di Rumus Tajwid Mudah (RTM)! 🎓\nSilakan klik 👁️ atau masukan perintah untuk pencarian hukum tajwid\n\nContoh:\nmad thabi\'i'
        }]);
        setIsLoading(false);
      }
    };

    loadMessages();
  }, []); // Empty dependency array to run only once on mount

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0 && !isLoading) {
      console.log('Saving messages to localStorage:', messages);
      localStorage.setItem('rtmChatHistory', JSON.stringify(messages));
    }
  }, [messages, isLoading]);

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

  const handleMenuClick = (menuId: string) => {
    setSelectedMenu(menuId);
    setShowMenu(false);
    setMessages(prev => [...prev, {
      type: 'user',
      content: menuId
    }]);

    // Handle different menus
    switch(menuId) {
      case 'mad':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Mad:'
        }]);
        break;
      case 'nun-sukun-tanwin':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Nun Sukun dan Tanwin:'
        }]);
        break;
      case 'mim-sukun':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Mim Sukun:'
        }]);
        break;
      case 'nun-mim-tasydid':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Nun dan Mim Tasydid:'
        }]);
        break;
      case 'qolqolah':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Qolqolah:'
        }]);
        break;
      case 'ahkam-raa':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Ahkam Raa:'
        }]);
        break;
      case 'ahkam-lam-jalalah':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Ahkam Lam Jalalah:'
        }]);
        break;
      case 'ayat-gharibah':
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Silakan pilih jenis Ayat Gharibah:'
        }]);
        break;
      default:
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Menu ini sedang dalam pengembangan. Silakan pilih menu lain.'
        }]);
    }
  };

  const handleCommand = async (command: string) => {
    setLoading(true);
    
    // Add user message
    setMessages(prev => [...prev, { 
      type: 'user', 
      content: command === '1' ? 'Mad Thabi\'i' : command 
    }]);

    try {
      // Map command to image and audio URLs
      const imageMap: { [key: string]: { image: string, audio: string } } = {
        'mad-thabii': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 1 - Mad Thabi\'i.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 1 - Mad Thabi\'i.mp3'
        },
        'mad-badal': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 2 - Mad Badal.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 2 - Mad Badal.mp3'
        },
        'mad-iwadh': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 3 - Mad Iwadh.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 3 - Mad Iwadh.mp3'
        },
        'mad-shilah-sugro': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 4 - Mad Shilah Sugro.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 4 - Mad Shilah Sugro.mp3'
        },
        'mad-tamkin': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 5 - Mad Tamkin.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 5 - Mad Tamkin.mp3'
        },
        'mad-jaiz-munfashil': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 6 - Mad Jaiz Munfashil.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 6 - Mad Jaiz Munfashil.mp3'
        },
        'mad-wajib-muttasil': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 7 - Mad Wajib Mutthasil.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 7 - Mad Wajib Mutthasil.mp3'
        },
        'mad-shilah-kubro': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 8 - Mad Shilah Kubro.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 8 - Mad Shilah Kubro.mp3'
        },
        'mad-arid-lissukun': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 9 - Mad Aridh Lisukun.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 9 - Mad Aridh Lisukun.mp3'
        },
        'mad-lazim-kilmi-mutsaqol': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 10 - Mad Lazim Kilmi Mutsaqol.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 10 - Mad Lazim Kilmi Mutsaqol.mp3'
        },
        'mad-lazim-kilmi-mukhofaf': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 11 - Mad Lazim Kilmi Mukhofaf.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 11 - Mad Lazim Kilmi Mukhofaf.mp3'
        },
        'mad-lazim-harfi-mutsaqol': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 12 - Mad Lazim Harfi Mutsaqol.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 12 - Mad Lazim Harfi Mutsaqol.mp3'
        },
        'mad-lazim-harfi-mukhofaf': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 13 - Mad Lazim Harfi Mukhofaf.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 13 - Mad Lazim Harfi Mukhofaf.mp3'
        },
        'mad-thabii-harfi': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 14 - Mad Thabi\'i Harfi.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 14 - Mad Thabi\'i Harfi.mp3'
        },
        'mad-farq': {
          image: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 15 - Mad Farq.jpg',
          audio: 'https://raw.githubusercontent.com/ngaosidn/dbTajwid/main/01 - 15 - Mad Farq.mp3'
        }
      };

      const urls = imageMap[command];
      
      if (urls) {
        // Check if image exists
        const imageResponse = await fetch(urls.image, { method: 'HEAD' });
        const audioResponse = await fetch(urls.audio, { method: 'HEAD' });
        
        if (imageResponse.ok) {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: `Berikut adalah penjelasan ${command.replace(/-/g, ' ').replace(/mad/i, 'Mad')}:`,
            imageUrl: urls.image,
            audioUrl: audioResponse.ok ? urls.audio : undefined
          }]);
        } else {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: 'Data belum ada'
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Data belum ada'
        }]);
      }
    } catch (error) {
      console.error('Error details:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Data belum ada'
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
    const newMessages: Message[] = [...messages, { type: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    console.log('After adding user message:', newMessages);

    // Handle commands
    const madCommands: { [key: string]: string } = {
      'mad thabi\'i': 'mad-thabii',
      'mad badal': 'mad-badal',
      'mad iwadh': 'mad-iwadh',
      'mad shilah sugro': 'mad-shilah-sugro',
      'mad tamkin': 'mad-tamkin',
      'mad jaiz munfashil': 'mad-jaiz-munfashil',
      'mad wajib mutthasil': 'mad-wajib-muttasil',
      'mad shilah kubro': 'mad-shilah-kubro',
      'mad aridh lisukun': 'mad-arid-lissukun',
      'mad lazim kilmi mutsaqol': 'mad-lazim-kilmi-mutsaqol',
      'mad lazim kilmi mukhofaf': 'mad-lazim-kilmi-mukhofaf',
      'mad lazim harfi mutsaqol': 'mad-lazim-harfi-mutsaqol',
      'mad lazim harfi mukhofaf': 'mad-lazim-harfi-mukhofaf',
      'mad thabi\'i harfi': 'mad-thabii-harfi',
      'mad farq': 'mad-farq'
    };

    // Check if the message matches any mad command
    const matchedCommand = Object.entries(madCommands).find(([key]) => 
      userMessage === key.toLowerCase()
    );

    if (matchedCommand) {
      await handleCommand(matchedCommand[1]);
    } else {
      const botResponse: Message = {
        type: 'bot' as const,
        content: 'Perintah tidak dikenali. Silakan gunakan tombol menu atau ketik nama hukum tajwid yang ingin dipelajari.'
      };
      const updatedMessages: Message[] = [...newMessages, botResponse];
      setMessages(updatedMessages);
      console.log('After adding bot response:', updatedMessages);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Set theme color for mobile status bar
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", "#9333ea");
    }
    
    // Cleanup function to reset theme color when leaving the page
    return () => {
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", "#2563eb");
      }
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-white">
      {/* Header */}
      <div className="w-full max-w-md mx-auto sticky top-0 z-10">
        <div className="bg-purple-600 rounded-b-3xl px-6 pt-10 pb-6 relative shadow">
          <button
            onClick={() => router.replace('/')}
            className="absolute top-4 right-4 text-white hover:text-purple-200 transition-colors p-2 rounded-full bg-purple-500/30 hover:bg-purple-700/60"
            aria-label="Kembali ke Beranda"
          >
            <IoArrowBack className="w-7 h-7" />
          </button>
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
          {!isLoading && messages.map((msg, idx) => (
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
                {msg.audioUrl && (
                  <div className="mt-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <button
                        id={`play-button-${msg.audioUrl}-${idx}`}
                        type="button"
                        onClick={() => {
                          const audioElement = document.getElementById(`audio-${msg.audioUrl}-${idx}`) as HTMLAudioElement;
                          if (!audioElement) return;
                          if (audioElement.paused) {
                            // Pause all other audio elements
                            Object.values(audioRefs.current).forEach(audio => {
                              if (audio && audio !== audioElement) {
                                audio.pause();
                              }
                            });
                            audioElement.play();
                            setPlayingAudioId(`${msg.audioUrl}-${idx}`);
                          } else {
                            audioElement.pause();
                            setPlayingAudioId(null);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all hover:from-purple-600 hover:to-purple-700 cursor-pointer shrink-0"
                        style={{
                          transform: playingAudioId === `${msg.audioUrl}-${idx}`
                            ? `rotate(${(audioProgress[`${msg.audioUrl}-${idx}`] || 0) * 360}deg)`
                            : 'rotate(0deg)',
                          transition: 'transform 0.3s ease-out'
                        }}
                        aria-label="Play/Pause Audio"
                      >
                        {playingAudioId === `${msg.audioUrl}-${idx}` ? (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="2" />
                            <rect x="14" y="4" width="4" height="16" rx="2" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-purple-900">Audio Penjelasan</div>
                        <div className="text-xs text-purple-600">Dengarkan penjelasan hukum tajwid</div>
                        <div className="flex flex-col mt-2">
                          <div
                            className="relative h-2.5 w-full bg-purple-100 rounded-full cursor-pointer group"
                            style={{ userSelect: 'none' }}
                            onClick={e => {
                              const bar = e.currentTarget;
                              const rect = bar.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const percent = Math.max(0, Math.min(1, x / rect.width));
                              setAudioProgress(prev => ({ ...prev, [`${msg.audioUrl}-${idx}`]: percent }));
                              const audio = document.getElementById(`audio-${msg.audioUrl}-${idx}`) as HTMLAudioElement;
                              if (audio && audio.duration) {
                                audio.currentTime = percent * audio.duration;
                              }
                            }}
                          >
                            <div
                              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-200"
                              style={{ width: `${(audioProgress[`${msg.audioUrl}-${idx}`] || 0) * 100}%` }}
                            />
                            <div
                              className="absolute top-1/2 transform -translate-y-1/2"
                              style={{
                                left: `calc(${(audioProgress[`${msg.audioUrl}-${idx}`] || 0) * 100}% - 6px)`
                              }}
                            >
                              <div className="w-3.5 h-3.5 bg-white border-2 border-purple-400 rounded-full shadow group-hover:scale-110 transition-transform duration-150" />
                            </div>
                          </div>
                          <div className="text-[10px] text-purple-600 font-medium mt-1 text-right">
                            {formatTime((audioProgress[`${msg.audioUrl}-${idx}`] || 0) * (audioDurations[`${msg.audioUrl}-${idx}`] || 0))} / {formatTime(audioDurations[`${msg.audioUrl}-${idx}`] || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <audio 
                      id={`audio-${msg.audioUrl}-${idx}`}
                      className="hidden"
                      controlsList="nodownload"
                      ref={el => { 
                        audioRefs.current[`${msg.audioUrl}-${idx}`] = el;
                        if (el) {
                          el.addEventListener('loadedmetadata', () => {
                            setAudioDurations(prev => ({
                              ...prev,
                              [`${msg.audioUrl}-${idx}`]: el.duration
                            }));
                          });
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const audioElement = e.currentTarget;
                        const progress = (audioElement.currentTime / audioElement.duration) || 0;
                        setAudioProgress(prev => ({ ...prev, [`${msg.audioUrl}-${idx}`]: progress }));
                      }}
                      onPlay={() => setPlayingAudioId(`${msg.audioUrl}-${idx}`)}
                      onPause={() => setPlayingAudioId(null)}
                      onEnded={() => {
                        setPlayingAudioId(null);
                        setAudioProgress(prev => ({ ...prev, [`${msg.audioUrl}-${idx}`]: 0 }));
                      }}
                    >
                      <source src={msg.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                {msg.type === 'bot' && msg.content.includes('Selamat datang di Rumus Tajwid Mudah (RTM)!') && (
                  <div className="mt-3 space-y-1.5">
                    {/* Menu buttons removed from here since they're now in the slide up component */}
                  </div>
                )}
                {selectedMenu === 'mad' && msg.type === 'bot' && msg.content.includes('Silakan pilih jenis Mad:') && (
                  <div className="mt-3 space-y-1.5 flex flex-col items-start">
                    {[
                      { id: 'mad-thabii', title: 'Mad Thabi\'i (2 Harakat)', icon: '1️⃣' },
                      { id: 'mad-badal', title: 'Mad Badal (2 Harakat)', icon: '2️⃣' },
                      { id: 'mad-iwadh', title: 'Mad Iwadh (2 Harakat)', icon: '3️⃣' },
                      { id: 'mad-shilah-sugro', title: 'Mad Shilah Sugro (2 Harakat)', icon: '4️⃣' },
                      { id: 'mad-tamkin', title: 'Mad Tamkin (2 Harakat)', icon: '5️⃣' },
                      { id: 'mad-jaiz-munfashil', title: 'Mad Jaiz Munfashil (2, 4, 5 Harakat)', icon: '6️⃣' },
                      { id: 'mad-wajib-muttasil', title: 'Mad Wajib Mutthasil (4 - 6 Harakat)', icon: '7️⃣' },
                      { id: 'mad-shilah-kubro', title: 'Mad Shilah Kubro (4 - 5 Harakat)', icon: '8️⃣' },
                      { id: 'mad-arid-lissukun', title: 'Mad Aridh Lisukun (2, 4, 6 Harakat)', icon: '9️⃣' },
                      { id: 'mad-lazim-kilmi-mutsaqol', title: 'Mad Lazim Kilmi Mutsaqol (6 Harakat)', icon: '🔟' },
                      { id: 'mad-lazim-kilmi-mukhofaf', title: 'Mad Lazim Kilmi Mukhofaf (6 Harakat)', icon: '1️⃣1️⃣' },
                      { id: 'mad-lazim-harfi-mutsaqol', title: 'Mad Lazim Harfi Mutsaqol (6 Harakat + 2)', icon: '1️⃣2️⃣' },
                      { id: 'mad-lazim-harfi-mukhofaf', title: 'Mad Lazim Harfi Mukhofaf (6 Harakat)', icon: '1️⃣3️⃣' },
                      { id: 'mad-thabii-harfi', title: 'Mad Thabi\'i Harfi (2 Harakat)', icon: '1️⃣4️⃣' },
                      { id: 'mad-farq', title: 'Mad Farq (2 Harakat)', icon: '1️⃣5️⃣' }
                    ].map((submenu) => (
                      <button
                        key={submenu.id}
                        onClick={() => handleCommand(submenu.id)}
                        className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
                      >
                        <span className="text-sm">{submenu.icon}</span>
                        <span>{submenu.title}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedMenu && selectedMenu !== 'mad' && msg.type === 'bot' && msg.content.includes('Silakan pilih jenis') && (
                  <div className="mt-3 space-y-1.5 flex flex-col items-start">
                    <button
                      onClick={() => setSelectedMenu(null)}
                      className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
                    >
                      <span>Kembali ke Menu Utama</span>
                    </button>
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
                content: 'Selamat datang di Rumus Tajwid Mudah (RTM)! 🎓\nSilakan klik 👁️ atau masukan perintah untuk pencarian hukum tajwid\n\nContoh:\nmad thabi\'i'
              }]);
              setSelectedMenu(null);
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
            style={{ WebkitAppearance: 'none', appearance: 'none' }}
          />
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-purple-600 transition-colors shrink-0"
            aria-label={showMenu ? "Hide menu" : "Show menu"}
          >
            {showMenu ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
          </button>
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

      {/* Menu Slide Up */}
      <div className={`fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto z-10 bg-white rounded-t-2xl shadow-lg transition-transform duration-300 ease-in-out ${showMenu ? '-translate-y-[40px]' : 'translate-y-full'}`}>
        <div className="p-4 pb-8 space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleMenuClick('mad')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Mad</span>
            </button>
            <button
              onClick={() => handleMenuClick('nun-sukun-tanwin')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Nun Sukun & Tanwin</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleMenuClick('mim-sukun')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Mim Sukun</span>
            </button>
            <button
              onClick={() => handleMenuClick('nun-mim-tasydid')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Nun & Mim Tasydid</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleMenuClick('qolqolah')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Qolqolah</span>
            </button>
            <button
              onClick={() => handleMenuClick('ahkam-raa')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Ahkam Raa</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleMenuClick('ahkam-lam-jalalah')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Ahkam Lam Jalalah</span>
            </button>
            <button
              onClick={() => handleMenuClick('ayat-gharibah')}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-2.5 rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <span>Ayat Gharibah</span>
            </button>
          </div>
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