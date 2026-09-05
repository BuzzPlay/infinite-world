import { useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { useTranslation } from '../../i18n/use-translation';
import type { ProjectRecord } from './project-types';

interface RenameProjectDialogProps {
  project: ProjectRecord;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (project: ProjectRecord, name: string) => Promise<boolean>;
}

export function RenameProjectDialog({
  project,
  busy,
  onOpenChange,
  onRename,
}: RenameProjectDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(project.name);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onRename(project, name.trim())) onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('project.renameTitle')}</DialogTitle>
          <DialogDescription>{t('project.renameDescription')}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
          <Field>
            <FieldLabel htmlFor="rename-project-name">{t('project.name')}</FieldLabel>
            <Input
              id="rename-project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('project.namePlaceholder')}
              autoFocus
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              <Pencil size={15} aria-hidden="true" />
              {busy ? t('project.renaming') : t('project.renameProject')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
