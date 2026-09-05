import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`Could not read ${path}.`, error);
    }
    return null;
  }
}

export function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
  try {
    chmodSync(temporary, 0o600);
  } catch {
    // File permissions are best effort on platforms without POSIX modes.
  }
  renameSync(temporary, path);
  try {
    chmodSync(path, 0o600);
  } catch {
    // File permissions are best effort on platforms without POSIX modes.
  }
}
