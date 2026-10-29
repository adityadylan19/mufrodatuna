import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Volume2, HelpCircle } from 'lucide-react';
import { speakArabic } from '../services/speech';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AITutorViewProps {
  initialWord?: string;
  speechRate: number;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ initialWord, speechRate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_welcome',
      sender: 'assistant',
      text: initialWord
        ? `Ahlan wa Sahlan! Saya Ustadz AI, asisten belajar bahasa Arab Anda. Ada yang ingin ditanyakan tentang kosakata "${initialWord}" atau materi lainnya?`
        : 'Ahlan wa Sahlan! Saya Ustadz AI. Silakan tanyakan apa saja tentang kosakata bahasa Arab, arti kata, contoh kalimat berharakat, atau tips pelafalan makhraj huruf.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState(
    initialWord ? `Bagaimana penggunaan kata "${initialWord}" dalam kalimat sehari-hari?` : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    'Apa bedanya هٰذَا (Hadza) dan هٰذِهِ (Hadzihi)?',
    'Bagaimana cara membedakan kata laki-laki (mudzakkar) dan perempuan (muannats)?',
    'Tips menghafal kosakata mufradat agar cepat hafal & tidak mudah lupa?',
    'Bagaimana cara menanyakan kabar dalam bahasa Arab yang sopan?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMsg: Message = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/ask-ustadz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          currentWord: initialWord,
        }),
      });

      const data = await res.json();
      const botReply = data.answer || 'Maaf, saya sedang tidak dapat merespons saat ini.';

      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: botReply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot_err_' + Date.now(),
          sender: 'assistant',
          text: 'Afwan, terjadi kendala saat menghubungkan ke Ustadz AI. Silakan coba lagi sebentar.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract Arabic snippets from text and pronounce them
  const playFirstArabic = (text: string) => {
    const arabicMatch = text.match(/[\u0600-\u06FF\s،؛ـ]{3,}/g);
    if (arabicMatch && arabicMatch.length > 0) {
      speakArabic(arabicMatch[0].trim(), speechRate);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Tutor Banner */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <Bot className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Tanya Ustadz AI
              </h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Didukung Gemini Flash
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Guru pendamping bahasa Arab virtual 24/7 untuk tanya jawab mufrodat, kaidah, dan contoh kalimat.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompts Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="font-bold text-slate-500 whitespace-nowrap pl-1">Pertanyaan Populer:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 whitespace-nowrap transition shadow-2xs font-medium cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-emerald-100 shadow-xs flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const hasArabic = /[\u0600-\u06FF]/.test(m.text);

            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser
                      ? 'bg-slate-700 text-white'
                      : 'bg-emerald-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm space-y-2 leading-relaxed ${
                    isUser
                      ? 'bg-slate-800 text-white rounded-tr-xs'
                      : 'bg-emerald-50/70 border border-emerald-100 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  <div
                    className={`flex items-center justify-between pt-1 border-t ${
                      isUser ? 'border-white/10 text-slate-300' : 'border-emerald-200/50 text-emerald-800'
                    } text-[10px]`}
                  >
                    <span>{m.timestamp}</span>
                    {!isUser && hasArabic && (
                      <button
                        onClick={() => playFirstArabic(m.text)}
                        className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                        title="Dengarkan kata Arab dalam teks ini"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Dengarkan Arab</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Bot className="w-4 h-4 animate-bounce text-emerald-600" />
              <span>Ustadz AI sedang mengetik jawaban berharakat...</span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-4 border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Tanyakan mufradat, contoh kalimat, atau cara melafalkan..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
