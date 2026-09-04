import { useId, useRef, useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import type { GenerationSettings } from '@infinite-world/api-contract';

import { Button } from '../ui/button';
import { Field, FieldDescription, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { useTranslation } from '../../i18n/use-translation';
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
  const inputId = useId();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const updateInitialImage = (value: string) => {
    setImageError(null);
    onGenerationChange(initialImageChanges(generation, value));
  };

  return (
    <Field className={className}>
      <FieldLabel htmlFor={inputId}>{t('project.initialImage')}</FieldLabel>
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
      <div className="grid gap-2 rounded-lg border border-dashed border-border p-2">
        {generation.initialImageUrl ? (
          <img
            src={generation.initialImageUrl}
            alt={t('project.initialImage')}
            className="max-h-40 w-full rounded-md object-contain"
          />
        ) : null}
        <div className="flex items-center gap-2">
          <ImagePlus size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            id={inputId}
            className="h-8 min-w-0 border-0 bg-transparent px-0 shadow-none focus:border-0 focus:ring-0"
            aria-label={t('project.initialImageUrl')}
            value={generation.initialImageUrl ?? ''}
            onChange={(event) => updateInitialImage(event.target.value)}
            placeholder={t('project.imageUrlUpload')}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title={t('project.uploadInitialImage')}
            aria-label={t('project.uploadInitialImage')}
            onClick={() => imageInputRef.current?.click()}
          >
            <Upload size={15} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {imageError ? (
        <FieldDescription className="text-destructive">{imageError}</FieldDescription>
      ) : (
        <FieldDescription>{t('project.initialImageDescription')}</FieldDescription>
      )}
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
