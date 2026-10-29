export type Difficulty = 'mudah' | 'sedang' | 'menantang';

export interface MufradatItem {
  id: string;
  arabic: string;
  arabicRaw: string;
  latin: string;
  indonesian: string;
  category: string;
  imageUrl: string;
  exampleSentenceArabic: string;
  exampleSentenceIndo: string;
  exampleSentenceLatin: string;
  funFact?: string;
  difficulty: Difficulty;
  isCustom?: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'student';
  avatar: string;
  provider: 'admin' | 'google' | 'student';
}

export interface QuestionAnswerRecord {
  questionId: string;
  prompt: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
}

export interface TestResult {
  id: string;
  timestamp: string;
  mode: string;
  category: string;
  score: number;
  total: number;
  percentage: number;
  xpEarned: number;
  answers: QuestionAnswerRecord[];
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  completedCards: string[];
  bookmarkedCards: string[];
  testHistory: TestResult[];
}

export type QuizMode = 'tebak-gambar' | 'pilihan-ganda' | 'dengar-tebak' | 'susun-huruf';

export interface QuizQuestion {
  id: string;
  type: QuizMode;
  mufradatId: string;
  prompt: string;
  arabicSnippet?: string;
  imageUrl?: string;
  audioText?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  scrambledLetters?: string[];
}
