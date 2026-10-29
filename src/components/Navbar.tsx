import React from 'react';
import { User, UserStats } from '../types';
import {
  BookOpen,
  Award,
  Sparkles,
  ShieldCheck,
  LogOut,
  Flame,
  Volume2,
} from 'lucide-react';

interface NavbarProps {
  user: User;
  stats: UserStats;
  currentTab: 'flashcards' | 'quiz' | 'tutor' | 'admin';
  onSelectTab: (tab: 'flashcards' | 'quiz' | 'tutor' | 'admin') => void;
  onLogout: () => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  stats,
  currentTab,
  onSelectTab,
  onLogout,
  speechRate,
  onChangeSpeechRate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-500/20">
              <span className="font-arabic text-2xl font-bold">م</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl text-emerald-950 tracking-tight">
                  Mufradat<span className="text-emerald-600">Arabiyah</span>
                </h1>
                <span className="hidden md:inline-block text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                  المُفْرَدَاتِ
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Media Pembelajaran Kosakata Arab Interaktif
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => onSelectTab('flashcards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                currentTab === 'flashcards'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Kartu Mufradat</span>
            </button>

            <button
              onClick={() => onSelectTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                currentTab === 'quiz'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Kuis & Ujian</span>
            </button>

            <button
              onClick={() => onSelectTab('tutor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                currentTab === 'tutor'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Tanya Ustadz AI</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  currentTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-100/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Panel Admin</span>
              </button>
            )}
          </nav>

          {/* Right Actions: Level, XP, Audio Speed, User & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Speed Toggle */}
            <div className="hidden lg:flex items-center gap-1 bg-emerald-50/70 border border-emerald-100 rounded-xl px-2.5 py-1 text-xs text-emerald-800">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-emerald-700">Audio:</span>
              <button
                onClick={() => onChangeSpeechRate(speechRate === 0.8 ? 1.0 : 0.8)}
                className="font-bold underline cursor-pointer hover:text-emerald-950"
                title="Klik untuk mengubah kecepatan suara"
              >
                {speechRate === 0.8 ? 'Lambat (0.8x)' : 'Normal (1.0x)'}
              </button>
            </div>

            {/* Streak & XP pill */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1 text-xs text-amber-900 font-semibold shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{stats.xp} XP</span>
              <span className="text-amber-400">|</span>
              <span className="text-emerald-700">Lv.{stats.level}</span>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div className="hidden xl:block text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                      {user.displayName}
                    </span>
                    {user.role === 'admin' && (
                      <span className="text-[10px] bg-red-100 text-red-700 font-semibold px-1.5 py-0.2 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                    {user.role === 'admin' ? '@' + user.username : user.email || 'Siswa'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-xl transition-colors border border-rose-200"
                title="Keluar dari akun (Logout)"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => onSelectTab('flashcards')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
              currentTab === 'flashcards' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kartu</span>
          </button>
          <button
            onClick={() => onSelectTab('quiz')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
              currentTab === 'quiz' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Kuis</span>
          </button>
          <button
            onClick={() => onSelectTab('tutor')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
              currentTab === 'tutor' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Ustadz AI</span>
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
                currentTab === 'admin' ? 'text-emerald-700 font-bold' : 'text-emerald-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
