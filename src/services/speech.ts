/**
 * Speech synthesis service for Arabic pronunciation.
 */

let cachedArabicVoice: SpeechSynthesisVoice | null = null;
let isVoiceInitialized = false;

function initVoices(): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return resolve(null);
    }

    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Search for Arabic voices
      const arVoice = voices.find(
        (v) => v.lang.startsWith('ar') || v.lang.includes('ar-') || v.lang === 'ar-SA'
      );
      if (arVoice) {
        cachedArabicVoice = arVoice;
        isVoiceInitialized = true;
        resolve(arVoice);
        return true;
      }
      return false;
    };

    if (findVoice()) return;

    window.speechSynthesis.onvoiceschanged = () => {
      findVoice();
      resolve(cachedArabicVoice);
    };

    // Timeout fallback
    setTimeout(() => {
      resolve(cachedArabicVoice);
    }, 500);
  });
}

// Pre-init
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  initVoices();
}

export async function speakArabic(text: string, rate: number = 0.85): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported on this device/browser.');
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  return new Promise((resolve) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = rate; // 0.75 - 1.0
      utterance.pitch = 1.0;

      if (!isVoiceInitialized) {
        const voices = window.speechSynthesis.getVoices();
        const arVoice = voices.find((v) => v.lang.startsWith('ar'));
        if (arVoice) {
          utterance.voice = arVoice;
        }
      } else if (cachedArabicVoice) {
        utterance.voice = cachedArabicVoice;
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error invoking speakArabic:', err);
      resolve(false);
    }
  });
}

export function stopArabicSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
