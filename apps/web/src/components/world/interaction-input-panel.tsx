import type { InteractionType } from '@infinite-world/api-contract';
import { LoaderCircle, Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/use-translation';
import { Button } from '../ui/button';

type Transcriber = (
  audio: string,
  options?: { language?: string; return_timestamps?: boolean },
) => Promise<{ text?: string }>;

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
  const { t } = useTranslation();
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  useEffect(() => {
    return () => recorderRef.current?.stop();
  }, []);

  if (interactionType !== 'voice') return null;

  const transcribe = async (blob: Blob) => {
    setLoading(true);
    const audioUrl = URL.createObjectURL(blob);
    try {
      const { pipeline } = await import('@huggingface/transformers');
      const transcriber = (await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-base',
      )) as unknown as Transcriber;
      const result = await transcriber(audioUrl, {
        language: document.documentElement.lang.startsWith('zh') ? 'chinese' : 'english',
      });
      const value = result.text?.trim() ?? '';
      setTranscript(value);
      if (value) onSubmitRef.current(value);
    } catch {
      setTranscript(t('dashboard.voiceTranscriptionFailed'));
    } finally {
      URL.revokeObjectURL(audioUrl);
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
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
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      void transcribe(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setTranscript('');
    setRecording(true);
  };

  return (
    <section className="pointer-events-auto flex w-full max-w-xl flex-col items-center gap-2 px-4">
      <div
        className="min-h-6 max-w-full text-center text-sm font-medium text-white drop-shadow-md"
        aria-live="polite"
      >
        {loading ? t('dashboard.transcribing') : transcript}
      </div>
      <Button
        type="button"
        variant={recording ? 'blue' : 'background'}
        className="h-12 min-w-28 rounded-full border border-border px-7 shadow-lg transition-transform active:scale-95"
        onClick={() => void toggleRecording()}
        disabled={disabled || loading}
        title={recording ? t('dashboard.stopRecording') : t('dashboard.startRecording')}
        aria-label={recording ? t('dashboard.stopRecording') : t('dashboard.startRecording')}
      >
        {loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : null}
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
    </section>
  );
}
