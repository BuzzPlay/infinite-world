import type { GenerationSettings, WorldConfig } from '@infinite-world/api-contract';

import { Field, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useTranslation } from '../../i18n/use-translation';
import { InitialImageField } from './initial-image-field';

interface WorldSetupFormProps {
  draft: WorldConfig;
  onNameChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onGenerationChange: (changes: Partial<GenerationSettings>) => void;
  className?: string;
}

export function WorldSetupForm({
  draft,
  onNameChange,
  onPromptChange,
  onGenerationChange,
  className,
}: WorldSetupFormProps) {
  const { t } = useTranslation();

  return (
    <div className={`px-4 py-4 sm:px-5 sm:py-5 ${className ?? ''}`}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="world-name">{t('project.name')}</FieldLabel>
          <Input
            id="world-name"
            value={draft.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder={t('project.namePlaceholder')}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="world-prompt">{t('project.initialPrompt')}</FieldLabel>
          <Textarea
            id="world-prompt"
            value={draft.prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            rows={4}
            placeholder={t('project.promptPlaceholder')}
          />
        </Field>
        <InitialImageField generation={draft.generation} onGenerationChange={onGenerationChange} />
      </FieldGroup>
    </div>
  );
}
