import React, { useState } from 'react';
import { Difficulty, MufradatItem } from '../types';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  RotateCcw,
  Search,
  Check,
  X,
  Volume2,
  Image as ImageIcon,
} from 'lucide-react';
import { speakArabic } from '../services/speech';

interface AdminPanelProps {
  items: MufradatItem[];
  speechRate: number;
  onAddItem: (item: Omit<MufradatItem, 'id'>) => void;
  onUpdateItem: (item: MufradatItem) => void;
  onDeleteItem: (id: string) => void;
  onResetDefault: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  items,
  speechRate,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onResetDefault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MufradatItem | null>(null);

  // Form states
  const [arabic, setArabic] = useState('');
  const [arabicRaw, setArabicRaw] = useState('');
  const [latin, setLatin] = useState('');
  const [indonesian, setIndonesian] = useState('');
  const [category, setCategory] = useState('Sekolah & Kelas');
  const [imageUrl, setImageUrl] = useState('');
  const [exampleArabic, setExampleArabic] = useState('');
  const [exampleIndo, setExampleIndo] = useState('');
  const [exampleLatin, setExampleLatin] = useState('');
  const [funFact, setFunFact] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('mudah');

  // AI Generator state
  const [aiWordPrompt, setAiWordPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.indonesian.toLowerCase().includes(q) ||
      item.latin.toLowerCase().includes(q) ||
      item.arabic.includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const openAddModal = () => {
    setEditingItem(null);
    setArabic('');
    setArabicRaw('');
    setLatin('');
    setIndonesian('');
    setCategory('Sekolah & Kelas');
    setImageUrl('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80');
    setExampleArabic('');
    setExampleIndo('');
    setExampleLatin('');
    setFunFact('');
    setDifficulty('mudah');
    setAiFeedback('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MufradatItem) => {
    setEditingItem(item);
    setArabic(item.arabic);
    setArabicRaw(item.arabicRaw);
    setLatin(item.latin);
    setIndonesian(item.indonesian);
    setCategory(item.category);
    setImageUrl(item.imageUrl);
    setExampleArabic(item.exampleSentenceArabic);
    setExampleIndo(item.exampleSentenceIndo);
    setExampleLatin(item.exampleSentenceLatin);
    setFunFact(item.funFact || '');
    setDifficulty(item.difficulty);
    setAiFeedback('');
    setIsModalOpen(true);
  };

  // AI Auto Generator with Gemini API
  const handleAIGenerate = async () => {
    if (!aiWordPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiFeedback('');

    try {
      const res = await fetch('/api/ai/generate-mufradat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indonesianWord: aiWordPrompt.trim(),
          category,
        }),
      });

      const data = await res.json();
      if (res.ok && data.arabic) {
        setArabic(data.arabic);
        setArabicRaw(data.arabicRaw || data.arabic.replace(/[\u064B-\u065F]/g, ''));
        setLatin(data.latin || '');
        setIndonesian(aiWordPrompt.trim());
        if (data.category) setCategory(data.category);
        if (data.exampleSentenceArabic) setExampleArabic(data.exampleSentenceArabic);
        if (data.exampleSentenceIndo) setExampleIndo(data.exampleSentenceIndo);
        if (data.exampleSentenceLatin) setExampleLatin(data.exampleSentenceLatin);
        if (data.funFact) setFunFact(data.funFact);
        setAiFeedback('✨ Berhasil dihasilkan oleh Gemini AI!');
      } else {
        setAiFeedback('Gagal menghasilkan otomatis. Silakan lengkapi manual.');
      }
    } catch (e: any) {
      setAiFeedback('Error: ' + e.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabic.trim() || !indonesian.trim()) return;

    const payload = {
      arabic: arabic.trim(),
      arabicRaw: arabicRaw.trim() || arabic.replace(/[\u064B-\u065F]/g, '').trim(),
      latin: latin.trim() || 'Mufradat',
      indonesian: indonesian.trim(),
      category: category.trim() || 'Umum',
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      exampleSentenceArabic: exampleArabic.trim(),
      exampleSentenceIndo: exampleIndo.trim(),
      exampleSentenceLatin: exampleLatin.trim(),
      funFact: funFact.trim(),
      difficulty,
    };

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        ...payload,
      });
    } else {
      onAddItem(payload);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Panel Administrator
                </h2>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  @adityadylan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/70 mt-1">
                Kelola kartu mufradat, tambah materi baru, atau gunakan Gemini AI untuk auto-generate kosakata Arab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={openAddModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mufradat Baru</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Kembalikan semua daftar mufradat ke dataset bawaan?')) {
                  onResetDefault();
                }
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition"
              title="Reset ke Mufradat Bawaan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-emerald-300/80 block">Total Mufradat</span>
            <span className="text-xl font-bold text-white">{items.length} Kata</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-emerald-300/80 block">Kategori</span>
            <span className="text-xl font-bold text-white">
              {new Set(items.map((i) => i.category)).size} Kategori
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-emerald-300/80 block">Kartu Kustom</span>
            <span className="text-xl font-bold text-white">
              {items.filter((i) => i.isCustom).length} Buatan Admin
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-emerald-300/80 block">Server AI</span>
            <span className="text-xl font-bold text-emerald-400">Gemini Active</span>
          </div>
        </div>
      </div>

      {/* Search & Table List */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mufradat di panel admin..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredItems.length} dari {items.length} kartu
          </span>
        </div>

        {/* Table of items */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="p-3.5">Gambar</th>
                <th className="p-3.5">Kosakata Arab</th>
                <th className="p-3.5">Transliterasi</th>
                <th className="p-3.5">Bahasa Indonesia</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Tingkat</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5">
                    <img
                      src={item.imageUrl}
                      alt={item.indonesian}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-arabic text-xl font-bold text-emerald-950">
                        {item.arabic}
                      </span>
                      <button
                        onClick={() => speakArabic(item.arabic, speechRate)}
                        className="text-slate-400 hover:text-emerald-600 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-emerald-700">{item.latin}</td>
                  <td className="p-3.5 font-bold text-slate-800">{item.indonesian}</td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3.5 capitalize text-slate-500">{item.difficulty}</td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="Edit Mufradat"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Hapus kata "${item.indonesian}"?`)) {
                          onDeleteItem(item.id);
                        }
                      }}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Mufradat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Mufradat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Mufradat' : 'Tambah Mufradat Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Assistant Generator Bar */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Bantuan Cepat Gemini AI:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiWordPrompt}
                  onChange={(e) => setAiWordPrompt(e.target.value)}
                  placeholder="Ketik kata Indonesia, contoh: Pesawat terbang, Dokter, Apel..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isAiGenerating || !aiWordPrompt.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {isAiGenerating ? 'Membuat...' : 'Isi Otomatis'}
                </button>
              </div>
              {aiFeedback && <p className="text-[11px] text-emerald-800 font-semibold">{aiFeedback}</p>}
            </div>

            {/* Main Form */}
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Arab (Lengkap Harakat) *
                  </label>
                  <input
                    type="text"
                    value={arabic}
                    onChange={(e) => setArabic(e.target.value)}
                    required
                    placeholder="Contoh: كِتَابٌ"
                    className="w-full px-3.5 py-2 text-base font-arabic font-bold text-right bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Arti Bahasa Indonesia *
                  </label>
                  <input
                    type="text"
                    value={indonesian}
                    onChange={(e) => setIndonesian(e.target.value)}
                    required
                    placeholder="Contoh: Buku"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transliterasi Latin *
                  </label>
                  <input
                    type="text"
                    value={latin}
                    onChange={(e) => setLatin(e.target.value)}
                    required
                    placeholder="Contoh: Kitaabun"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Kosakata *
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    placeholder="Contoh: Sekolah & Kelas, Hewan, Buah..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Gambar (Unsplash atau Web) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
                    />
                  )}
                </div>
              </div>

              {/* Example sentence */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Contoh Kalimat (Opsional tapi disarankan):
                </span>
                <div>
                  <input
                    type="text"
                    value={exampleArabic}
                    onChange={(e) => setExampleArabic(e.target.value)}
                    placeholder="Kalimat Arab berharakat: هٰذَا كِتَابٌ مُفِيْدٌ"
                    className="w-full px-3 py-1.5 text-base font-arabic font-bold text-right bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={exampleLatin}
                    onChange={(e) => setExampleLatin(e.target.value)}
                    placeholder="Transliterasi: Haadzaa kitaabun..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={exampleIndo}
                    onChange={(e) => setExampleIndo(e.target.value)}
                    placeholder="Arti: Ini buku yang bermanfaat"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="menantang">Menantang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fakta / Tips Tambahan
                  </label>
                  <input
                    type="text"
                    value={funFact}
                    onChange={(e) => setFunFact(e.target.value)}
                    placeholder="Contoh: Termasuk kata muannats..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan ke Kartu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
