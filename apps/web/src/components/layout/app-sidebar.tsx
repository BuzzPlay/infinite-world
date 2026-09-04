import { DotsThreeIcon } from '@phosphor-icons/react';
import { FilePlus2, Settings2, Sparkles } from 'lucide-react';
import { findModel } from '@infinite-world/api-contract/model-catalog';

import type { ProjectRecord } from '../projects/project-types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Hint from '../ui/hint';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '../ui/sidebar';
import { useTranslation } from '../../i18n/use-translation';

interface AppSidebarProps {
  projects: ProjectRecord[];
  activeProjectId: string | null;
  onCreateProject: () => void;
  onProjectSelect: (project: ProjectRecord) => void;
  onOpenSettings: () => void;
  onOpenWorkspace: () => void;
  settingsActive: boolean;
}

export function AppSidebar({
  projects,
  activeProjectId,
  onCreateProject,
  onProjectSelect,
  onOpenSettings,
  onOpenWorkspace,
  settingsActive,
}: AppSidebarProps) {
  const { t } = useTranslation();

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="inset"
      className="[scrollbar-width:'none'] [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden"
    >
      <SidebarHeader className="space-y-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <div className="flex w-full items-center gap-1">
          <div className="min-w-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={onOpenWorkspace}
                  aria-label={t('common.infiniteWorld')}
                  className="group/workspace relative flex h-8 min-w-0 w-full items-center gap-2 rounded-md px-1 hover:bg-card"
                >
                  <Avatar
                    size="sm"
                    className="bg-transparent text-sidebar-primary ring-0"
                    aria-hidden="true"
                  >
                    <AvatarImage src="/logo.svg" alt="" />
                    <AvatarFallback className="bg-transparent text-sidebar-primary">
                      <Sparkles size={14} strokeWidth={2.4} />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground min-w-0 truncate text-sm font-medium tracking-tight">
                    Infinite World
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <Hint side="bottom" label={t('common.collapseSidebar')}>
              <SidebarTrigger
                className="text-muted-foreground hover:text-foreground size-8 shrink-0 cursor-pointer rounded-md transition-transform duration-100 ease-out active:scale-[0.96]"
                title={t('common.collapseSidebar')}
                aria-label={t('common.collapseSidebar')}
              />
            </Hint>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="relative min-h-0 flex-1 [scrollbar-width:'none'] overflow-hidden [-ms-overflow-style:'none'] [&::-webkit-scrollbar]:hidden">
        <div className="flex h-full min-h-0 flex-col space-y-2">
          <SidebarGroup className="py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={onCreateProject}
                  className="relative flex items-center gap-2 px-3 text-sm font-medium [&_svg]:size-4"
                >
                  <FilePlus2 aria-hidden="true" />
                  <span>{t('common.newProject')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="py-0">
            <SidebarGroupLabel>{t('common.projects')}</SidebarGroupLabel>
            <SidebarGroupAction
              type="button"
              title={t('common.projectOptions')}
              aria-label={t('common.projectOptions')}
            >
              <DotsThreeIcon size={16} aria-hidden="true" />
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.length ? (
                  projects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        isActive={activeProjectId === project.id}
                        tooltip={project.name}
                        className="h-11 min-h-0 items-center gap-2 px-2 py-1"
                        onClick={() => onProjectSelect(project)}
                        aria-current={activeProjectId === project.id ? 'page' : undefined}
                      >
                        <Avatar
                          size="default"
                          className={
                            activeProjectId === project.id
                              ? 'bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-sidebar-primary/25'
                              : 'bg-muted text-muted-foreground'
                          }
                          aria-hidden="true"
                        >
                          <AvatarFallback className="bg-transparent text-sm font-medium">
                            {project.name.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="grid min-w-0 flex-1 gap-0 text-left">
                          <span className="truncate text-sm font-medium leading-5 tracking-tight">
                            {project.name}
                          </span>
                          <span className="truncate text-xs font-normal leading-4 text-muted-foreground/70">
                            {projectVideoModel(project)}
                          </span>
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    {t('common.noProjectsYet')}
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter className="gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              isActive={settingsActive}
              onClick={onOpenSettings}
              tooltip={t('common.settings')}
            >
              <Settings2 aria-hidden="true" />
              <span>{t('common.settings')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function projectVideoModel(project: ProjectRecord) {
  const model = findModel('video', project.generation.model);
  if (!model || (model.provider === 'fal' && !project.providerApiKeyConfigured)) return 'none';
  return model.id;
}
