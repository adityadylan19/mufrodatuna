import React, { useState, useEffect } from 'react';
import { MufradatItem, QuizMode, QuizQuestion, TestResult, UserStats } from '../types';
import { speakArabic } from '../services/speech';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowRight,
  Flame,
  Check,
} from 'lucide-react';

interface QuizViewProps {
  items: MufradatItem[];
  stats: UserStats;
  userId: string;
  speechRate: number;
  onSaveTestResult: (result: TestResult) => void;
  onAskTutorWithWord: (word: string) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  items,
  stats,
  speechRate,
  onSaveTestResult,
  onAskTutorWithWord,
}) => {
  // Quiz configuration state
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedMode, setSelectedMode] = useState<QuizMode>('tebak-gambar');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active quiz state
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<
    { questionId: string; prompt: string; selected: string; correct: string; isCorrect: boolean }[]
  >([]);
  const [score, setScore] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  // Scrambled letters builder state (for 'susun-huruf' mode)
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<{ id: string; letter: string }[]>([]);

  // Categories list
  const categories = ['Semua', ...Array.from(new Set(items.map((i) => i.category)))];

  // Helper to shuffle an array
  const shuffle = <T,>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  // Generate quiz questions
  const startQuiz = () => {
    let pool = items;
    if (selectedCategory !== 'Semua') {
      pool = items.filter((i) => i.category === selectedCategory);
    }

    if (pool.length < 4) {
      pool = items; // Fallback to all items if category has too few
    }

    const shuffledItems = shuffle(pool).slice(0, questionCount);

    const generatedQuestions: QuizQuestion[] = shuffledItems.map((item, idx) => {
      // Pick 3 random distractors
      const otherItems = items.filter((i) => i.id !== item.id);
      const distractors = shuffle(otherItems).slice(0, 3);

      if (selectedMode === 'tebak-gambar') {
        const options = shuffle([item.arabic, ...distractors.map((d) => d.arabic)]);
        return {
          id: `q_${idx}_${item.id}`,
          type: 'tebak-gambar',
          mufradatId: item.id,
          prompt: 'Tebak kosakata bahasa Arab yang sesuai dengan gambar di bawah:',
          imageUrl: item.imageUrl,
          options,
          correctAnswer: item.arabic,
          explanation: `Gambar ini adalah "${item.indonesian}" (${item.latin}), bahasa Arabnya: ${item.arabic}.`,
        };
      } else if (selectedMode === 'dengar-tebak') {
        const options = shuffle([item.indonesian, ...distractors.map((d) => d.indonesian)]);
        return {
          id: `q_${idx}_${item.id}`,
          type: 'dengar-tebak',
          mufradatId: item.id,
          prompt: 'Dengarkan lafal bahasa Arab berikut, lalu pilih arti bahasa Indonesia yang tepat:',
          audioText: item.arabic,
          arabicSnippet: item.arabic,
          options,
          correctAnswer: item.indonesian,
          explanation: `Lafal "${item.arabic}" (${item.latin}) memiliki arti "${item.indonesian}".`,
        };
      } else if (selectedMode === 'susun-huruf') {
        // Scramble letters of Arabic word without harakat
        const cleanLetters = item.arabicRaw.split('').filter((c) => c.trim().length > 0);
        return {
          id: `q_${idx}_${item.id}`,
          type: 'susun-huruf',
          mufradatId: item.id,
          prompt: `Susun huruf-huruf Arab berikut sehingga membentuk kata yang artinya "${item.indonesian}":`,
          imageUrl: item.imageUrl,
          options: [],
          correctAnswer: item.arabicRaw,
          explanation: `Kata untuk "${item.indonesian}" adalah ${item.arabic} (${item.latin}).`,
          scrambledLetters: shuffle(cleanLetters),
        };
      } else {
        // Pilihan Ganda (campuran Indo -> Arab atau Arab -> Indo)
        const isIndoToArab = idx % 2 === 0;
        if (isIndoToArab) {
          const options = shuffle([item.arabic, ...distractors.map((d) => d.arabic)]);
          return {
            id: `q_${idx}_${item.id}`,
            type: 'pilihan-ganda',
            mufradatId: item.id,
            prompt: `Apakah bahasa Arab dari kata "${item.indonesian}"?`,
            options,
            correctAnswer: item.arabic,
            explanation: `Bahasa Arab dari "${item.indonesian}" adalah ${item.arabic} (${item.latin}).`,
          };
        } else {
          const options = shuffle([item.indonesian, ...distractors.map((d) => d.indonesian)]);
          return {
            id: `q_${idx}_${item.id}`,
            type: 'pilihan-ganda',
            mufradatId: item.id,
            prompt: `Apakah arti dari kata bahasa Arab "${item.arabic}" (${item.latin})?`,
            arabicSnippet: item.arabic,
            options,
            correctAnswer: item.indonesian,
            explanation: `Kata "${item.arabic}" (${item.latin}) artinya adalah "${item.indonesian}".`,
          };
        }
      }
    });

    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setUserAnswers([]);
    setScore(0);
    setIsQuizCompleted(false);
    setIsQuizActive(true);

    // If first question is dengar-tebak, auto play audio
    if (generatedQuestions[0]?.type === 'dengar-tebak' && generatedQuestions[0]?.audioText) {
      setTimeout(() => {
        speakArabic(generatedQuestions[0].audioText!, speechRate);
      }, 400);
    }

    // If mode is susun-huruf, initialize letter tiles
    if (generatedQuestions[0]?.type === 'susun-huruf' && generatedQuestions[0]?.scrambledLetters) {
      setAvailableLetters(
        generatedQuestions[0].scrambledLetters.map((letter, i) => ({
          id: `letter_${i}_${letter}`,
          letter,
        }))
      );
      setSelectedLetters([]);
    }
  };

  const currentQ = questions[currentQuestionIndex];

  // Auto-play audio when moving to next dengar-tebak question
  useEffect(() => {
    if (isQuizActive && currentQ?.type === 'dengar-tebak' && currentQ?.audioText) {
      speakArabic(currentQ.audioText, speechRate);
    }
    if (isQuizActive && currentQ?.type === 'susun-huruf' && currentQ?.scrambledLetters) {
      setAvailableLetters(
        currentQ.scrambledLetters.map((letter, i) => ({
          id: `letter_${i}_${letter}`,
          letter,
        }))
      );
      setSelectedLetters([]);
    }
  }, [currentQuestionIndex, isQuizActive, currentQ, speechRate]);

  // Handle letter tile click for susun-huruf
  const handleSelectLetter = (item: { id: string; letter: string }) => {
    if (isAnswerSubmitted) return;
    setAvailableLetters((prev) => prev.filter((l) => l.id !== item.id));
    setSelectedLetters((prev) => [...prev, item.letter]);
  };

  const handleRemoveLetter = (index: number) => {
    if (isAnswerSubmitted) return;
    const removedLetter = selectedLetters[index];
    setSelectedLetters((prev) => prev.filter((_, idx) => idx !== index));
    setAvailableLetters((prev) => [
      ...prev,
      { id: `letter_${Date.now()}_${removedLetter}`, letter: removedLetter },
    ]);
  };

  // Submit current answer
  const handleSubmitAnswer = () => {
    if (isAnswerSubmitted) return;

    let ans = selectedAnswer;
    if (currentQ.type === 'susun-huruf') {
      ans = selectedLetters.join('');
    }

    if (!ans) return;

    const isCorrect = ans.trim() === currentQ.correctAnswer.trim();
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        prompt: currentQ.prompt,
        selected: ans || '',
        correct: currentQ.correctAnswer,
        isCorrect,
      },
    ]);

    setIsAnswerSubmitted(true);
  };

  // Move to next question or complete quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setSelectedLetters([]);
    } else {
      // Quiz Finished!
      const totalScore = score + (selectedAnswer === currentQ.correctAnswer ? 1 : 0);
      const total = questions.length;
      const percentage = Math.round((totalScore / total) * 100);
      const xpEarned = totalScore * 20 + 25; // Base XP bonus

      const testResult: TestResult = {
        id: 'test_' + Date.now(),
        timestamp: new Date().toISOString(),
        mode: selectedMode,
        category: selectedCategory,
        score: totalScore,
        total,
        percentage,
        xpEarned,
        answers: userAnswers,
      };

      onSaveTestResult(testResult);
      setIsQuizCompleted(true);

      // Trigger Confetti if score >= 70%
      if (percentage >= 70) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {!isQuizActive ? (
        /* ================= QUIZ SETUP & LOBBY ================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Award className="w-7 h-7 text-emerald-700" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
              Kuis & Uji Pemahaman Mufradat
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Uji daya ingat dan pemahaman kosakata Anda melalui beragam mode latihan interaktif berpoin XP.
            </p>
          </div>

          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Pilih Mode Ujian:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'tebak-gambar' as QuizMode,
                  title: '🖼️ Tebak Gambar',
                  desc: 'Lihat gambar lalu pilih kosakata Arab yang cocok',
                },
                {
                  id: 'pilihan-ganda' as QuizMode,
                  title: '📝 Pilihan Ganda',
                  desc: 'Terjemah bahasa Arab ke Indonesia & sebaliknya',
                },
                {
                  id: 'dengar-tebak' as QuizMode,
                  title: '🎧 Dengar & Tebak',
                  desc: 'Dengar pelafalan audio lalu tebak artinya',
                },
                {
                  id: 'susun-huruf' as QuizMode,
                  title: '🧩 Susun Huruf',
                  desc: 'Rangkai huruf hijaiyah acak menjadi kata utuh',
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer ${
                    selectedMode === mode.id
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">{mode.title}</span>
                    {selectedMode === mode.id && (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{mode.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Category & Question Count Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                2. Kategori Kosakata:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'Semua' ? '✨ Semua Kategori (Campuran)' : c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                3. Jumlah Soal:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      questionCount === count
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {count} Soal
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-2 text-center">
            <button
              onClick={startQuiz}
              className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-base shadow-lg shadow-emerald-700/20 active:scale-98 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Mulai Ujian Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Recent Test History */}
          {stats.testHistory && stats.testHistory.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-600 uppercase mb-3">
                Riwayat Ujian Terakhir:
              </h4>
              <div className="space-y-2">
                {stats.testHistory.slice(0, 3).map((hist) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-800 capitalize">
                          {hist.mode.replace('-', ' ')} • {hist.category}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(hist.timestamp).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-700">
                        {hist.score}/{hist.total} ({hist.percentage}%)
                      </span>
                      <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        +{hist.xpEarned} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : isQuizCompleted ? (
        /* ================= QUIZ RESULT SUMMARY ================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8 text-emerald-700" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Hasil Ujian Selesai
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              Nilai Anda: {Math.round((score / questions.length) * 100)}%
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Benar <span className="font-bold text-emerald-600">{score}</span> dari total{' '}
              <span className="font-bold text-slate-700">{questions.length}</span> soal
            </p>
          </div>

          {/* Reward badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm shadow-xs">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>+{score * 20 + 25} XP Diperoleh!</span>
          </div>

          {/* Breakdown of questions */}
          <div className="text-left space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase">
              Pembahasan Soal:
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {userAnswers.map((rec, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl border text-xs ${
                    rec.isCorrect
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/60 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="font-bold block text-slate-800">
                        {i + 1}. {rec.prompt}
                      </span>
                      <p className="text-slate-600">
                        Jawaban Anda: <strong className={rec.isCorrect ? 'text-emerald-700 font-arabic' : 'text-rose-700 font-arabic'}>{rec.selected}</strong>
                      </p>
                      {!rec.isCorrect && (
                        <p className="text-emerald-800 font-semibold">
                          Jawaban Benar: <strong className="font-arabic">{rec.correct}</strong>
                        </p>
                      )}
                    </div>
                    {rec.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setIsQuizActive(false)}
              className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
            >
              Menu Ujian
            </button>
            <button
              onClick={startQuiz}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Ujian</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= ACTIVE QUIZ SCREEN ================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Soal {currentQuestionIndex + 1} dari {questions.length}
            </span>

            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-600">Skor: {score}</span>
              <button
                onClick={() => setIsQuizActive(false)}
                className="text-slate-400 hover:text-rose-600 text-xs underline"
              >
                Batalkan
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Prompt */}
          <div className="text-center space-y-4 py-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ.prompt}
            </h3>

            {/* Optional Image (Tebak Gambar) */}
            {currentQ.imageUrl && (
              <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden shadow-md ring-4 ring-emerald-500/10">
                <img
                  src={currentQ.imageUrl}
                  alt="Mufradat"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Optional Audio (Dengar & Tebak) */}
            {currentQ.type === 'dengar-tebak' && currentQ.audioText && (
              <div className="py-2">
                <button
                  onClick={() => speakArabic(currentQ.audioText!, speechRate)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>Dengarkan Ulang Suara</span>
                </button>
              </div>
            )}

            {/* Optional Arabic Snippet */}
            {currentQ.arabicSnippet && currentQ.type !== 'dengar-tebak' && (
              <div className="py-2">
                <span className="font-arabic text-4xl sm:text-5xl font-bold text-emerald-950 block">
                  {currentQ.arabicSnippet}
                </span>
              </div>
            )}
          </div>

          {/* Options / Answer Input */}
          {currentQ.type === 'susun-huruf' ? (
            /* Susun Huruf / Scrambled Letters interactive builder */
            <div className="space-y-6">
              {/* Drop / Selected Letters area */}
              <div className="min-h-16 p-4 rounded-2xl bg-emerald-50/80 border-2 border-dashed border-emerald-300 flex items-center justify-center gap-2 flex-wrap font-arabic">
                {selectedLetters.length === 0 ? (
                  <span className="text-xs text-emerald-600/70 font-sans font-medium">
                    Ketuk huruf-huruf di bawah untuk menyusun kata
                  </span>
                ) : (
                  selectedLetters.map((l, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRemoveLetter(idx)}
                      disabled={isAnswerSubmitted}
                      className="w-12 h-12 bg-white text-emerald-900 border border-emerald-300 shadow-sm rounded-xl font-bold text-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Klik untuk menghapus huruf ini"
                    >
                      {l}
                    </button>
                  ))
                )}
              </div>

              {/* Available letter tiles */}
              <div className="flex items-center justify-center gap-2 flex-wrap font-arabic">
                {availableLetters.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectLetter(item)}
                    disabled={isAnswerSubmitted}
                    className="w-12 h-12 bg-emerald-700 text-white shadow-md rounded-xl font-bold text-2xl flex items-center justify-center hover:bg-emerald-800 active:scale-95 transition"
                  >
                    {item.letter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Multiple Choice Options */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((option, idx) => {
                let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/30';

                if (isAnswerSubmitted) {
                  if (option === currentQ.correctAnswer) {
                    btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20';
                  } else if (option === selectedAnswer) {
                    btnStyle = 'bg-rose-100 border-rose-500 text-rose-900';
                  } else {
                    btnStyle = 'opacity-50 bg-slate-50 border-slate-200 text-slate-400';
                  }
                } else if (selectedAnswer === option) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-bold';
                }

                const isArabicText = /[\u0600-\u06FF]/.test(option);

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedAnswer(option)}
                    className={`p-4 rounded-2xl border text-center transition-all duration-150 cursor-pointer ${btnStyle}`}
                  >
                    <span className={`${isArabicText ? 'font-arabic text-2xl font-bold block' : 'font-semibold text-sm'}`}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Explanation Banner (when answered) */}
          {isAnswerSubmitted && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                (currentQ.type === 'susun-huruf' ? selectedLetters.join('') : selectedAnswer) === currentQ.correctAnswer
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {(currentQ.type === 'susun-huruf' ? selectedLetters.join('') : selectedAnswer) === currentQ.correctAnswer ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {(currentQ.type === 'susun-huruf' ? selectedLetters.join('') : selectedAnswer) === currentQ.correctAnswer
                      ? 'Mumtaz! Jawaban Anda Benar (+20 XP)'
                      : 'Kurang Tepat'}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-700 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions: Submit or Next */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => onAskTutorWithWord(currentQ.prompt)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tanya Penjelasan ke Ustadz AI</span>
            </button>

            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={
                  currentQ.type === 'susun-huruf'
                    ? selectedLetters.length === 0
                    : !selectedAnswer
                }
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 disabled:opacity-40 transition cursor-pointer"
              >
                Periksa Jawaban
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentQuestionIndex < questions.length - 1 ? 'Soal Berikutnya' : 'Lihat Hasil Nilai'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
