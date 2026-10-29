/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MufradatItem, TestResult, User, UserStats } from './types';
import {
  getStoredUser,
  saveStoredUser,
  getStoredMufradat,
  addMufradat,
  updateMufradat,
  deleteMufradat,
  resetMufradatToDefault,
  getUserStats,
  recordTestResult,
  toggleBookmarkCard,
  markCardCompleted,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { AdminPanel } from './components/AdminPanel';
import { AITutorView } from './components/AITutorView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [currentTab, setCurrentTab] = useState<'flashcards' | 'quiz' | 'tutor' | 'admin'>('flashcards');
  const [items, setItems] = useState<MufradatItem[]>(() => getStoredMufradat());
  const [stats, setStats] = useState<UserStats>(() => {
    const user = getStoredUser();
    return user ? getUserStats(user.id) : {
      xp: 0,
      level: 1,
      streak: 1,
      completedCards: [],
      bookmarkedCards: [],
      testHistory: [],
    };
  });
  const [speechRate, setSpeechRate] = useState<number>(0.85);
  const [tutorInitialWord, setTutorInitialWord] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keep stats in sync when user logs in
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    saveStoredUser(user);
    const userStats = getUserStats(user.id);
    setStats(userStats);
    showToast(`Ahlan wa Sahlan, ${user.displayName}!`);
  };

  const handleLogout = () => {
    saveStoredUser(null);
    setCurrentUser(null);
    setCurrentTab('flashcards');
    showToast('Anda telah keluar dari aplikasi.');
  };

  // Toggle bookmark
  const handleToggleBookmark = (cardId: string) => {
    if (!currentUser) return;
    const isAdded = toggleBookmarkCard(currentUser.id, cardId);
    setStats(getUserStats(currentUser.id));
    showToast(isAdded ? 'Ditambahkan ke Favorit ❤️' : 'Dihapus dari Favorit');
  };

  // Mark completed
  const handleMarkCompleted = (cardId: string) => {
    if (!currentUser) return;
    markCardCompleted(currentUser.id, cardId);
    setStats(getUserStats(currentUser.id));
    showToast('Alhamdulillah! +10 XP Diperoleh ⚡');
  };

  // Save Quiz result
  const handleSaveTestResult = (result: TestResult) => {
    if (!currentUser) return;
    const updated = recordTestResult(currentUser.id, result);
    setStats(updated);
    showToast(`Ujian Selesai! Nilai: ${result.percentage}% (+${result.xpEarned} XP) 🏆`);
  };

  // Admin Mufradat Operations
  const handleAddItem = (newItem: Omit<MufradatItem, 'id'>) => {
    const created = addMufradat(newItem);
    setItems(getStoredMufradat());
    showToast(`Kosakata "${created.indonesian}" berhasil ditambahkan!`);
  };

  const handleUpdateItem = (updated: MufradatItem) => {
    updateMufradat(updated);
    setItems(getStoredMufradat());
    showToast(`Kosakata "${updated.indonesian}" berhasil diperbarui!`);
  };

  const handleDeleteItem = (id: string) => {
    deleteMufradat(id);
    setItems(getStoredMufradat());
    showToast('Kosakata berhasil dihapus.');
  };

  const handleResetDefault = () => {
    resetMufradatToDefault();
    setItems(getStoredMufradat());
    showToast('Mufradat dikembalikan ke daftar bawaan.');
  };

  // Ask tutor contextually
  const handleAskTutorWithWord = (word: string) => {
    setTutorInitialWord(word);
    setCurrentTab('tutor');
  };

  // MANDATORY LOGIN PAGE: If user is not authenticated, show LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-emerald-950 text-white text-xs sm:text-sm font-semibold shadow-xl border border-emerald-500/30 flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        user={currentUser}
        stats={stats}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onLogout={handleLogout}
        speechRate={speechRate}
        onChangeSpeechRate={setSpeechRate}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'flashcards' && (
          <FlashcardView
            items={items}
            stats={stats}
            userId={currentUser.id}
            speechRate={speechRate}
            onToggleBookmark={handleToggleBookmark}
            onMarkCompleted={handleMarkCompleted}
            onAskTutorWithWord={handleAskTutorWithWord}
          />
        )}

        {currentTab === 'quiz' && (
          <QuizView
            items={items}
            stats={stats}
            userId={currentUser.id}
            speechRate={speechRate}
            onSaveTestResult={handleSaveTestResult}
            onAskTutorWithWord={handleAskTutorWithWord}
          />
        )}

        {currentTab === 'tutor' && (
          <AITutorView
            initialWord={tutorInitialWord}
            speechRate={speechRate}
          />
        )}

        {currentTab === 'admin' && currentUser.role === 'admin' && (
          <AdminPanel
            items={items}
            speechRate={speechRate}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onResetDefault={handleResetDefault}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-arabic text-base text-emerald-700 font-bold">مُفْرَدَاتِي</span>
            <span>• Media Pembelajaran Bahasa Arab Interaktif</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Dikelola oleh Administrator <strong className="text-slate-600">@adityadylan</strong> • Siap Deploy Vercel
          </div>
        </div>
      </footer>
    </div>
  );
}
