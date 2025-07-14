'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import React from 'react';

interface Verse {
  ayat: number;
  teks_arab: string;
  terjemahan: string;
} 

interface VerseListProps {
  surahNumber: number;
  onClose: () => void;
  startAyat?: number;
  endAyat?: number;
}

const VERSES_PER_PAGE = 10;

export default function VerseList({ surahNumber, onClose, startAyat, endAyat }: VerseListProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [surahName, setSurahName] = useState<string>("");
  const [showTafsir, setShowTafsir] = useState<{ ayat: number, text: string } | null>(null);
  const [tafsirList, setTafsirList] = useState<Array<{ ayat: number, teks: string }>>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [surahNumber, startAyat, endAyat]);

  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      try {
        // Ambil data ayat dari file lokal JSON
        const response = await fetch('/data/verse.json');
        const data = await response.json();
        const surahData = data[surahNumber];
        if (!surahData) {
          setVerses([]);
          setTotalPages(1);
          return;
        }
        let ayatList = surahData.ayat;
        // Filter berdasarkan range jika ada
        if (startAyat && endAyat) {
          ayatList = ayatList.filter((a: Verse) => a.ayat >= startAyat && a.ayat <= endAyat);
        }
        // Pagination
        setTotalPages(Math.ceil(ayatList.length / VERSES_PER_PAGE));
        setVerses(ayatList);
      } catch (error) {
        console.error('Error fetching verses:', error);
        setVerses([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchVerses();
  }, [surahNumber, currentPage, startAyat, endAyat]);

  useEffect(() => {
    const fetchSurahName = async () => {
      try {
        const res = await axios.get(`https://api.quran.com/api/v4/chapters/${surahNumber}?language=id`);
        setSurahName(res.data.chapter.name_simple);
      } catch {
        setSurahName("");
      }
    };
    fetchSurahName();
  }, [surahNumber]);

  useEffect(() => {
    setTafsirList([]);
    if (!surahNumber) return;
    fetch(`https://equran.id/api/v2/tafsir/${surahNumber}`)
      .then(res => res.json())
      .then(data => {
        setTafsirList(data.data.tafsir);
      })
      .catch(() => setTafsirList([]));
  }, [surahNumber]);

  const handlePlay = (verseNumber: number) => {
    if (playingAyah === verseNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
    } else {
      function pad(num: number, size: number) {
        let s = String(num);
        while (s.length < size) s = "0" + s;
        return s;
      }
      const surahStr = pad(surahNumber, 3);
      const ayahStr = pad(verseNumber, 3);
      const audioUrl = `https://everyayah.com/data/Alafasy_64kbps/${surahStr}${ayahStr}.mp3`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAyah(verseNumber);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setPlayingAyah(null);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Modifikasi tampilan verses untuk mendukung pagination dengan range
  const displayedVerses = useMemo(() => {
    if (!verses.length) return [];
    const startIndex = (currentPage - 1) * VERSES_PER_PAGE;
    return verses.slice(startIndex, startIndex + VERSES_PER_PAGE);
  }, [verses, currentPage]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 z-50">
      <div className="bg-gradient-to-br from-green-100 via-white to-green-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-100 sm:p-0 p-0">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-50 to-green-100 rounded-t-3xl">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 tracking-wide">
            Surah {surahNumber}{surahName ? ` - ${surahName}` : ''}
            {startAyat && endAyat && startAyat !== endAyat ? ` (Ayat ${startAyat}-${endAyat})` : startAyat ? ` (Ayat ${startAyat})` : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-green-600 p-2 hover:bg-green-50 rounded-full transition-all duration-200"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4 sm:space-y-6">
              {displayedVerses.map((verse) => (
                <div
                  key={verse.ayat}
                  className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-3 sm:p-5 shadow border border-indigo-50 flex flex-col gap-2 sm:gap-3 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 sm:gap-3 mb-1">
                    <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-base sm:text-lg shadow-sm">
                      {verse.ayat}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400">Ayat</span>
                    <button
                      className="ml-2 px-2 py-1 rounded-full border border-indigo-200 bg-white hover:bg-indigo-100 transition text-indigo-600 flex items-center"
                      onClick={() => handlePlay(verse.ayat)}
                    >
                      {playingAyah === verse.ayat ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25l13.5 6.75-13.5 6.75V5.25z" />
                        </svg>
                      )}
                    </button>
                    <button
                      className="ml-1 px-2 py-1 rounded-full border border-indigo-200 bg-white hover:bg-yellow-100 transition text-yellow-600 flex items-center gap-1"
                      onClick={() => {
                        const tafsirAyat = tafsirList.find((t) => t.ayat === verse.ayat);
                        setShowTafsir({
                          ayat: verse.ayat,
                          text: tafsirAyat ? tafsirAyat.teks : 'Tafsir tidak tersedia.'
                        });
                      }}
                      title="Lihat Tafsir"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75C2.25 5.507 3.257 4.5 4.5 4.5h5.25v15H4.5a2.25 2.25 0 01-2.25-2.25V6.75zM21.75 6.75c0-1.243-1.007-2.25-2.25-2.25h-5.25v15h5.25a2.25 2.25 0 002.25-2.25V6.75z" />
                      </svg>
                      <span className="ml-1 font-semibold text-yellow-600 text-xs">Tafsir</span>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl sm:text-3xl md:text-4xl leading-loose font-uthmanic text-gray-800">
                      {verse.teks_arab}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 pt-2 sm:pt-3">
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base italic">
                      {verse.terjemahan ? verse.terjemahan : 'Terjemahan tidak tersedia'}
                    </p>
                  </div>
                </div>
              ))}
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4 gap-2">
                <button
                  className="px-3 py-1 rounded bg-green-200 text-green-800 font-semibold disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Sebelumnya
                </button>
                <span className="text-gray-600 text-sm">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  className="px-3 py-1 rounded bg-green-200 text-green-800 font-semibold disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Berikutnya
                </button>
              </div>
              <audio ref={audioRef} />
            </div>
          )}
        </div>
        {/* Pop up tafsir */}
        {showTafsir && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
              <button
                className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-lg text-2xl p-2 shadow transition-all"
                style={{ minWidth: 40, minHeight: 40 }}
                onClick={() => setShowTafsir(null)}
              >
                ×
              </button>
              <h3 className="text-lg font-bold mb-2 text-indigo-700">
                Tafsir Ayat {showTafsir.ayat}{surahName ? ` - Surah ${surahName}` : ''}
              </h3>
              <div className="text-gray-700 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-line mb-4">
                {showTafsir.text}
              </div>
              <div className="text-xs text-gray-400 italic text-right">Sumber: equran.id (Tafsir Kementerian Agama RI)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
