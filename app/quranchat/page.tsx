'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { FaTrash } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const VerseListComponent = dynamic(() => import('../components/VerseList'), {
  ssr: false
});

// TypeScript type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface SearchResult {
  id: number;
  name_simple: string;
  name_arabic: string;
  name_english: string;
  verses_count: number;
  revelation_place: string;
  translated_name?: { name: string };
}

interface WordSearchResult {
  surah: SearchResult;
  verse_number: number;
  text_uthmani: string;
  translation: string;
  wordCount: number;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  surah?: SearchResult;
  surahs?: SearchResult[];
  ayat?: number;
  ayatRange?: { start: number; end: number };
  wordSearchResults?: WordSearchResult[];
  wordSearchSummary?: {
    word: string;
    count: number;
    results: WordSearchResult[];
  };
  isRandom?: boolean;
}

interface TafsirData {
  ayat: number;
  teks: string;
}

interface TafsirResponse {
  data: {
    tafsir: TafsirData[];
  };
}

interface SingleAyatData {
  verse_number: number;
  text_uthmani: string;
  translations: Array<{
    text: string;
  }>;
}

// Fungsi deteksi mobile
function isMobile() {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);
}

export default function QuranChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedAyatRange, setSelectedAyatRange] = useState<{ start: number; end: number } | null>(null);
  const [allSurahs, setAllSurahs] = useState<SearchResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [singleAyat, setSingleAyat] = useState<{ surah: SearchResult, ayat: number } | null>(null);
  const [singleAyatData, setSingleAyatData] = useState<SingleAyatData | null>(null);
  const [showWordSearchModal, setShowWordSearchModal] = useState(false);
  const [wordSearchData, setWordSearchData] = useState<{
    word: string;
    results: WordSearchResult[];
    count: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const SHOW_ANNOUNCEMENT = process.env.NEXT_PUBLIC_SHOW_ANNOUNCEMENT === 'true';
  useEffect(() => {
    if (SHOW_ANNOUNCEMENT) {
      router.replace('/');
    }
  }, [SHOW_ANNOUNCEMENT, router]);

  // Load messages from localStorage on client-side only
  useEffect(() => {
    const loadMessages = () => {
      if (typeof window !== 'undefined') {
        const savedMessages = localStorage.getItem('quranChatHistory');
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
          content: `Berikut adalah perintah yang tersedia:\n\n📚 1. Ketik "list" untuk melihat daftar surah\n🔍 2. Ketik nama surah (contoh: "al fatihah" atau "yasin")\n🔢 3. Ketik nomor surah (contoh: "1" untuk Al-Fatihah)\n📖 4. Cari ayat spesifik dengan format:\n   - "surah 1 ayat 1"\n   - "al fatihah ayat 1"\n   - "1 1"\n   - "surah al fatihah ayat 1-4"\n   - "1 1-4"\n🔎 5. Cari kata dalam Al-Quran:\n   - "cari malaikat"\n🎲 6. Ketik "random" atau "acak" untuk mendapatkan ayat random\n\nSilakan pilih salah satu perintah di atas untuk memulai.`
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
      localStorage.setItem('quranChatHistory', JSON.stringify(messages));
    }
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchAllSurahs = async () => {
      try {
        const response = await axios.get(`https://api.quran.com/api/v4/chapters?language=id`);
        setAllSurahs(response.data.chapters);
      } catch (error) {
        console.error('Error fetching surahs:', error);
      }
    };
    fetchAllSurahs();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      if (!isMobile()) return; // hanya tampil di mobile
      const promptEvent = e as unknown as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(promptEvent);
      setShowInstallPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (!Array.isArray(allSurahs) || !query || typeof query !== 'string') {
        return [];
      }

      const searchQuery = query.toLowerCase().trim();
      if (!searchQuery) return [];

      return allSurahs.filter((surah) => {
        if (!surah || typeof surah !== 'object') return false;

        const { name_simple, name_arabic, name_english } = surah;
        
        if (!name_simple || !name_arabic || !name_english) return false;

        if (typeof name_simple !== 'string' || 
            typeof name_arabic !== 'string' || 
            typeof name_english !== 'string') return false;

        return (
          name_simple.toLowerCase().includes(searchQuery) ||
          name_arabic.includes(query) ||
          name_english.toLowerCase().includes(searchQuery)
        );
      });
    },
    [allSurahs]
  );

  // Memoize search results
  const searchResults = useMemo(() => {
    if (!input || typeof input !== 'string' || !input.trim()) {
      return [];
    }

    if (!Array.isArray(allSurahs)) {
      return [];
    }

    return debouncedSearch(input);
  }, [input, debouncedSearch, allSurahs]);

  // Word search function
  const searchWordInQuran = useCallback(async (query: string): Promise<WordSearchResult[]> => {
    try {
      setIsLoading(true);
      const results: WordSearchResult[] = [];
      const searchQuery = query.toLowerCase();

      // Get all verses at once with search
      const searchResponse = await axios.get(
        'https://api.quran.com/api/v4/search?' +
        `q=${encodeURIComponent(query)}&` +
        'language=id&' +
        'size=300&' + // Get more results
        'page=1&' +
        'fields=verse_key,text_uthmani,translations&' +
        'translations=33&' + // Indonesian translation
        'word_fields=text_uthmani&' +
        'word_translation_language=id&' +
        'mushaf=1' // Use standard mushaf
      );

      const searchResults = searchResponse.data.search.results;
      
      // Process search results
      for (const result of searchResults) {
        const [surahId, verseNumber] = result.verse_key.split(':').map(Number);
        const surah = allSurahs.find(s => s.id === surahId);
        
        if (surah) {
          // Get the full verse data
          const verseResponse = await axios.get(
            `https://api.quran.com/api/v4/verses/by_key/${result.verse_key}?` +
            'fields=text_uthmani&' +
            'words=true&' +
            'word_fields=text_uthmani&' +
            'translations=33&' +
            'mushaf=1' // Use standard mushaf
          );

          const verseData = verseResponse.data.verse;
          
          // Only add if the verse contains the search word
          const translation = verseData.translations?.[0]?.text || '';
          const arabicText = verseData.text_uthmani || '';
          
          if (translation.toLowerCase().includes(searchQuery) || 
              arabicText.includes(query)) {
            // Count word occurrences
            const translationCount = (translation.toLowerCase().match(new RegExp(searchQuery, 'g')) || []).length;
            const arabicCount = (arabicText.match(new RegExp(query, 'g')) || []).length;
            const totalCount = translationCount + arabicCount;

            results.push({
              surah,
              verse_number: verseNumber,
              text_uthmani: arabicText,
              translation: translation.replace(/<sup[^>]*>.*?<\/sup>/g, ''),
              wordCount: totalCount
            });
          }
        }
      }

      // Sort results by surah number and verse number
      return results.sort((a, b) => {
        if (a.surah.id !== b.surah.id) {
          return a.surah.id - b.surah.id;
        }
        return a.verse_number - b.verse_number;
      });
    } catch (error) {
      console.error('Error searching word:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [allSurahs]);

  // Fungsi untuk mendapatkan random ayat
  const getRandomAyat = useCallback(async () => {
    try {
      // Get all surahs first
      const surahsResponse = await axios.get('https://api.quran.com/api/v4/chapters?language=id');
      const surahs = surahsResponse.data.chapters;
      
      // Get total verses count
      const totalVerses = surahs.reduce((sum: number, surah: SearchResult) => sum + surah.verses_count, 0);
      
      // Generate random verse number (1 to total verses)
      const randomVerseNumber = Math.floor(Math.random() * totalVerses) + 1;
      
      // Find which surah contains this verse
      let currentVerseCount = 0;
      let selectedSurah = null;
      let verseInSurah = 0;
      
      for (const surah of surahs) {
        if (currentVerseCount + surah.verses_count >= randomVerseNumber) {
          selectedSurah = surah;
          verseInSurah = randomVerseNumber - currentVerseCount;
          break;
        }
        currentVerseCount += surah.verses_count;
      }
      
      if (!selectedSurah) {
        throw new Error('Could not find surah for random verse');
      }
      
      // Get verse data
      const verseResponse = await axios.get(
        `https://api.quran.com/api/v4/verses/by_key/${selectedSurah.id}:${verseInSurah}?words=true&word_fields=text_uthmani&translations=33&fields=text_uthmani`
      );
      
      return {
        surah: selectedSurah,
        ayat: verseInSurah,
        data: verseResponse.data.verse
      };
    } catch (error) {
      console.error('Error getting random ayat:', error);
      // Jika terjadi error, coba lagi
      return getRandomAyat();
    }
  }, []);

  // Modify the handleSearch function
  const handleSearch = useCallback(async (userMessage: string) => {
    try {
      if (!allSurahs) {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Maaf, data surah belum siap. Silakan coba lagi dalam beberapa saat.'
        }]);
        return;
      }

      // Check for word search command
      const wordSearchPattern = /^(?:cari|search)\s+(.+)$/i;
      const wordSearchMatch = userMessage.match(wordSearchPattern);
      
      if (wordSearchMatch) {
        const searchQuery = wordSearchMatch[1].trim();
        setIsLoading(true);
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `🔍 Mencari kata "${searchQuery}" dalam Al-Quran...`
        }]);
        
        // Add artificial delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const results = await searchWordInQuran(searchQuery);
        
        if (results.length === 0) {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: `❌ Maaf, tidak ditemukan ayat yang mengandung kata "${searchQuery}".`
          }]);
        } else {
          // Group results by surah
          const surahGroups = results.reduce((acc, result) => {
            const surahId = result.surah.id;
            if (!acc[surahId]) {
              acc[surahId] = {
                surah: result.surah,
                count: 0,
                wordCount: 0,
                verses: []
              };
            }
            acc[surahId].count++;
            acc[surahId].wordCount += result.wordCount;
            acc[surahId].verses.push(result);
            return acc;
          }, {} as Record<number, { surah: SearchResult; count: number; wordCount: number; verses: WordSearchResult[] }>);

          // Calculate total word occurrences
          const totalWordCount = results.reduce((sum, result) => sum + result.wordCount, 0);

          // Create summary message
          const summaryMessage = `✅ Kata "${searchQuery}" ditemukan ${totalWordCount} kali dalam ${results.length} ayat Al-Quran:\n\n` +
            Object.values(surahGroups)
              .sort((a, b) => a.surah.id - b.surah.id)
              .map(group => `📖 Surah ${group.surah.name_simple}: ${group.wordCount} kali dalam ${group.count} ayat`)
              .join('\n');

          setMessages(prev => [...prev, {
            type: 'bot',
            content: summaryMessage,
            wordSearchSummary: {
              word: searchQuery,
              count: totalWordCount,
              results: results
            }
          }]);
        }
        return;
      }

      // Check for random command
      if (userMessage.toLowerCase() === 'random' || userMessage.toLowerCase() === 'acak') {
        const randomResult = await getRandomAyat();
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `🎲 Berikut adalah satu ayat random dari Al-Quran:\nSurah ${randomResult.surah.id} - ${randomResult.surah.name_simple} (Ayat ${randomResult.ayat})`,
          surah: randomResult.surah,
          ayat: randomResult.ayat
        }]);
        setIsLoading(false);
        return;
      }

      // Perintah cari ayat spesifik (single ayat atau range ayat)
      const ayatPattern = /^(?:surah\s*)?(\d+|[\w\- ]+)[\s-]*ayat[\s-]*(\d+)(?:[\s-]*[-–]\s*(\d+))?$/i;
      const ayatPattern2 = /^(?:surah\s*)?(\d+)[\s-]+(\d+)(?:[\s-]*[-–]\s*(\d+))?$/i;
      const matchAyat = userMessage.match(ayatPattern) || userMessage.match(ayatPattern2);
      
      if (matchAyat) {
        const surahQuery = matchAyat[1].trim().replace(/-/g, ' ');
        const startAyat = parseInt(matchAyat[2]);
        const endAyat = matchAyat[3] ? parseInt(matchAyat[3]) : startAyat;
        
        let surahInfo = null;
        if (/^\d+$/.test(surahQuery)) {
          surahInfo = allSurahs.find(s => s.id === parseInt(surahQuery));
        } else {
          surahInfo = allSurahs.find(s =>
            s.name_simple.toLowerCase().replace(/-/g, ' ') === surahQuery.toLowerCase() ||
            s.name_arabic.replace(/-/g, ' ') === surahQuery ||
            s.translated_name?.name.toLowerCase().replace(/-/g, ' ') === surahQuery.toLowerCase()
          );
        }

        if (surahInfo) {
          // Validasi range ayat
          if (startAyat > endAyat) {
            setMessages(prev => [...prev, {
              type: 'bot',
              content: '❌ Maaf, range ayat tidak valid. Ayat awal harus lebih kecil dari ayat akhir.'
            }]);
            return;
          }

          if (endAyat > surahInfo.verses_count) {
            setMessages(prev => [...prev, {
              type: 'bot',
              content: `❌ Maaf, ayat ${endAyat} tidak ditemukan dalam Surah ${surahInfo.name_simple}. Surah ini hanya memiliki ${surahInfo.verses_count} ayat.`
            }]);
            return;
          }

          const ayatText = startAyat === endAyat ? `ayat ${startAyat}` : `ayat ${startAyat}-${endAyat}`;
          setMessages(prev => [...prev, {
            type: 'bot',
            content: `📖 Klik tombol berikut untuk melihat ${ayatText} Surah ${surahInfo.name_simple} (${surahInfo.name_arabic}):`,
            surah: surahInfo,
            ayat: startAyat,
            ayatRange: { start: startAyat, end: endAyat }
          }]);
          return;
        }
      }
      // Perintah surah
      const surahPattern = /^(?:surah |surat )?([\w\- ]+)$/i;
      const match = userMessage.match(surahPattern);
      if (match) {
        const query = match[1].trim().replace(/-/g, ' ');
        let surahInfo = null;
        // Cek jika query angka
        if (/^\d+$/.test(query)) {
          surahInfo = allSurahs.find(s => s.id === parseInt(query));
        } else {
          surahInfo = allSurahs.find(s =>
            s.name_simple.toLowerCase().replace(/-/g, ' ') === query.toLowerCase() ||
            s.name_arabic.replace(/-/g, ' ') === query ||
            s.translated_name?.name.toLowerCase().replace(/-/g, ' ') === query.toLowerCase()
          );
        }
        if (surahInfo) {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: `📖 Informasi Surah :\n\n` +
              `📌 Nama Surah : ${surahInfo.name_simple} (${surahInfo.name_arabic})\n` +
              `📝 Arti Nama : ${surahInfo.translated_name?.name || '-'}\n` +
              `📍 Tempat Turun : ${surahInfo.revelation_place === 'makkah' ? 'Makkiyah' : 'Madaniyah'}\n` +
              `📊 Jumlah Ayat : ${surahInfo.verses_count}`
          }]);
          return;
        }
      }
      // Perintah list (tetap ada)
      if (userMessage.toLowerCase() === 'list') {
        setMessages(prev => [...prev, {
          type: 'bot',
          content: 'Berikut adalah daftar surah dalam Al-Quran:',
          surahs: allSurahs
        }]);
      } else {
        const filteredResults = searchResults || [];

        if (filteredResults.length === 0) {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: '❌ Maaf, saya tidak menemukan surah yang Anda cari. Silakan coba dengan nama surah yang lain atau ketik "list" untuk melihat daftar surah.'
          }]);
        } else {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: `✅ Saya menemukan ${filteredResults.length} surah yang cocok dengan pencarian Anda:`,
            surah: filteredResults[0]
          }]);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Maaf, terjadi kesalahan saat mencari surah. Silakan coba lagi.'
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [allSurahs, searchWordInQuran, searchResults, getRandomAyat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Check for random command
      if (userMessage.toLowerCase() === 'random' || userMessage.toLowerCase() === 'acak') {
        const randomResult = await getRandomAyat();
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `🎲 Berikut adalah satu ayat random dari Al-Quran:\nSurah ${randomResult.surah.id} - ${randomResult.surah.name_simple} (Ayat ${randomResult.ayat})`,
          surah: randomResult.surah,
          ayat: randomResult.ayat
        }]);
        setIsLoading(false);
        return;
      }

    // Perintah kembali ke menu utama
    if (userMessage.trim().toLowerCase() === 'kembali') {
      router.replace('/');
      return;
    }

    await handleSearch(userMessage);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Di dalam komponen, tambahkan fungsi untuk menangani klik pada tombol ayat
  const handleAyatClick = (surah: SearchResult, ayat: number, ayatRange?: { start: number; end: number }) => {
    setSelectedSurah(surah.id);
    if (ayatRange) {
      setSelectedAyatRange(ayatRange);
    } else {
      setSelectedAyatRange({ start: ayat, end: ayat }); // Set range ke ayat yang sama
    }
  };

  useEffect(() => {
    if (!showWordSearchModal) {
      setCurrentPage(1);
    }
  }, [showWordSearchModal]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-white">
      {/* Header ala Intercom */}
      <div className="w-full max-w-md mx-auto sticky top-0 z-10">
        <div className="bg-blue-600 rounded-b-3xl px-6 pt-10 pb-6 relative shadow">
          <button
            onClick={() => router.replace('/')}
            className="absolute top-4 right-4 text-white hover:text-blue-200 transition-colors p-2 rounded-full bg-blue-500/30 hover:bg-blue-700/60"
            aria-label="Kembali ke Beranda"
          >
            <IoArrowBack className="w-7 h-7" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            {/* <div>
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                width={120} 
                height={41} 
                className="max-w-[120px] h-auto" 
                priority
              />
            </div> */}
          </div>
          <div className="text-white text-sm font-normal font-poppins">Ahlan Bikum!</div>
          <div className="text-white text-sm font-normal font-poppins">Mau baca dan tadabbur ayat apa hari ini? ✨</div>
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
                <pre className="whitespace-pre-wrap">{msg.content}</pre>
                {msg.wordSearchResults && (
                  <div className="mt-2 grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                    {msg.wordSearchResults.map((result, index) => (
                      <div
                        key={`${result.surah.id}-${result.verse_number}-${index}`}
                        className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-blue-100 shadow hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all group relative max-w-full"
                        onClick={() => handleAyatClick(result.surah, result.verse_number)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg shadow group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                            {result.surah.id}
                          </span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-semibold text-gray-800 truncate text-base">
                              Surah {result.surah.name_simple} ({result.surah.name_arabic})
                            </span>
                            <span className="text-blue-500">Ayat {result.verse_number}</span>
                          </div>
                        </div>
                        <div className="font-uthmani text-right text-lg">{result.text_uthmani}</div>
                        <div className="text-gray-600 text-sm">{result.translation}</div>
                      </div>
                    ))}
                  </div>
                )}
                {msg.surahs && (
                  <div className="mt-2 grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                    {msg.surahs.map((surah) => (
                      <div
                        key={surah.id}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-blue-100 shadow hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all group relative max-w-full"
                        onClick={() => handleAyatClick(surah, 0)}
                      >
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg shadow group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                          {surah.id}
                        </span>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold text-gray-800 truncate text-base">{surah.name_simple}</span>
                          <span className="text-blue-500 surah-name-arabic leading-tight truncate">{surah.name_arabic}</span>
                          {surah.translated_name?.name && (
                            <span className="text-xs italic text-gray-500 truncate">{surah.translated_name.name}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                          <span className="flex items-center justify-center h-7 px-3 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 whitespace-nowrap">
                            {surah.verses_count} ayat
                          </span>
                          <span className="text-[11px] italic text-gray-500 whitespace-nowrap">{surah.revelation_place === 'makkah' ? 'Makkiyah' : 'Madaniyah'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {msg.ayat && msg.surah && (
                  <button
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
                    onClick={() => {
                      if (msg.surah && msg.ayat) {
                        handleAyatClick(msg.surah, msg.ayat, msg.ayatRange);
                      }
                    }}
                  >
                    Lihat Ayat
                  </button>
                )}
                {msg.wordSearchSummary && (
                  <div className="mt-2">
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
                      onClick={() => {
                        if (msg.wordSearchSummary) {
                          setWordSearchData({
                            word: msg.wordSearchSummary.word,
                            results: msg.wordSearchSummary.results,
                            count: msg.wordSearchSummary.count
                          });
                          setShowWordSearchModal(true);
                        }
                      }}
                    >
                      Lihat {msg.wordSearchSummary.results.length} Ayat
                    </button>
                  </div>
                )}
              </div>
              {msg.type === 'user' && (
                <Image src="https://www.svgrepo.com/show/382106/male-avatar-boy-face-man-user-9.svg" alt="You" width={28} height={28} className="rounded-full object-cover ml-2 mb-1" />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end justify-start">
              <Image src="https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740" alt="Bot" width={32} height={32} className="rounded-full object-cover mt-1" />
              <div className="rounded-2xl px-3.5 sm:px-4 py-2 shadow max-w-[80%] text-sm leading-relaxed bg-white text-gray-800 border border-blue-100 rounded-bl-md">
                <div className="flex items-center justify-center">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />

        </div>
        {/* Input sticky/fixed */}
        <form
          onSubmit={handleSend}
          className="flex fixed bottom-0 left-0 right-0 w-full max-w-md z-20 bg-white rounded-t-2xl shadow-lg px-3.5 sm:px-4 py-2 sm:py-2.5 gap-2.5 sm:gap-3 border-t border-gray-200 mt-0 sm:mt-1 mb-0 sm:mb-1 mx-auto sm:mx-2 sm:sticky sm:bottom-0"
          style={{ minHeight: '48px' }}
        >
          <button 
            type="button" 
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
            aria-label="Clear chat history"
            onClick={() => {
              setMessages([{
                type: 'bot',
                content: `Berikut adalah perintah yang tersedia:\n\n📚 1. Ketik "list" untuk melihat daftar surah\n🔍 2. Ketik nama surah (contoh: "al fatihah" atau "yasin")\n🔢 3. Ketik nomor surah (contoh: "1" untuk Al-Fatihah)\n📖 4. Cari ayat spesifik dengan format:\n   - "surah 1 ayat 1"\n   - "al fatihah ayat 1"\n   - "1 1"\n   - "surah al fatihah ayat 1-4"\n   - "1 1-4"\n🔎 5. Cari kata dalam Al-Quran:\n   - "cari malaikat"\n🎲 6. Ketik "random" atau "acak" untuk mendapatkan ayat random\n\nSilakan pilih salah satu perintah di atas untuk memulai.`
              }]);
              localStorage.removeItem('quranChatHistory');
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
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`flex items-center justify-center rounded-xl px-4 py-2 font-semibold shadow transition-all shrink-0 ${
              isLoading || !input.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
            }`}
          >
            Kirim
          </button>
        </form>
      </div>

      {/* Modal for VerseList */}
      {selectedSurah && (
        <VerseListComponent
          surahNumber={selectedSurah}
          onClose={() => {
            setSelectedSurah(null);
            setSelectedAyatRange(null);
          }}
          startAyat={selectedAyatRange?.start}
          endAyat={selectedAyatRange?.end}
        />
      )}
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
      {/* Pop up single ayat */}
      {singleAyat && singleAyatData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-green-100 via-white to-green-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 p-4 sm:p-6 relative">
            <button
              className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-lg text-lg p-1 shadow transition-all"
              style={{ minWidth: 28, minHeight: 28 }}
              onClick={() => { setSingleAyat(null); setSingleAyatData(null); }}
            >×</button>
            <h2 className="text-base sm:text-xl font-bold text-gray-800 tracking-wide mb-2 pr-8">
              Surah {singleAyat.surah.id} - {singleAyat.surah.name_simple} (Ayat {singleAyat.ayat})
            </h2>
            <div className="space-y-4 overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="font-uthmani text-right mb-2">{singleAyatData.text_uthmani}</div>
                <div className="translation-text" dangerouslySetInnerHTML={{ 
                  __html: singleAyatData.translations?.[0]?.text?.replace(/<sup[^>]*>.*?<\/sup>/g, '') || "Translation not available" 
                }} />
              </div>
            </div>
            {/* Audio */}
            <audio
              controls
              src={`https://everyayah.com/data/Alafasy_64kbps/${String(singleAyat.surah.id).padStart(3, '0')}${String(singleAyat.ayat).padStart(3, '0')}.mp3`}
              className="w-full my-2"
            />
            {/* Button Tafsir */}
            <TafsirButton surahNumber={singleAyat.surah.id} ayahNumber={singleAyat.ayat} surahName={singleAyat.surah.name_simple} />
          </div>
        </div>
      )}
      {/* Add Word Search Modal */}
      {showWordSearchModal && wordSearchData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 p-4 sm:p-6 relative">
            <button
              className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-lg text-2xl p-2 shadow transition-all"
              style={{ minWidth: 40, minHeight: 40 }}
              onClick={() => {
                setShowWordSearchModal(false);
                setWordSearchData(null);
              }}
            >×</button>
            
            <h3 className="text-lg font-bold mb-4 text-indigo-700 pr-8">
              Hasil Pencarian: &ldquo;{wordSearchData.word}&rdquo; ({wordSearchData.count} kali dalam {wordSearchData.results.length} ayat)
            </h3>

            <div className="space-y-3 overflow-y-auto flex-1">
              {wordSearchData.results
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((result, index) => (
                <div key={`${result.surah.id}-${result.verse_number}-${index}`} className="flex flex-col gap-2 p-4 bg-white rounded-xl border border-blue-100 shadow hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all group relative max-w-full">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg shadow group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                      {result.surah.id}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-gray-800 truncate text-base">
                        Surah {result.surah.name_simple} ({result.surah.name_arabic})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">Ayat {result.verse_number}</span>
                        <span className="text-green-600">({result.wordCount} kali)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="font-uthmani text-right text-2xl sm:text-3xl leading-loose text-gray-800">{result.text_uthmani}</div>
                  <div className="text-gray-600 text-sm" dangerouslySetInnerHTML={{
                    __html: result.translation.replace(
                      new RegExp(`(${wordSearchData.word})`, 'gi'),
                      '<span class="italic font-bold text-blue-600">$1</span>'
                    )
                  }} />
                  
                  {/* Audio */}
                  <audio
                    controls
                    src={`https://everyayah.com/data/Alafasy_64kbps/${String(result.surah.id).padStart(3, '0')}${String(result.verse_number).padStart(3, '0')}.mp3`}
                    className="w-full mb-2"
                  />
                  
                  {/* Tafsir Button */}
                  <TafsirButton 
                    surahNumber={result.surah.id} 
                    ayahNumber={result.verse_number} 
                    surahName={result.surah.name_simple} 
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {wordSearchData.results.length > itemsPerPage && (
              <div className="flex justify-between items-center mt-4 gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    const modalContent = document.querySelector('.space-y-3.overflow-y-auto');
                    if (modalContent) {
                      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-green-200 text-green-800 font-semibold disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-gray-600 text-sm">
                  Halaman {currentPage} dari {Math.ceil(wordSearchData.results.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, Math.ceil(wordSearchData.results.length / itemsPerPage)));
                    const modalContent = document.querySelector('.space-y-3.overflow-y-auto');
                    if (modalContent) {
                      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={currentPage === Math.ceil(wordSearchData.results.length / itemsPerPage)}
                  className="px-3 py-1 rounded bg-green-200 text-green-800 font-semibold disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TafsirButton({ surahNumber, ayahNumber, surahName }: { surahNumber: number, ayahNumber: number, surahName: string }) {
  const [show, setShow] = useState(false);
  const [tafsir, setTafsir] = useState('');
  useEffect(() => {
    if (!show) return;
    fetch(`https://equran.id/api/v2/tafsir/${surahNumber}`)
      .then(res => res.json())
      .then((data: TafsirResponse) => {
        const tafsirAyat = data.data.tafsir.find((t) => t.ayat === ayahNumber);
        setTafsir(tafsirAyat ? tafsirAyat.teks : 'Tafsir tidak tersedia.');
      });
  }, [show, surahNumber, ayahNumber]);
  return (
    <>
      <button
        className="mt-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg font-semibold shadow hover:bg-yellow-500 transition w-full sm:w-auto"
        onClick={() => setShow(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75C2.25 5.507 3.257 4.5 4.5 4.5h5.25v15H4.5a2.25 2.25 0 01-2.25-2.25V6.75zM21.75 6.75c0-1.243-1.007-2.25-2.25-2.25h-5.25v15h5.25a2.25 2.25 0 002.25-2.25V6.75z" />
        </svg>
        Tafsir
      </button>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] p-4 sm:p-6 relative">
            <button
              className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-lg text-2xl p-2 shadow transition-all"
              style={{ minWidth: 40, minHeight: 40 }}
              onClick={() => setShow(false)}
            >×</button>
            <h3 className="text-lg font-bold mb-2 text-indigo-700 pr-8">Tafsir Ayat {ayahNumber}{surahName ? ` - Surah ${surahName}` : ''}</h3>
            <div className="text-gray-700 leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-line mb-4 text-sm sm:text-base">
              {tafsir}
            </div>
            <div className="text-xs text-gray-400 italic text-right">Sumber: equran.id (Tafsir Kementerian Agama RI)</div>
          </div>
        </div>
      )}
    </>
  );
} 