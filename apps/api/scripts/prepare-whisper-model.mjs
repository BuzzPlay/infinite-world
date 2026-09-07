import { access, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const modelUrl =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin?download=true';
const dataDir =
  process.env.INFINITE_WORLD_DATA_DIR?.trim() ||
  join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'infinite-world');
const modelPath =
  process.env.INFINITE_WORLD_WHISPER_MODEL?.trim() || join(dataDir, 'models', 'ggml-base.bin');

if (process.env.INFINITE_WORLD_SKIP_WHISPER_DOWNLOAD === '1') {
  process.exit(0);
}

try {
  await access(modelPath);
  console.log(`Whisper model is ready: ${modelPath}`);
  process.exit(0);
} catch {
  // Download below.
}

await mkdir(dirname(modelPath), { recursive: true });
console.log(`Downloading Whisper model for ${process.platform}/${process.arch}...`);
const response = await fetch(modelUrl);
if (!response.ok) {
  throw new Error(`Could not download Whisper model: ${response.status} ${response.statusText}`);
}
await writeFile(modelPath, Buffer.from(await response.arrayBuffer()));
console.log(`Whisper model is ready: ${modelPath}`);
