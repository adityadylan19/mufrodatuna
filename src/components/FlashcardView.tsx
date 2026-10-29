import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MufradatItem, UserStats } from '../types';
import { speakArabic } from '../services/speech';
import {
  Volume2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Heart,
  CheckCircle,
  Search,
  Sparkles,
  LayoutGrid,
  Maximize2,
  SlidersHorizontal,
  Bookmark,
} from 'lucide-react';

interface FlashcardViewProps {
  items: MufradatItem[];
  stats: UserStats;
  userId: string;
  speechRate: number;
  onToggleBookmark: (id: string) => void;
  onMarkCompleted: (id: string) => void;
  onAskTutorWithWord: (word: string) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  items,
  stats,
  speechRate,
  onToggleBookmark,
  onMarkCompleted,
  onAskTutorWithWord,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ['Semua', ...Array.from(set)];
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (onlyBookmarks && !stats.bookmarkedCards.includes(item.id)) {
        return false;
      }
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchIndo = item.indonesian.toLowerCase().includes(q);
        const matchLatin = item.latin.toLowerCase().includes(q);
        const matchArabic = item.arabic.includes(q) || item.arabicRaw.includes(q);
        return matchIndo || matchLatin || matchArabic;
      }
      return true;
    });
  }, [items, selectedCategory, searchQuery, onlyBookmarks, stats.bookmarkedCards]);

  // Ensure current index stays in bounds
  useEffect(() => {
    if (currentIndex >= filteredItems.length) {
      setCurrentIndex(Math.max(0, filteredItems.length - 1));
    }
    setIsFlipped(false);
  }, [filteredItems.length]);

  const currentCard = filteredItems[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  }, [filteredItems.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  }, [filteredItems.length]);

  // Auto-play interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoPlay && filteredItems.length > 0) {
      timer = setInterval(() => {
        handleNext();
      }, 4500);
    }
    return () => clearInterval(timer);
  }, [autoPlay, filteredItems.length, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'single') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handleNext, handlePrev]);

  // Play audio
  const handlePlayAudio = async (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSpeaking(true);
    await speakArabic(text, speechRate);
    setIsSpeaking(false);
  };

  const handleShuffle = () => {
    if (filteredItems.length > 1) {
      setIsFlipped(false);
      const randomIndex = Math.floor(Math.random() * filteredItems.length);
      setCurrentIndex(randomIndex);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata: buku, kitaabun, كِتَابٌ..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Controls: View mode, Bookmarks, and Count */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setOnlyBookmarks(!onlyBookmarks)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                onlyBookmarks
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyBookmarks ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>Favorit ({stats.bookmarkedCards.length})</span>
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('single')}
                className={`p-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'single' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                }`}
                title="Mode Kartu Fokus"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                }`}
                title="Mode Galeri Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              {filteredItems.length} Kosakata
            </div>
          </div>
        </div>

        {/* Categories scrollable pill row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all duration-150 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800">Tidak ada mufradat yang cocok</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau pilih kategori lain di atas.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Semua');
              setSearchQuery('');
              setOnlyBookmarks(false);
            }}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'single' ? (
        /* ================= SINGLE CARD FLASHCARD DECK ================= */
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Deck Status Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">
                Kartu {currentIndex + 1} dari {filteredItems.length}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {currentCard.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                title="Acak Urutan Kartu"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Acak</span>
              </button>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`flex items-center gap-1 font-medium px-2 py-1 rounded-lg transition ${
                  autoPlay ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Putar Otomatis per 4.5 detik"
              >
                <RotateCw className={`w-3.5 h-3.5 ${autoPlay ? 'animate-spin' : ''}`} />
                <span>{autoPlay ? 'Otomatis: Nyala' : 'Otomatis'}</span>
              </button>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            className="perspective-1000 w-full min-h-[460px] sm:min-h-[500px] cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`relative w-full h-full min-h-[460px] sm:min-h-[500px] transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* ================= CARD FRONT ================= */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl shadow-emerald-950/5 flex flex-col justify-between overflow-hidden">
                {/* Decorative background Islamic geometry watermark */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-50/50 rounded-full blur-2xl pointer-events-none" />

                {/* Top Card Bar */}
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
                    {currentCard.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Mark Mastered / Hafal */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkCompleted(currentCard.id);
                      }}
                      className={`p-2 rounded-xl transition ${
                        stats.completedCards.includes(currentCard.id)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400 hover:text-emerald-600'
                      }`}
                      title={stats.completedCards.includes(currentCard.id) ? 'Sudah Dihafal' : 'Tandai Sudah Hafal (+10 XP)'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    {/* Bookmark Favorite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(currentCard.id);
                      }}
                      className={`p-2 rounded-xl transition ${
                        stats.bookmarkedCards.includes(currentCard.id)
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-slate-100 text-slate-400 hover:text-rose-500'
                      }`}
                      title="Simpan ke Favorit"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          stats.bookmarkedCards.includes(currentCard.id) ? 'fill-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Card Center: Visual Image + Arabic Typography */}
                <div className="my-auto py-2 text-center space-y-4 relative z-10">
                  {/* Photo with rounded framing */}
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-3xl overflow-hidden shadow-md ring-4 ring-emerald-500/10">
                    <img
                      src={currentCard.imageUrl}
                      alt={currentCard.indonesian}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>

                  {/* Arabic Word (with Harakat) */}
                  <div className="space-y-1">
                    <h2 className="font-arabic text-4xl sm:text-5xl font-bold text-emerald-950 tracking-normal drop-shadow-xs py-1">
                      {currentCard.arabic}
                    </h2>
                    <p className="text-base sm:text-lg font-bold text-emerald-700 tracking-wide">
                      {currentCard.latin}
                    </p>
                  </div>

                  {/* Audio Button */}
                  <div>
                    <button
                      onClick={(e) => handlePlayAudio(currentCard.arabic, e)}
                      disabled={isSpeaking}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
                      <span>Dengarkan Suara</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 relative z-10">
                  <span>Tingkat: {currentCard.difficulty}</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Balik kartu untuk arti</span>
                  </span>
                </div>
              </div>

              {/* ================= CARD BACK ================= */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl flex flex-col justify-between overflow-hidden">
                {/* Background ambient light */}
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Back Top Bar */}
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-3 py-1 rounded-full">
                    Arti & Contoh Kalimat
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(false);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 text-xs font-semibold flex items-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                </div>

                {/* Back Center Content */}
                <div className="my-auto py-2 space-y-5 text-center relative z-10">
                  <div>
                    <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider block">
                      Terjemahan Indonesia
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                      {currentCard.indonesian}
                    </h3>
                  </div>

                  {/* Example Sentence Box */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-300 uppercase">
                        Contoh Kalimat (جُمْلَةٌ مُفِيدَةٌ)
                      </span>
                      <button
                        onClick={(e) => handlePlayAudio(currentCard.exampleSentenceArabic, e)}
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition"
                        title="Dengarkan Contoh Kalimat"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="font-arabic text-xl sm:text-2xl font-bold text-emerald-200 text-right leading-relaxed">
                      {currentCard.exampleSentenceArabic}
                    </p>
                    <p className="text-xs text-emerald-100/90 font-medium italic">
                      "{currentCard.exampleSentenceLatin}"
                    </p>
                    <p className="text-xs text-slate-300">
                      Artinya: <span className="text-white font-medium">{currentCard.exampleSentenceIndo}</span>
                    </p>
                  </div>

                  {currentCard.funFact && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/20 text-left text-xs text-amber-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-amber-300">Fakta Mufradat:</span>
                        <p className="text-[11px] text-amber-100/90 leading-relaxed">
                          {currentCard.funFact}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Back Bottom Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between relative z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskTutorWithWord(currentCard.indonesian + ' (' + currentCard.arabic + ')');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 text-xs font-semibold transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tanya Ustadz AI</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkCompleted(currentCard.id);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      stats.completedCards.includes(currentCard.id)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-600/60 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{stats.completedCards.includes(currentCard.id) ? 'Sudah Dihafal' : 'Hafal (+10 XP)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Deck Controls (Prev / Next) */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handlePrev}
              className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <ChevronLeft className="w-5 h-5 text-emerald-700" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="py-3 px-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <RotateCw className="w-4 h-4 text-emerald-700" />
              <span>Balik</span>
            </button>

            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-5 h-5 text-emerald-200" />
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Tip: Gunakan tombol panah kiri / kanan pada keyboard untuk beralih kartu, dan tombol spasi untuk membalik kartu.
          </p>
        </div>
      ) : (
        /* ================= GRID GALLERY VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isCompleted = stats.completedCards.includes(item.id);
            const isBookmarked = stats.bookmarkedCards.includes(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.indonesian}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold text-emerald-900 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs">
                        {item.category}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => onToggleBookmark(item.id)}
                        className={`p-1.5 rounded-lg backdrop-blur-xs transition ${
                          isBookmarked
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-white/80 text-slate-600 hover:text-rose-500'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-arabic text-2xl font-bold text-emerald-950">
                        {item.arabic}
                      </h4>
                      <button
                        onClick={() => handlePlayAudio(item.arabic)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        title="Dengarkan Pelafalan"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-emerald-700">{item.latin}</p>
                    <p className="text-sm font-bold text-slate-800">{item.indonesian}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onMarkCompleted(item.id)}
                    className={`flex items-center gap-1 font-semibold ${
                      isCompleted ? 'text-emerald-700' : 'text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'Sudah Hafal' : 'Tandai Hafal'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const idx = filteredItems.findIndex((it) => it.id === item.id);
                      if (idx !== -1) {
                        setCurrentIndex(idx);
                        setViewMode('single');
                        setIsFlipped(true);
                      }
                    }}
                    className="text-emerald-700 hover:underline font-bold text-[11px]"
                  >
                    Lihat Contoh →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
