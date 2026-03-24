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

type MushafSource = 'verse' | 'kemenag' | 'indopak';

interface InteractiveTarget {
  word: string;
  popup_key: string;
  audio_url?: string;
  image_url?: string;
  explanation?: string;
}

interface InteractiveRule {
  surah: number;
  ayat: number;
  mushaf: MushafSource | 'all';
  targets: InteractiveTarget[];
  title?: string;
}

interface WarnaRule {
  surah: number;
  ayat: number;
  green_word: string[] | string;
  red_word: string[] | string;
  /** 1-based index of which match to underline (RTL scan order = dari kanan ke kiri string JS = index awal lebih kecil). Omit = heuristic / all matches. */
  green_occurrence?: number | number[];
  red_occurrence?: number | number[];
}

interface PopupContent {
  title?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
  explanation?: string;
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
  const [mushafFont, setMushafFont] = useState('');
  const [dataSource, setDataSource] = useState<MushafSource>('verse');
  const [fontClass, setFontClass] = useState('font-uthmanic');
  const [interactiveRules, setInteractiveRules] = useState<InteractiveRule[]>([]);
  const [warnaRules, setWarnaRules] = useState<WarnaRule[]>([]);
  const [ruleAyatMap, setRuleAyatMap] = useState<Record<string, PopupContent>>({});
  const [activePopup, setActivePopup] = useState<{ ayat: number; word: string; popupKey: string } | null>(null);
  const [ahkamPopup, setAhkamPopup] = useState<{ ayat: number } | null>(null);
  const popupAudioRef = useRef<HTMLAudioElement | null>(null);
  const [popupPlaying, setPopupPlaying] = useState(false);
  const [popupCurrentTime, setPopupCurrentTime] = useState(0);
  const [popupDuration, setPopupDuration] = useState(0);
  const [popupVolume, setPopupVolume] = useState(1);
  const [showPopupExplanation, setShowPopupExplanation] = useState(false);
  const [showPopupVideo, setShowPopupVideo] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [surahNumber, startAyat, endAyat]);

  // Ganti sumber data & font jika Mushaf Font berubah
  useEffect(() => {
    if (mushafFont === 'Kemenag') {
      setDataSource('kemenag');
      setFontClass('font-nastaleeq');
    } else if (mushafFont === 'Indopak') {
      setDataSource('indopak');
      setFontClass('font-indopak');
    } else {
      setDataSource('verse');
      setFontClass('font-uthmanic');
    }
  }, [mushafFont]);

  useEffect(() => {
    const fetchInteractiveRules = async () => {
      try {
        const res = await fetch('/data/interactive-rules.json');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.rules)) {
          setInteractiveRules(json.rules);
        }
      } catch (e) {
        console.error('Error fetching interactive rules', e);
      }
    };

    fetchInteractiveRules();
  }, []);

  useEffect(() => {
    const fetchRuleAyat = async () => {
      try {
        const res = await fetch('/data/rule-ayat.json');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.rules)) {
          const map: Record<string, PopupContent> = {};
          json.rules.forEach((r: { surah: number; ayat: number } & PopupContent) => {
            const key = `${r.surah}_${r.ayat}`;
            map[key] = {
              title: r.title,
              audio_url: r.audio_url,
              image_url: r.image_url,
              video_url: r.video_url,
              explanation: r.explanation,
            };
          });
          setRuleAyatMap(map);
        }
      } catch (e) {
        console.error('Error fetching rule-ayat', e);
      }
    };
    fetchRuleAyat();
  }, []);

  useEffect(() => {
    const fetchWarnaRules = async () => {
      try {
        const res = await fetch('/data/warna.json', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.rules)) {
          setWarnaRules(json.rules);
        }
      } catch (e) {
        console.error('Error fetching warna rules', e);
      }
    };

    fetchWarnaRules();
  }, []);

  const activePopupRule = useMemo(() => {
    if (!activePopup) return null;
    return interactiveRules.find(
      (r) =>
        r.surah === surahNumber &&
        r.ayat === activePopup.ayat &&
        r.targets?.some(
          (t) =>
            t.popup_key === activePopup.popupKey &&
            (t.word === activePopup.word || t.word.split(/\s+/).includes(activePopup.word))
        )
    ) ?? null;
  }, [activePopup, interactiveRules, surahNumber]);

  const activePopupTarget = useMemo(() => {
    if (!activePopup || !activePopupRule) return null;
    return (
      activePopupRule.targets.find(
        (t) =>
          t.popup_key === activePopup.popupKey &&
          (t.word === activePopup.word || t.word.split(/\s+/).includes(activePopup.word))
      ) ?? null
    );
  }, [activePopup, activePopupRule]);

  const ahkamPopupContent = useMemo(() => {
    if (!ahkamPopup) return null;
    return ruleAyatMap[`${surahNumber}_${ahkamPopup.ayat}`] ?? null;
  }, [ahkamPopup, surahNumber, ruleAyatMap]);

  const explanationContent = useMemo(() => {
    if (activePopup && activePopupTarget) return activePopupTarget;
    if (ahkamPopup) return ahkamPopupContent;
    return null;
  }, [activePopup, ahkamPopup, activePopupTarget, ahkamPopupContent]);

  useEffect(() => {
    if (!activePopup && !ahkamPopup) {
      setPopupPlaying(false);
      setPopupCurrentTime(0);
      setPopupDuration(0);
      setShowPopupExplanation(false);
      setShowPopupVideo(false);
      popupAudioRef.current?.pause();
    }
  }, [activePopup, ahkamPopup]);

  useEffect(() => {
    if (showPopupExplanation && (activePopup || ahkamPopup) && popupAudioRef.current) {
      popupAudioRef.current.play();
    }
  }, [showPopupExplanation, activePopup, ahkamPopup]);

  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const extractYoutubeId = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    // Raw id (11 chars)
    if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const m = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/
    );
    return m?.[1] ?? null;
  };

  const getYoutubeEmbedSrc = (url: string): string | null => {
    const id = extractYoutubeId(url);
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  };

  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      try {
        // Ambil data ayat dari file lokal JSON sesuai dataSource
        let url = '/data/verse.json';
        if (dataSource === 'kemenag') url = '/data/kemenag.json';
        if (dataSource === 'indopak') url = '/data/indopak.json';
        const response = await fetch(url);
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
  }, [surahNumber, currentPage, startAyat, endAyat, dataSource]);

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

  const renderInteractiveArabic = (
    text: string,
    interactiveTargets: InteractiveTarget[] | null,
    warnaRule: WarnaRule | null,
    ayatNumber: number
  ) => {
    const normalizeWords = (input: string[] | string | undefined) => {
      if (!input) return [];
      if (Array.isArray(input)) return input.filter(Boolean);
      return [input].filter(Boolean);
    };

    const greenWords = normalizeWords(warnaRule?.green_word);
    const redWords = normalizeWords(warnaRule?.red_word);
    const underlineWords = [...greenWords, ...redWords];

    if ((!interactiveTargets || !interactiveTargets.length) && !underlineWords.length) {
      return <span>{text}</span>;
    }

    type Range = { start: number; end: number };
    type TargetRange = Range & { target: InteractiveTarget };
    const normalizeArabicChar = (ch: string) => {
      if (/[أإآٱ]/.test(ch)) return 'ا';
      if (ch === 'ى') return 'ي';
      if (ch === 'ؤ') return 'و';
      if (ch === 'ئ') return 'ي';
      if (ch === 'ة') return 'ه';
      return ch;
    };
    const isSkippedArabicMark = (ch: string) =>
      /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/.test(ch);
    const buildNormalizedText = (input: string) => {
      let normalized = '';
      const indexMap: number[] = [];
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (isSkippedArabicMark(ch)) continue;
        normalized += normalizeArabicChar(ch);
        indexMap.push(i);
      }
      return { normalized, indexMap };
    };
    const findRangesFlexible = (baseText: string, word: string): Range[] => {
      const directRanges: Range[] = [];
      let directFrom = 0;
      while (directFrom < baseText.length) {
        const directIdx = baseText.indexOf(word, directFrom);
        if (directIdx === -1) break;
        directRanges.push({ start: directIdx, end: directIdx + word.length });
        directFrom = directIdx + Math.max(1, word.length);
      }
      if (directRanges.length) return directRanges;

      const base = buildNormalizedText(baseText);
      const query = buildNormalizedText(word).normalized;
      if (!query) return [];

      const fallbackRanges: Range[] = [];
      let from = 0;
      while (from < base.normalized.length) {
        const nIdx = base.normalized.indexOf(query, from);
        if (nIdx === -1) break;
        const start = base.indexMap[nIdx];
        const endMapIdx = nIdx + query.length - 1;
        const end = (base.indexMap[endMapIdx] ?? start) + 1;
        fallbackRanges.push({ start, end });
        from = nIdx + Math.max(1, query.length);
      }
      return fallbackRanges;
    };
    const occurrenceForPhrase = (
      occ: number | number[] | undefined,
      phraseIndex: number
    ): number | undefined => {
      if (occ === undefined) return undefined;
      if (Array.isArray(occ)) return occ[phraseIndex];
      return phraseIndex === 0 ? occ : undefined;
    };

    const targetRanges: TargetRange[] = [];
    (interactiveTargets ?? []).forEach((target) => {
      if (!target.word) return;
      const ranges = findRangesFlexible(text, target.word);
      ranges.forEach((r) => targetRanges.push({ start: r.start, end: r.end, target }));
    });

    const redRanges: Range[] = [];
    redWords.forEach((word, i) => {
      const occ = occurrenceForPhrase(warnaRule?.red_occurrence, i);
      if (occ === undefined) {
        redRanges.push(...findRangesFlexible(text, word));
        return;
      }
      const matches = findRangesFlexible(text, word);
      const r = matches[occ - 1];
      if (r) redRanges.push(r);
    });
    const rangeDistance = (a: Range, b: Range) => {
      if (a.end <= b.start) return b.start - a.end;
      if (b.end <= a.start) return a.start - b.end;
      return 0;
    };
    const greenRanges: Range[] = [];
    greenWords.forEach((word, phraseIndex) => {
      const occ = occurrenceForPhrase(warnaRule?.green_occurrence, phraseIndex);
      const matches = findRangesFlexible(text, word);
      if (!matches.length) return;

      if (occ !== undefined) {
        const r = matches[occ - 1];
        if (r) greenRanges.push(r);
        return;
      }

      // Keep as-is for unambiguous cases (single match) or when no red anchor exists.
      if (!redRanges.length || matches.length === 1) {
        greenRanges.push(...matches);
        return;
      }

      // For duplicated green words, prefer match that overlaps red anchor.
      const overlapping = matches.filter((greenRange) =>
        redRanges.some((redRange) => redRange.start < greenRange.end && greenRange.start < redRange.end)
      );
      if (overlapping.length) {
        greenRanges.push(...overlapping);
        return;
      }

      // If no overlap exists, keep the nearest occurrence to red anchor.
      let bestRange = matches[0];
      let bestDistance = Number.POSITIVE_INFINITY;
      matches.forEach((greenRange) => {
        const distanceToClosestRed = redRanges.reduce(
          (min, redRange) => Math.min(min, rangeDistance(greenRange, redRange)),
          Number.POSITIVE_INFINITY
        );
        if (distanceToClosestRed < bestDistance) {
          bestDistance = distanceToClosestRed;
          bestRange = greenRange;
        }
      });
      greenRanges.push(bestRange);
    });
    const breakpoints = new Set<number>([0, text.length]);

    [...targetRanges, ...greenRanges, ...redRanges].forEach((r) => {
      breakpoints.add(r.start);
      breakpoints.add(r.end);
    });

    const sorted = Array.from(breakpoints).sort((a, b) => a - b);
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const start = sorted[i];
      const end = sorted[i + 1];
      if (end <= start) continue;

      const segmentText = text.slice(start, end);
      if (!segmentText) continue;

      const hasGreen = greenRanges.some((r) => start >= r.start && end <= r.end);
      const hasRed = redRanges.some((r) => start >= r.start && end <= r.end);
      const isInOverlappingRedRange = redRanges.some(
        (redRange) =>
          start >= redRange.start &&
          end <= redRange.end &&
          greenRanges.some(
            (greenRange) => redRange.start < greenRange.end && greenRange.start < redRange.end
          )
      );

      const coveredTargets = targetRanges
        .filter((r) => start >= r.start && end <= r.end)
        .sort((a, b) => (b.end - b.start) - (a.end - a.start));
      const target = coveredTargets[0]?.target ?? null;

      // Use inline + baseline (not inline-block) so Arabic glyphs keep normal kerning/joining at span edges.
      const underlineStyle: React.CSSProperties | undefined = hasGreen || hasRed
        ? hasGreen && hasRed
          ? {
              display: 'inline',
              verticalAlign: 'baseline',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              paddingBottom: '7px',
              backgroundImage:
                'linear-gradient(#ef4444, #ef4444), linear-gradient(#22c55e, #22c55e)',
              backgroundRepeat: 'no-repeat, no-repeat',
              backgroundSize: '100% 2px, 100% 2px',
              backgroundPosition: '0 calc(100% - 7px), 0 calc(100% - 1px)',
            }
          : hasGreen
          ? {
              display: 'inline',
              verticalAlign: 'baseline',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              paddingBottom: '7px',
              backgroundImage: 'linear-gradient(#22c55e, #22c55e)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 2px',
              backgroundPosition: '0 calc(100% - 1px)',
            }
          : {
              display: 'inline',
              verticalAlign: 'baseline',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              paddingBottom: '7px',
              backgroundImage: 'linear-gradient(#ef4444, #ef4444)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 2px',
              backgroundPosition: isInOverlappingRedRange
                ? '0 calc(100% - 7px)'
                : '0 calc(100% - 1px)',
            }
        : undefined;

      if (target) {
        elements.push(
          <span
            key={`seg-${start}-${end}`}
            className="relative inline cursor-pointer select-none after:content-[''] after:absolute after:inset-0 after:rounded-sm after:bg-emerald-200/60 after:origin-right after:scale-x-0 after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100"
            style={underlineStyle}
            onClick={() =>
              setActivePopup({
                ayat: ayatNumber,
                word: target.word,
                popupKey: target.popup_key,
              })
            }
          >
            <span className="relative z-10">{segmentText}</span>
          </span>
        );
      } else {
        elements.push(
          <span key={`seg-${start}-${end}`} style={underlineStyle}>
            {segmentText}
          </span>
        );
      }
    }

    return <>{elements}</>;
  };

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
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1">
              <span className="font-semibold text-green-800 text-xs sm:text-sm">Mushaf Font :</span>
              <select
                className="border border-green-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-300 text-xs sm:text-sm text-gray-800 bg-white"
                value={mushafFont}
                onChange={e => setMushafFont(e.target.value)}
              >
                <option value="">Pilih</option>
                <option value="Madina">Madina</option>
                <option value="Kemenag">Kemenag</option>
                <option value="Indopak">Indopak</option>
              </select>
            </label>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-green-600 p-2 hover:bg-green-50 rounded-full transition-all duration-200"
            >
              ✕
            </button>
          </div>
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
              {displayedVerses.map((verse) => {
                // Logic khusus Indopak: pisahkan angka Arab di akhir teks_arab
                let arabicText = verse.teks_arab;
                let ayahNumberMark = '';
                let ayahNumberSymbol = '';
                let ayahNumberCircle = '';
                if (mushafFont === 'Indopak') {
                  // Regex: cari satu atau lebih karakter non-huruf Arab di akhir string
                  const match = arabicText.match(/^(.*?)([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]*)([^\u0621-\u064A\u0660-\u0669\u0670-\u06D3\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)$/);
                  if (match) {
                    arabicText = match[1] + match[2];
                    ayahNumberMark = match[3];
                    // Pisahkan simbol di atas bulatan dan angka bulatan
                    // Asumsi: simbol (misal: 'ؔ', 'ۚ', dsb) di awal, angka bulatan (misal: '\uFD3E'-'\uFD3F', '\uFDFD', dsb) di akhir
                    const symbolMatch = ayahNumberMark.match(/^([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+)?([\uFDFD-\uFDFE\uFD3E-\uFD3F\u06DD\u06DE\u06E9\u06E0-\u06ED\u06F0-\u06F9\u0660-\u0669\u06DF-\u06E8\u06E2-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u06F0-\u06F9\u06DD\u06DE\u06E9\u06E0-\u06ED\u06F0-\u06F9\u0660-\u0669\uFD3E-\uFD3F]+)$/);
                    if (symbolMatch) {
                      ayahNumberSymbol = symbolMatch[1] || '';
                      ayahNumberCircle = symbolMatch[2] || ayahNumberMark;
                    } else {
                      ayahNumberCircle = ayahNumberMark;
                    }
                  } else {
                    // fallback: cari satu atau lebih karakter non-huruf Arab/angka di akhir
                    const fallback = arabicText.match(/^(.*?)([^\u0621-\u064A\u0660-\u0669]+)$/);
                    if (fallback) {
                      arabicText = fallback[1];
                      ayahNumberMark = fallback[2];
                      ayahNumberCircle = ayahNumberMark;
                    }
                  }
                }
                const mushafKey: MushafSource =
                  mushafFont === 'Kemenag'
                    ? 'kemenag'
                    : mushafFont === 'Indopak'
                    ? 'indopak'
                    : 'verse';

                const matchedInteractive = interactiveRules.filter((rule) => {
                  if (rule.surah !== surahNumber || rule.ayat !== verse.ayat) {
                    return false;
                  }
                  if (rule.mushaf === 'all') return true;
                  return rule.mushaf === mushafKey;
                });

                const interactiveTargets: InteractiveTarget[] =
                  matchedInteractive.length > 0
                    ? matchedInteractive.flatMap((r) => r.targets)
                    : [];
                const matchedWarnaRule =
                  warnaRules.find((rule) => rule.surah === surahNumber && rule.ayat === verse.ayat) ?? null;

                return (
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
                    <button
                      className="ml-1 px-2 py-1 rounded-full border border-indigo-200 bg-white hover:bg-emerald-100 transition text-emerald-600 flex items-center gap-1"
                      onClick={() => setAhkamPopup({ ayat: verse.ayat })}
                      title="Ahkam Tajwid"
                    >
                      <span className="font-semibold text-emerald-600 text-xs">Ahkam Tajwid</span>
                    </button>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl sm:text-3xl md:text-4xl leading-loose text-gray-800 ${fontClass}`} style={{ direction: 'rtl', position: 'relative' }}>
                      {mushafFont === 'Indopak' ? (
                        <>
                          <span>
                            {interactiveTargets.length || matchedWarnaRule
                              ? renderInteractiveArabic(arabicText, interactiveTargets, matchedWarnaRule, verse.ayat)
                              : arabicText}
                          </span>
                          <span
                            className="inline-flex flex-col items-center align-middle ml-2"
                            style={{ verticalAlign: 'middle' }}
                          >
                            {ayahNumberSymbol && (
                              <span style={{ fontSize: '0.7em', lineHeight: 1 }}>{ayahNumberSymbol}</span>
                            )}
                            <span>{ayahNumberCircle}</span>
                          </span>
                        </>
                      ) : (
                        <span>
                          {interactiveTargets.length || matchedWarnaRule
                            ? renderInteractiveArabic(verse.teks_arab, interactiveTargets, matchedWarnaRule, verse.ayat)
                            : verse.teks_arab}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2 sm:pt-3">
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base italic">
                      {verse.terjemahan ? verse.terjemahan : 'Terjemahan tidak tersedia'}
                    </p>
                  </div>
                </div>
              );
              })}
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
        {/* Pop up Ahkam Tajwid (data dari rule-ayat.json) */}
        {ahkamPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500 rounded-lg text-2xl p-1 transition-colors"
                onClick={() => {
                  setAhkamPopup(null);
                  setShowPopupExplanation(false);
                  setShowPopupVideo(false);
                  if (popupAudioRef.current) popupAudioRef.current.pause();
                  setPopupPlaying(false);
                  setPopupCurrentTime(0);
                }}
              >
                ×
              </button>
              <h3 className="text-lg font-bold mb-2 text-emerald-700">
                {ahkamPopupContent?.title || 'Title belum diisi di rule-ayat.json'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Surah {surahNumber}, Ayat {ahkamPopup.ayat}
              </p>
              {ahkamPopupContent ? (
                <>
                  <div className="mb-4 flex justify-center">
                    {ahkamPopupContent.audio_url ? (
                      <>
                        <audio
                          ref={popupAudioRef}
                          src={ahkamPopupContent.audio_url}
                          onTimeUpdate={() => setPopupCurrentTime(popupAudioRef.current?.currentTime ?? 0)}
                          onLoadedMetadata={() => {
                            const el = popupAudioRef.current;
                            if (el) {
                              setPopupDuration(el.duration);
                              el.volume = popupVolume;
                            }
                          }}
                          onEnded={() => setPopupPlaying(false)}
                          onPlay={() => setPopupPlaying(true)}
                          onPause={() => setPopupPlaying(false)}
                          style={{ display: 'none' }}
                        />
                        <div className="w-full max-w-xs flex flex-col gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const el = popupAudioRef.current;
                                if (!el) return;
                                if (popupPlaying) el.pause();
                                else el.play();
                              }}
                              className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-colors"
                              aria-label={popupPlaying ? 'Jeda' : 'Putar'}
                            >
                              {popupPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            <span className="text-sm font-medium text-emerald-800 tabular-nums">
                              {formatTime(popupCurrentTime)} / {formatTime(popupDuration)}
                            </span>
                          </div>
                          <div
                            className="h-2 rounded-full bg-emerald-200 overflow-hidden cursor-pointer"
                            onClick={(e) => {
                              const el = popupAudioRef.current;
                              if (!el || !popupDuration) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const pct = Math.max(0, Math.min(1, x / rect.width));
                              el.currentTime = pct * popupDuration;
                            }}
                            role="progressbar"
                            aria-valuenow={popupDuration ? (popupCurrentTime / popupDuration) * 100 : 0}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-emerald-600 transition-all duration-150"
                              style={{ width: popupDuration ? `${(popupCurrentTime / popupDuration) * 100}%` : '0%' }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-700 flex-shrink-0" aria-hidden>
                              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                            </svg>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={popupVolume}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setPopupVolume(v);
                                if (popupAudioRef.current) popupAudioRef.current.volume = v;
                              }}
                              className="w-full h-1.5 rounded-full appearance-none bg-emerald-200 accent-emerald-600 cursor-pointer"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Audio belum diisi di <code className="bg-amber-100 px-1 rounded">rule-ayat.json</code>.
                      </div>
                    )}
                  </div>
                  <div className="mb-4 flex justify-center">
                    <div className="flex gap-2 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPopupVideo(false);
                          setShowPopupExplanation(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md transition-colors"
                      >
                        Penjelasan Audio
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPopupExplanation(false);
                          setShowPopupVideo(true);
                          if (popupAudioRef.current) popupAudioRef.current.pause();
                          setPopupPlaying(false);
                        }}
                        disabled={!ahkamPopupContent?.video_url}
                        className={`px-4 py-2 rounded-xl font-medium shadow-md transition-colors ${
                          ahkamPopupContent?.video_url
                            ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                        title={
                          ahkamPopupContent?.video_url
                            ? 'Buka video YouTube'
                            : 'Belum ada video_url di rule-ayat.json untuk ayat ini'
                        }
                      >
                        Penjelasan Video
                      </button>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                    <div className="font-semibold mb-1">Penjelasan</div>
                    <div className="text-emerald-800 leading-relaxed">
                      {ahkamPopupContent.explanation || (
                        <span className="text-emerald-700 text-xs">
                          Penjelasan belum diisi di rule-ayat.json untuk ayat ini.
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-amber-800 font-medium">Popup data belum diinput.</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Tambahkan Surah {surahNumber}, Ayat {ahkamPopup.ayat} di <code className="bg-amber-100 px-1 rounded">rule-ayat.json</code>.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Pop up interaktif sederhana */}
        {activePopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500 rounded-lg text-2xl p-1 transition-colors"
                onClick={() => setActivePopup(null)}
              >
                ×
              </button>
              <h3 className="text-lg font-bold mb-2 text-emerald-700">
                {activePopupRule?.title || activePopupTarget?.popup_key || 'Bedah Hukum'}
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Surah {surahNumber}, Ayat {activePopup.ayat}
              </p>
              <p className="text-2xl mb-4 text-right font-uthmanic text-gray-800">
                {activePopup.word}
              </p>
              <div className="mb-4 flex justify-center">
                <audio
                  ref={popupAudioRef}
                  src={
                    activePopupTarget?.audio_url ||
                    `https://everyayah.com/data/Alafasy_64kbps/${String(surahNumber).padStart(3, '0')}${String(activePopup.ayat).padStart(3, '0')}.mp3`
                  }
                  onTimeUpdate={() => setPopupCurrentTime(popupAudioRef.current?.currentTime ?? 0)}
                  onLoadedMetadata={() => {
                    const el = popupAudioRef.current;
                    if (el) {
                      setPopupDuration(el.duration);
                      el.volume = popupVolume;
                    }
                  }}
                  onEnded={() => setPopupPlaying(false)}
                  onPlay={() => setPopupPlaying(true)}
                  onPause={() => setPopupPlaying(false)}
                  style={{ display: 'none' }}
                />
                <div className="w-full max-w-xs flex flex-col gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const el = popupAudioRef.current;
                        if (!el) return;
                        if (popupPlaying) el.pause();
                        else el.play();
                      }}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-md transition-colors"
                      aria-label={popupPlaying ? 'Jeda' : 'Putar'}
                    >
                      {popupPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span className="text-sm font-medium text-emerald-800 tabular-nums">
                      {formatTime(popupCurrentTime)} / {formatTime(popupDuration)}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full bg-emerald-200 overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const el = popupAudioRef.current;
                      if (!el || !popupDuration) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, x / rect.width));
                      el.currentTime = pct * popupDuration;
                    }}
                    role="progressbar"
                    aria-valuenow={popupDuration ? (popupCurrentTime / popupDuration) * 100 : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-150"
                      style={{ width: popupDuration ? `${(popupCurrentTime / popupDuration) * 100}%` : '0%' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-700 flex-shrink-0" aria-hidden>
                      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                    </svg>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={popupVolume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setPopupVolume(v);
                        if (popupAudioRef.current) popupAudioRef.current.volume = v;
                      }}
                      className="w-full h-1.5 rounded-full appearance-none bg-emerald-200 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowPopupExplanation(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md transition-colors"
                >
                  Penjelasan Audio
                </button>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                <div className="font-semibold mb-1">{activePopupTarget?.popup_key || activePopup.popupKey}</div>
                <div className="text-emerald-800 leading-relaxed">
                  {activePopupTarget?.explanation || (
                    <span className="text-emerald-700 text-xs">
                      Isi field &quot;explanation&quot; di target kata ini di interactive-rules.json.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Gambar penjelasan full screen */}
        {showPopupExplanation && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <button
              type="button"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center text-2xl shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopupExplanation(false);
                setShowPopupVideo(false);
                if (popupAudioRef.current) {
                  popupAudioRef.current.pause();
                  try {
                    popupAudioRef.current.currentTime = 0;
                  } catch {
                    // ignore
                  }
                }
                setPopupPlaying(false);
                setPopupCurrentTime(0);
              }}
              aria-label="Tutup"
            >
              ×
            </button>
            {ahkamPopup && !ahkamPopupContent?.image_url ? (
              <div
                className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-800"
                onClick={(e) => e.stopPropagation()}
              >
                Image belum diisi di <code className="bg-amber-100 px-1 rounded">rule-ayat.json</code>.
              </div>
            ) : (
              <img
                src={
                  explanationContent?.image_url ||
                  'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyMzNybzYzemd4c3Z6MDd3OWl3cjIzenQ1MWJ0ZGh2Ym1pNTlvcHdjNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/NxC8VtyxqhMtpLoEEN/200w.gif'
                }
                alt="Penjelasan"
                className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}

        {/* Pop up video penjelasan (YouTube) */}
        {showPopupVideo && ahkamPopupContent?.video_url && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[61] p-4">
            <button
              type="button"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center text-2xl shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopupVideo(false);
              }}
              aria-label="Tutup video"
            >
              ×
            </button>
            <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <iframe
                  title="Penjelasan Video"
                  src={
                    getYoutubeEmbedSrc(ahkamPopupContent.video_url) ||
                    ahkamPopupContent.video_url
                  }
                  className="absolute inset-0 w-full h-full rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="mt-3 text-center text-sm text-slate-200">
                Penjelasan video (YouTube)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
