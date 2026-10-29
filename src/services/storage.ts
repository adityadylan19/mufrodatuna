import { INITIAL_MUFRADAT } from '../data/initialMufradat';
import { MufradatItem, TestResult, User, UserStats } from '../types';

const STORAGE_KEY_USER = 'mufradat_auth_user_v1';
const STORAGE_KEY_ITEMS = 'mufradat_custom_items_v1';
const STORAGE_KEY_STATS = 'mufradat_user_stats_v1';

// Initial default stats
const DEFAULT_STATS: UserStats = {
  xp: 120,
  level: 1,
  streak: 3,
  completedCards: ['fam_1', 'sch_1', 'bod_1'],
  bookmarkedCards: ['fam_2', 'anm_1'],
  testHistory: [],
};

// --- AUTHENTICATION STATE ---

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  } catch (e) {
    console.error('Failed to save user in storage:', e);
  }
}

// --- MUFRADAT MANAGEMENT (Custom + Initial) ---

export function getStoredMufradat(): MufradatItem[] {
  try {
    const customRaw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!customRaw) {
      return INITIAL_MUFRADAT;
    }
    const customList: MufradatItem[] = JSON.parse(customRaw);
    if (!Array.isArray(customList) || customList.length === 0) {
      return INITIAL_MUFRADAT;
    }
    return customList;
  } catch {
    return INITIAL_MUFRADAT;
  }
}

export function saveAllMufradat(items: MufradatItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save mufradat:', e);
  }
}

export function addMufradat(item: Omit<MufradatItem, 'id'>): MufradatItem {
  const current = getStoredMufradat();
  const newItem: MufradatItem = {
    ...item,
    id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    isCustom: true,
  };
  const updated = [newItem, ...current];
  saveAllMufradat(updated);
  return newItem;
}

export function updateMufradat(updatedItem: MufradatItem): void {
  const current = getStoredMufradat();
  const index = current.findIndex((i) => i.id === updatedItem.id);
  if (index !== -1) {
    current[index] = updatedItem;
    saveAllMufradat([...current]);
  }
}

export function deleteMufradat(id: string): void {
  const current = getStoredMufradat();
  const filtered = current.filter((i) => i.id !== id);
  saveAllMufradat(filtered);
}

export function resetMufradatToDefault(): void {
  saveAllMufradat(INITIAL_MUFRADAT);
}

// --- USER PROGRESS & STATS ---

export function getUserStats(userId: string): UserStats {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_STATS}_${userId}`);
    if (!raw) return DEFAULT_STATS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(userId: string, stats: UserStats): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_STATS}_${userId}`, JSON.stringify(stats));

    // Async sync to server API
    fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, progressData: stats }),
    }).catch(() => {
      // Ignore background network sync errors
    });
  } catch (e) {
    console.error('Failed to save user stats:', e);
  }
}

export function recordTestResult(userId: string, result: TestResult): UserStats {
  const current = getUserStats(userId);
  const newXp = current.xp + result.xpEarned;
  const newLevel = Math.max(1, Math.floor(newXp / 150) + 1);

  const updatedStats: UserStats = {
    ...current,
    xp: newXp,
    level: newLevel,
    testHistory: [result, ...(current.testHistory || [])].slice(0, 30),
  };

  saveUserStats(userId, updatedStats);
  return updatedStats;
}

export function toggleBookmarkCard(userId: string, cardId: string): boolean {
  const current = getUserStats(userId);
  const exists = current.bookmarkedCards.includes(cardId);
  let updatedBookmarks: string[];

  if (exists) {
    updatedBookmarks = current.bookmarkedCards.filter((id) => id !== cardId);
  } else {
    updatedBookmarks = [...current.bookmarkedCards, cardId];
  }

  const updated: UserStats = {
    ...current,
    bookmarkedCards: updatedBookmarks,
  };
  saveUserStats(userId, updated);
  return !exists;
}

export function markCardCompleted(userId: string, cardId: string): void {
  const current = getUserStats(userId);
  if (!current.completedCards.includes(cardId)) {
    const updated: UserStats = {
      ...current,
      completedCards: [...current.completedCards, cardId],
      xp: current.xp + 10,
    };
    saveUserStats(userId, updated);
  }
}
