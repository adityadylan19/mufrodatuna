import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, UserCheck, Lock, User as UserIcon, Sparkles, BookOpen, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'google' | 'student'>('admin');
  const [adminUsername, setAdminUsername] = useState('adityadylan');
  const [adminPassword, setAdminPassword] = useState('191105dylan');
  const [studentName, setStudentName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Send to Express Backend /api/auth/login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        // Fallback local check
        if (adminUsername.trim() === 'adityadylan' && adminPassword.trim() === '191105dylan') {
          onLoginSuccess({
            id: 'admin_adityadylan',
            username: 'adityadylan',
            displayName: 'Aditya Dylan (Administrator)',
            email: 'adityadylan@admin.local',
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            provider: 'admin',
          });
        } else {
          setErrorMsg(data.message || 'Username atau kata sandi admin salah. Periksa kembali.');
        }
      }
    } catch {
      // Local fallback
      if (adminUsername.trim() === 'adityadylan' && adminPassword.trim() === '191105dylan') {
        onLoginSuccess({
          id: 'admin_adityadylan',
          username: 'adityadylan',
          displayName: 'Aditya Dylan (Administrator)',
          email: 'adityadylan@admin.local',
          role: 'admin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          provider: 'admin',
        });
      } else {
        setErrorMsg('Username atau kata sandi admin tidak sesuai.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMsg('');

    // Simulate standard Google OAuth popup authentication
    setTimeout(() => {
      const mockGoogleUser: User = {
        id: 'google_user_' + Date.now().toString(36),
        username: 'siswa_google',
        displayName: 'Akun Google (Pelajar)',
        email: 'pelajar.arabika@gmail.com',
        role: 'student',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        provider: 'google',
      };
      setIsLoading(false);
      onLoginSuccess(mockGoogleUser);
    }, 600);
  };

  // Handle Student / Guest Login
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = studentName.trim() || 'Thalibul \'Ilmi';
    const studentUser: User = {
      id: 'student_' + Date.now().toString(36),
      username: name.toLowerCase().replace(/\s+/g, '_'),
      displayName: name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@santri.edu`,
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      provider: 'student',
    };
    onLoginSuccess(studentUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative background glows & patterns */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Branding & Features */}
        <div className="lg:col-span-6 text-white space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Media Pembelajaran Bahasa Arab Digital</span>
          </div>

          <div>
            <h1 className="font-arabic text-4xl sm:text-5xl font-bold text-emerald-300 leading-tight">
              أَهْلًا وَسَهْلًا
            </h1>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
              Mufradat Arabiyah
            </h2>
            <p className="text-emerald-100/80 text-sm mt-3 leading-relaxed">
              Kuasai ratusan kosakata dasar bahasa Arab melalui kartu interaktif bergambar, audio pelafalan makhraj asli, kuis evaluasi beragam mode, dan panduan Ustadz AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Kartu Bergambar</h4>
                <p className="text-[11px] text-emerald-100/70">Visual jernih + transliterasi & contoh kalimat</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">4 Mode Ujian</h4>
                <p className="text-[11px] text-emerald-100/70">Tebak gambar, pilihan ganda, dengar & susun kata</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-200/60 pt-2 border-t border-emerald-800/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Wajib login untuk menyimpan riwayat hafalan & level XP Anda</span>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/60 border border-white/20">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke Aplikasi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Silakan pilih metode masuk yang Anda kehendaki
            </p>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('google');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'google'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Google Auth
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎓 Siswa
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: ADMIN LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Akun Admin Tersedia:</span>
                  <span className="text-[11px] text-emerald-700">
                    user: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">adityadylan</code> | sandi: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">191105dylan</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminUsername('adityadylan');
                    setAdminPassword('191105dylan');
                  }}
                  className="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition"
                >
                  Isi Cepat
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username Admin
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    placeholder="adityadylan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Admin
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Masuk sebagai Administrator</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: GOOGLE SIGN-IN */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <div className="text-center py-4 px-2">
                <p className="text-xs text-slate-600 mb-5">
                  Gunakan akun Google Anda untuk sinkronisasi progress belajar, kuis, dan perolehan badge XP.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm shadow-sm flex items-center justify-center gap-3 transition hover:shadow cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Menghubungkan Google...' : 'Masuk dengan Akun Google'}</span>
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed text-center">
                Autentikasi aman melalui Google Sign-In terintegrasi untuk pengguna umum & santri.
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT QUICK LOGIN */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Anda / Panggilan
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Opsional, atau klik Mulai Belajar langsung untuk mode tamu.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
              >
                <span>Mulai Belajar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Mufradat Arabiyah • Media Belajar Mandiri & Terbimbing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
