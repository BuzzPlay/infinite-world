import type { GenerationSettings } from '@infinite-world/api-contract';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from '../../i18n/use-translation';
import { Field, FieldDescription, FieldLabel } from '../ui/field';
import { initialImageChanges } from './model-options';

interface InitialImageFieldProps {
  generation: GenerationSettings;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  className?: string;
}

export function InitialImageField({
  generation,
  onGenerationChange,
  className,
}: InitialImageFieldProps) {
  const { t } = useTranslation();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const updateInitialImage = (value: string) => {
    setImageError(null);
    onGenerationChange(initialImageChanges(generation, value));
  };

  return (
    <Field className={className}>
      <FieldLabel>
        {t('project.initialImage')}
        <span className="text-xs font-normal text-muted-foreground">{t('common.optional')}</span>
      </FieldLabel>
      <input
        ref={imageInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            readImage(file, updateInitialImage, setImageError, {
              invalid: t('project.chooseImageFile'),
              tooLarge: t('project.imageTooLarge'),
              failed: t('project.imageReadFailed'),
            });
          }
          event.currentTarget.value = '';
        }}
      />
      <div className="relative">
        <button
          type="button"
          className="grid min-h-16 w-full gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-left transition-colors hover:border-ring hover:bg-muted/30"
          onClick={() => imageInputRef.current?.click()}
          aria-label={t('project.uploadInitialImage')}
        >
          {generation.initialImageUrl ? (
            // biome-ignore lint/performance/noImgElement: Uploaded images use local data URLs.
            <img
              src={generation.initialImageUrl}
              alt={t('project.initialImage')}
              className="max-h-32 w-full rounded-md object-contain"
            />
          ) : null}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImagePlus size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{t('project.uploadInitialImage')}</span>
            <span className="ml-auto grid size-7 place-items-center rounded-md text-foreground">
              <Upload size={15} aria-hidden="true" />
            </span>
          </div>
        </button>
        {generation.initialImageUrl ? (
          <button
            type="button"
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-xs transition-colors hover:bg-muted"
            onClick={() => updateInitialImage('')}
            aria-label={t('project.clearInitialImage')}
            title={t('project.clearInitialImage')}
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {imageError ? (
        <FieldDescription className="text-destructive">{imageError}</FieldDescription>
      ) : null}
    </Field>
  );
}

interface ImageReadMessages {
  invalid: string;
  tooLarge: string;
  failed: string;
}

function readImage(
  file: File,
  onReady: (value: string) => void,
  onError: (message: string) => void,
  messages: ImageReadMessages,
) {
  if (!file.type.startsWith('image/')) {
    onError(messages.invalid);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    onError(messages.tooLarge);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') onReady(reader.result);
    else onError(messages.failed);
  };
  reader.onerror = () => onError(messages.failed);
  reader.readAsDataURL(file);
}
