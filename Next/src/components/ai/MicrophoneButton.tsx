'use client';

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface MicrophoneButtonProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export function MicrophoneButton({
  onTranscript,
  onError,
  disabled = false,
  className = '',
  onRecordingStateChange,
}: MicrophoneButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording);
    }
  }, [isRecording, onRecordingStateChange]);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSupported(false);
      onError?.('مرورگر شما از تشخیص صدا پشتیبانی نمی‌کند');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();

      recognition.lang = 'fa-IR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setIsProcessing(false);
        setRetryCount(0);
        finalTranscriptRef.current = '';
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // اگه متنی وجود داشت و هنوز ارسال نشده، ارسال کن
        if (finalTranscriptRef.current.trim()) {
          onTranscript(finalTranscriptRef.current.trim());
          finalTranscriptRef.current = '';
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsRecording(false);
        setIsProcessing(false);

        switch (event.error) {
          case 'not-allowed':
            onError?.('اجازه دسترسی به میکروفون داده نشده');
            break;
          case 'no-speech':
            // این خطا رو نادیده بگیر (سکوت)
            break;
          case 'audio-capture':
            onError?.('میکروفون پیدا نشد');
            break;
          case 'network':
            if (retryCount < 3) {
              setRetryCount((prev) => prev + 1);
              setTimeout(() => {
                try {
                  recognition.start();
                } catch {
                  // ignore
                }
              }, 1000);
            } else {
              onError?.('خطا در اتصال به سرویس تشخیص صدا');
            }
            break;
          default:
            if (event.error !== 'no-speech') {
              onError?.(`خطا: ${event.error}`);
            }
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        // ارسال متن موقت (برای نمایش)
        if (interimText.trim()) {
          onTranscript(interimText.trim());
        }

        // ذخیره متن نهایی برای ارسال در پایان
        if (finalText.trim()) {
          finalTranscriptRef.current = finalText.trim();
          // فوراً ارسال کن
          onTranscript(finalText.trim());
        }

        // ریست تایمر سکوت
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        silenceTimeoutRef.current = setTimeout(() => {
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        }, 2000);
      };

      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setSupported(false);
      onError?.('راه‌اندازی تشخیص صدا با مشکل مواجه شد');
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };
  }, [mounted, onError, onTranscript, retryCount]);

  const toggleRecording = () => {
    if (disabled || isProcessing || !supported) return;
    if (!mounted) return;

    const recognition = recognitionRef.current;
    if (!recognition) {
      onError?.('سیستم تشخیص صدا آماده نیست');
      return;
    }

    if (isRecording) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
      return;
    }

    try {
      setIsProcessing(true);
      setRetryCount(0);
      finalTranscriptRef.current = '';
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsProcessing(false);
      onError?.('شروع ضبط ممکن نیست');
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-foreground-muted opacity-50"
      >
        <Mic className="h-4 w-4" />
      </button>
    );
  }

  if (!supported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleRecording}
      disabled={disabled || isProcessing || !supported}
      className={`
        relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
        transition-all duration-200 active:scale-95
        ${
          isRecording
            ? 'bg-error text-white animate-pulse'
            : isProcessing
              ? 'bg-warning text-white'
              : 'bg-card text-foreground-muted hover:bg-background-subtle hover:text-foreground'
        }
        ${disabled || !supported ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      aria-label={isRecording ? 'توقف ضبط' : 'شروع ضبط صدا'}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}

      {isRecording && (
        <>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-error animate-ping" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-error" />
        </>
      )}
    </button>
  );
}
