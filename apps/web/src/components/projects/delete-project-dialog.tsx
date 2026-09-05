import { useTranslation } from '../../i18n/use-translation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { ProjectRecord } from './project-types';

interface DeleteProjectDialogProps {
  project: ProjectRecord;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (project: ProjectRecord) => Promise<boolean>;
}

export function DeleteProjectDialog({
  project,
  busy,
  onOpenChange,
  onDelete,
}: DeleteProjectDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('project.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('project.deleteDescription', { name: project.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              void onDelete(project).then((deleted) => {
                if (deleted) onOpenChange(false);
              });
            }}
          >
            {busy ? t('project.deleting') : t('project.deleteProject')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
