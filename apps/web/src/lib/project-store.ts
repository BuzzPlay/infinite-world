import type { ProjectRecord } from '../components/projects/project-types';

const PROJECTS_STORAGE_KEY = 'infinite-world.projects';
const PROJECTS_MIGRATION_KEY = 'infinite-world.projects.cleaned-v1';
const LEGACY_PROJECT_NAMES = new Set(['Aurora Valley', 'Nebula Studio']);

export function loadProjects(): ProjectRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(PROJECTS_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    const projects = deduplicateProjects(value.filter(isProjectRecord));
    if (window.localStorage.getItem(PROJECTS_MIGRATION_KEY) === null) {
      const cleanedProjects = projects.filter((project) => !LEGACY_PROJECT_NAMES.has(project.name));
      saveProjects(cleanedProjects);
      window.localStorage.setItem(PROJECTS_MIGRATION_KEY, '1');
      return cleanedProjects;
    }
    return projects;
  } catch {
    return [];
  }
}

export function saveProjects(projects: ProjectRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(deduplicateProjects(projects)));
}

export function deduplicateProjects(projects: ProjectRecord[]): ProjectRecord[] {
  const seenWorldIds = new Set<string>();
  const seenConfigs = new Set<string>();
  return projects.filter((project) => {
    const configKey = JSON.stringify([
      project.interactionType,
      project.name,
      project.prompt,
      project.generation,
    ]);
    if (seenWorldIds.has(project.worldId) || seenConfigs.has(configKey)) return false;
    seenWorldIds.add(project.worldId);
    seenConfigs.add(configKey);
    return true;
  });
}

function isProjectRecord(value: unknown): value is ProjectRecord {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<ProjectRecord>;
  return (
    typeof project.id === 'string' &&
    typeof project.worldId === 'string' &&
    project.interactionType === 'text' &&
    typeof project.name === 'string' &&
    typeof project.prompt === 'string' &&
    typeof project.generation === 'object' &&
    project.generation !== null &&
    typeof project.createdAt === 'string'
  );
}
