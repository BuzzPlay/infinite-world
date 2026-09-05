import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const assets = [
  ['../node_modules/emojibase-data/en/data.json', '../public/emojibase/en/data.json'],
  ['../node_modules/emojibase-data/en/messages.json', '../public/emojibase/en/messages.json'],
];

for (const [source, target] of assets) {
  const sourcePath = resolve(root, source);
  const targetPath = resolve(root, target);
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}
