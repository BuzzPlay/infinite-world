import { join } from 'node:path';

import type { VersionIndexEntry } from '../types.js';

export function rootStatePath(dataDir: string) {
  return join(dataDir, 'state.json');
}

export function mediaDirectory(dataDir: string) {
  return join(dataDir, 'media');
}

export function mediaAssetPath(dataDir: string, mediaId: string) {
  return join(mediaDirectory(dataDir), `${mediaId}.mp4`);
}

export function projectDirectory(dataDir: string, projectId: string) {
  return join(dataDir, 'projects', encodeURIComponent(projectId));
}

export function projectConfigPath(projectDir: string) {
  return join(projectDir, 'project.json');
}

export function projectStatePath(projectDir: string) {
  return join(projectDir, 'state.json');
}

export function versionDirectory(projectDir: string, version: Pick<VersionIndexEntry, 'version'>) {
  const number = String(version.version).padStart(4, '0');
  return join(projectDir, 'versions', number);
}

export function versionStatePath(projectDir: string, version: Pick<VersionIndexEntry, 'version'>) {
  return join(versionDirectory(projectDir, version), 'state.json');
}
