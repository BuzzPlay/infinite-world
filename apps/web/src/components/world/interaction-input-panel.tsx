import type { InteractionType } from '@infinite-world/api-contract';
import { LoaderCircle, Mic, MicOff, Send, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/use-translation';
import { transcribeAudio } from '../../lib/api';
import { Button } from '../ui/button';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

interface InteractionInputPanelProps {
  interactionType: InteractionType;
  disabled?: boolean;
  onSubmit: (input: string) => void;
}

export function InteractionInputPanel({
  interactionType,
  disabled = false,
  onSubmit,
}: InteractionInputPanelProps) {
  const { locale, t } = useTranslation();
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recognitionLanguage, setRecognitionLanguage] = useState<'en' | 'zh'>(locale);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartingRecognitionRef = useRef(false);
  const recordingRef = useRef(false);
  const cancelRecordingRef = useRef(false);
  const chunksRef = useRef<Blob[]>([]);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  useEffect(() => {
    setRecognitionLanguage(locale);
  }, [locale]);

  useEffect(() => {
    return () => {
      restartingRecognitionRef.current = false;
      recognitionRef.current?.stop();
      recorderRef.current?.stop();
    };
  }, []);

  if (interactionType !== 'voice') return null;

  const transcribe = async (blob: Blob) => {
    setLoading(true);
    try {
      const result = await transcribeAudio(blob, recognitionLanguage);
      const value = result.text.trim();
      setTranscript(value);
      if (value) onSubmitRef.current(value);
    } catch {
      setTranscript(t('dashboard.voiceTranscriptionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const finishRecording = (cancel: boolean) => {
    if (!recording) return;
    restartingRecognitionRef.current = false;
    recordingRef.current = false;
    cancelRecordingRef.current = cancel;
    recognitionRef.current?.stop();
    recorderRef.current?.stop();
    setRecording(false);
  };

  const toggleRecording = async () => {
    if (recording) {
      finishRecording(false);
      return;
    }
    if (disabled || !navigator.mediaDevices?.getUserMedia) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setTranscript(t('dashboard.microphonePermissionDenied'));
      return;
    }
    const recorder = new MediaRecorder(stream);
    const recognitionConstructor =
      (window as SpeechRecognitionWindow).SpeechRecognition ??
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;
    const recognition = recognitionConstructor ? new recognitionConstructor() : null;
    chunksRef.current = [];
    cancelRecordingRef.current = false;
    setTranscript('');
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      recordingRef.current = false;
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      if (cancelRecordingRef.current) {
        chunksRef.current = [];
        setTranscript('');
        return;
      }
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      void transcribe(blob);
    };
    recorderRef.current = recorder;
    recordingRef.current = true;
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = recognitionLanguage === 'zh' ? 'zh-CN' : 'en-US';
      recognition.onresult = (event) => {
        let value = '';
        for (let index = 0; index < event.results.length; index += 1) {
          value += event.results[index]?.[0]?.transcript ?? '';
        }
        setTranscript(value.trim());
      };
      recognition.onend = () => {
        if (recordingRef.current && !restartingRecognitionRef.current) {
          try {
            recognition.start();
          } catch {
            // The final local Whisper transcription remains available as a fallback.
          }
        }
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        // Some browsers require a user gesture before starting speech recognition.
      }
    } else {
      setTranscript(t('dashboard.voiceUnsupported'));
    }
    recorder.start();
    setRecording(true);
  };

  return (
    <section className="pointer-events-auto flex w-full max-w-xl flex-col items-center gap-2 px-4">
      <div
        className="min-h-7 max-w-full text-center text-lg font-medium text-white drop-shadow-md sm:text-xl"
        aria-live="polite"
      >
        {loading ? t('dashboard.transcribing') : transcript}
      </div>
      <div className="flex items-center gap-2">
        {recording ? (
          <div className="flex h-12 overflow-hidden rounded-full border border-border bg-blue-500 text-white shadow-lg">
            <Button
              type="button"
              variant="ghost"
              className="h-full rounded-none px-5 text-white hover:bg-blue-400 hover:text-white"
              onClick={() => finishRecording(false)}
              disabled={loading}
              title={t('dashboard.sendVoice')}
              aria-label={t('dashboard.sendVoice')}
            >
              <Send size={17} aria-hidden="true" />
              <span>{t('dashboard.listening')}</span>
            </Button>
            <div className="my-2 w-px bg-white/45" aria-hidden="true" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-full w-12 rounded-none text-white hover:bg-blue-400 hover:text-white"
              onClick={() => finishRecording(true)}
              disabled={loading}
              title={t('dashboard.cancelRecording')}
              aria-label={t('dashboard.cancelRecording')}
            >
              <Square size={16} fill="currentColor" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant={recording ? 'blue' : 'background'}
            className="h-12 min-w-28 rounded-full border border-border px-7 shadow-lg transition-transform active:scale-95"
            onClick={() => void toggleRecording()}
            disabled={disabled || loading}
            title={recording ? t('dashboard.stopRecording') : t('dashboard.startRecording')}
            aria-label={recording ? t('dashboard.stopRecording') : t('dashboard.startRecording')}
          >
            {loading ? (
              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
            ) : null}
            {!loading &&
              (recording ? (
                <MicOff size={18} aria-hidden="true" />
              ) : (
                <Mic size={18} aria-hidden="true" />
              ))}
            <span>
              {loading
                ? t('dashboard.transcribing')
                : recording
                  ? t('dashboard.listening')
                  : t('dashboard.speak')}
            </span>
          </Button>
        )}
        <select
          value={recognitionLanguage}
          onChange={(event) => setRecognitionLanguage(event.target.value as 'en' | 'zh')}
          disabled={recording || loading || disabled}
          aria-label={t('dashboard.voiceLanguage')}
          className="h-9 rounded-md border border-white/30 bg-black/45 px-2 text-xs text-white shadow-md outline-none backdrop-blur-sm disabled:opacity-60"
        >
          <option value="en">{t('dashboard.english')}</option>
          <option value="zh">{t('dashboard.chinese')}</option>
        </select>
      </div>
    </section>
  );
}
