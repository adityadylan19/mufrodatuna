import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

// In-memory persistent storage for server session data
const userStatsStorage: Record<string, any> = {};

// Helper to get GoogleGenAI instance safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Admin credentials check endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === 'adityadylan' && password === '191105dylan') {
    return res.json({
      success: true,
      user: {
        id: 'admin_adityadylan',
        username: 'adityadylan',
        displayName: 'Aditya Dylan (Administrator)',
        email: 'adityadylan@admin.local',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      token: 'jwt_mock_admin_' + Date.now(),
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Username atau kata sandi admin tidak cocok.',
  });
});

// AI Arabic Tutor endpoint (Tanya Ustadz AI)
app.post('/api/ai/ask-ustadz', async (req: Request, res: Response) => {
  try {
    const { question, currentWord, level } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Pertanyaan tidak boleh kosong' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        answer: `[Mode Offline / Fallback] Ustadz AI menjawab: Untuk mempelajari "${currentWord || 'kosakata ini'}", biasakan mengucapkannya 3 kali dengan makhraj yang fasih dan buat kalimat sederhana setiap hari.`,
      });
    }

    const prompt = `Anda adalah seorang Ustadz dan Guru Bahasa Arab yang ramah, komunikatif, dan ahli dalam mengajarkan kosakata (mufradat) dasar kepada penutur bahasa Indonesia tingkat ${level || 'pemula'}.
Pertanyaan dari murid: "${question}"
${currentWord ? `Konteks kata yang sedang dipelajari: "${currentWord}"` : ''}

Tolong jawab dengan:
1. Penjelasan yang ringkas, hangat, dan mudah dipahami dalam Bahasa Indonesia.
2. Selalu sertakan harakat lengkap pada kata/kalimat bahasa Arab yang dicontohkan.
3. Berikan cara pelafalan latin (transliterasi) dan artinya.
4. Berikan tips mengingat atau contoh kalimat yang praktis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      answer: response.text || 'Maaf, belum bisa menghasilkan jawaban saat ini.',
    });
  } catch (err: any) {
    console.error('Error in /api/ai/ask-ustadz:', err);
    return res.status(500).json({
      error: 'Gagal memproses pertanyaan Ustadz AI: ' + (err.message || 'Unknown error'),
    });
  }
});

// AI Mufradat Generator for Admin
app.post('/api/ai/generate-mufradat', async (req: Request, res: Response) => {
  try {
    const { indonesianWord, category } = req.body;

    if (!indonesianWord) {
      return res.status(400).json({ error: 'Kata bahasa Indonesia wajib diisi' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        arabic: 'كِتَابٌ',
        arabicRaw: 'كتاب',
        latin: 'Kitaabun',
        indonesian: indonesianWord,
        category: category || 'Sekolah',
        exampleSentenceArabic: 'هٰذَا كِتَابٌ مُفِيْدٌ',
        exampleSentenceIndo: 'Ini adalah buku yang bermanfaat',
        exampleSentenceLatin: 'Haadzaa kitaabun mufiidun',
        funFact: 'Kosakata dasar yang mudah dihafalkan.',
      });
    }

    const prompt = `Hasilkan informasi mufradat bahasa Arab lengkap dalam format JSON yang valid untuk kata Indonesia: "${indonesianWord}" ${category ? `dalam kategori "${category}"` : ''}.
Keluarkan HANYA JSON murni tanpa markdown triple backticks. Format schema JSON:
{
  "arabic": "kata arab lengkap dengan harakat fathah/dhammah/kasrah/tanwin",
  "arabicRaw": "kata arab tanpa harakat",
  "latin": "transliterasi latin yang jelas dan mudah dibaca orang Indonesia",
  "indonesian": "${indonesianWord}",
  "category": "Kategori yang cocok (misal: Anggota Tubuh, Keluarga, Sekolah & Kelas, Hewan, Buah & Sayur, Rumah & Benda, Angka, Warna, Profesi, Waktu)",
  "exampleSentenceArabic": "contoh kalimat sederhana berharakat lengkap",
  "exampleSentenceIndo": "terjemahan kalimat dalam bahasa Indonesia",
  "exampleSentenceLatin": "transliterasi latin kalimat",
  "funFact": "tips ringkas mengingat kata ini atau makhraj hurufnya"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text?.trim() || '{}';
    const jsonStr = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const data = JSON.parse(jsonStr);

    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/ai/generate-mufradat:', err);
    return res.status(500).json({
      error: 'Gagal membuat mufradat otomatis: ' + (err.message || 'Unknown error'),
    });
  }
});

// AI Dynamic Quiz Generator
app.post('/api/ai/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { category, count = 5 } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        questions: [
          {
            id: 'mock_1',
            type: 'multiple_choice',
            prompt: 'Apakah arti dari kata "قَلَمٌ" (Qalamun)?',
            options: ['Pena / Pulpen', 'Buku', 'Meja', 'Papan tulis'],
            correctAnswer: 'Pena / Pulpen',
            explanation: 'Qalamun (قَلَمٌ) artinya pena atau pulpen.',
          },
        ],
      });
    }

    const prompt = `Buatkan ${count} soal kuis pembelajaran bahasa Arab untuk pemula dengan tema "${category || 'Mufradat Campuran'}".
Format output WAJIB JSON murni tanpa triple backticks:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "prompt": "Pertanyaan (bisa berupa arti bahasa Arab ke Indo atau sebaliknya)",
      "arabic": "kata arab berharakat terkait",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctAnswer": "Pilihan yang benar (harus persis sama dengan salah satu opsi)",
      "explanation": "Penjelasan ringkas mengapa jawaban ini benar"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = response.text?.trim() || '{}';
    const jsonStr = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const data = JSON.parse(jsonStr);

    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/ai/generate-quiz:', err);
    return res.status(500).json({
      error: 'Gagal membuat kuis dinamis: ' + (err.message || 'Unknown error'),
    });
  }
});

// User Progress save and retrieve
app.post('/api/user/progress', (req: Request, res: Response) => {
  const { userId, progressData } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  userStatsStorage[userId] = {
    ...userStatsStorage[userId],
    ...progressData,
    updatedAt: new Date().toISOString(),
  };

  return res.json({
    success: true,
    data: userStatsStorage[userId],
  });
});

app.get('/api/user/progress/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = userStatsStorage[userId] || {
    xp: 0,
    level: 1,
    streak: 1,
    completedCards: [],
    bookmarkedCards: [],
    testHistory: [],
  };

  return res.json({ success: true, data });
});

export default app;
