import { DotsThreeIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { Check, ChevronRight, FilePlus2, Settings2, Sparkles, Trash2 } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/use-translation';
import { ProjectIcon } from '../projects/project-icon';
import type { ProjectRecord } from '../projects/project-types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import Hint from '../ui/hint';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '../ui/sidebar';

interface AppSidebarProps {
  projects: ProjectRecord[];
  activeProjectId: string | null;
  onCreateProject: () => void;
  onProjectSelect: (project: ProjectRecord) => void;
  onProjectRename: (project: ProjectRecord) => void;
  onProjectDelete: (project: ProjectRecord) => void;
  onOpenSettings: () => void;
  onOpenWorkspace: () => void;
  settingsActive: boolean;
}

type ProjectOrder = 'activity' | 'created' | 'name';

export function AppSidebar({
  projects,
  activeProjectId,
  onCreateProject,
  onProjectSelect,
  onProjectRename,
  onProjectDelete,
  onOpenSettings,
  onOpenWorkspace,
  settingsActive,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const { holdPeek } = useSidebar();
  const [projectOrder, setProjectOrder] = useState<ProjectOrder>('activity');
  const orderedProjects = useMemo(() => {
    return [...projects].sort((left, right) => {
      if (projectOrder === 'name') return left.name.localeCompare(right.name);
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
  }, [projectOrder, projects]);
  const projectGroups = useMemo(() => groupProjects(orderedProjects, t), [orderedProjects, t]);

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
            <SidebarGroupLabel className="justify-between pr-1">
              <span>{t('common.projects')}</span>
              <DropdownMenu onOpenChange={holdPeek}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    title={t('common.projectListOptions')}
                    aria-label={t('common.projectListOptions')}
                  >
                    <DotsThreeIcon size={16} aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-52">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      {t('common.ordering')}
                      <span className="ml-auto mr-1 text-xs text-muted-foreground">
                        {projectOrder === 'name'
                          ? t('common.name')
                          : projectOrder === 'created'
                            ? t('common.dateCreated')
                            : t('common.lastActivity')}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {(
                        [
                          ['activity', t('common.lastActivity')],
                          ['created', t('common.dateCreated')],
                          ['name', t('common.name')],
                        ] as const
                      ).map(([value, label]) => (
                        <DropdownMenuItem
                          key={value}
                          className="cursor-pointer"
                          onSelect={() => setProjectOrder(value)}
                        >
                          <span className="flex size-4 items-center justify-center">
                            {projectOrder === value ? <Check size={14} aria-hidden="true" /> : null}
                          </span>
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem disabled>
                    {t('common.grouping')}
                    <ChevronRight className="ml-auto size-3.5 text-muted-foreground" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {projectGroups.length ? (
                  projectGroups.flatMap((group) => [
                    <SidebarMenuItem key={`group-${group.label}`} className="pointer-events-none">
                      <div className="px-2 pb-1 pt-2 text-[11px] font-medium text-muted-foreground/70 first:pt-0">
                        {group.label}
                      </div>
                    </SidebarMenuItem>,
                    ...group.projects.map((project) => (
                      <Fragment key={project.id}>
                        <SidebarMenuItem>
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
                                {project.icon?.startsWith('icon:') ? (
                                  <ProjectIcon value={project.icon} size={16} />
                                ) : project.icon && !project.icon.startsWith('data:image/') ? (
                                  project.icon
                                ) : (
                                  project.name.slice(0, 1).toUpperCase()
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="grid min-w-0 flex-1 gap-0 text-left">
                              <span className="truncate text-sm font-medium leading-5 tracking-tight">
                                {project.name}
                              </span>
                              <span className="truncate text-xs font-normal leading-4 text-muted-foreground/70">
                                {t(`project.interaction.${project.interactionType}`)}
                              </span>
                            </span>
                          </SidebarMenuButton>
                          <DropdownMenu onOpenChange={holdPeek}>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction
                                type="button"
                                showOnHover
                                className={
                                  activeProjectId === project.id
                                    ? 'opacity-100 md:opacity-100'
                                    : undefined
                                }
                                title={t('common.projectOptions')}
                                aria-label={t('common.projectOptions')}
                              >
                                <DotsThreeIcon size={16} aria-hidden="true" />
                              </SidebarMenuAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start" className="w-44">
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onSelect={() => onProjectRename(project)}
                              >
                                <PencilSimpleIcon aria-hidden="true" />
                                {t('common.rename')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                className="cursor-pointer"
                                onSelect={() => onProjectDelete(project)}
                              >
                                <Trash2 aria-hidden="true" />
                                {t('project.deleteProject')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      </Fragment>
                    )),
                  ])
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

function groupProjects(
  projects: ProjectRecord[],
  t: (key: string) => string,
): Array<{ label: string; projects: ProjectRecord[] }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const groups = new Map<string, ProjectRecord[]>();
  const labels = [
    t('common.today'),
    t('common.yesterday'),
    t('common.previous7Days'),
    t('common.older'),
  ];

  for (const project of projects) {
    const timestamp = Date.parse(project.createdAt);
    const projectDay = Number.isNaN(timestamp)
      ? today - 8 * 24 * 60 * 60 * 1000
      : new Date(timestamp).setHours(0, 0, 0, 0);
    const daysAgo = Math.floor((today - projectDay) / (24 * 60 * 60 * 1000));
    const label = labels[daysAgo === 0 ? 0 : daysAgo === 1 ? 1 : daysAgo <= 7 ? 2 : 3];
    const current = groups.get(label) ?? [];
    current.push(project);
    groups.set(label, current);
  }

  return labels.flatMap((label) => {
    const grouped = groups.get(label);
    return grouped?.length ? [{ label, projects: grouped }] : [];
  });
}
