import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { config } from '../config.js';
import { ApiError } from '../shared/errors.js';

const execFileAsync = promisify(execFile);
const MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin?download=true';

export interface TranscriptionServiceOptions {
  binary?: string;
  modelPath?: string;
  ffmpegBinary?: string;
}

export class TranscriptionService {
  private readonly binary: string;
  private readonly modelPath: string;
  private readonly ffmpegBinary: string;
  private modelPromise: Promise<void> | null = null;

  constructor(options: TranscriptionServiceOptions = {}) {
    this.binary = options.binary ?? config.whisperBinary;
    this.modelPath =
      options.modelPath ??
      config.whisperModelPath ??
      join(config.dataDir, 'models', 'ggml-base.bin');
    this.ffmpegBinary = options.ffmpegBinary ?? config.ffmpegBinary;
  }

  async transcribe(audio: Buffer, language: 'zh' | 'en'): Promise<string> {
    if (!audio.length) {
      throw new ApiError(400, 'empty_audio', 'The recorded audio is empty.');
    }
    await this.ensureModel();
    const workDir = await mkdtemp(join(tmpdir(), 'infinite-world-transcription-'));
    const inputPath = join(workDir, 'input.webm');
    const wavPath = join(workDir, 'input.wav');
    const outputBase = join(workDir, 'transcript');

    try {
      await writeFile(inputPath, audio);
      await execFileAsync(this.ffmpegBinary, [
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        inputPath,
        '-ar',
        '16000',
        '-ac',
        '1',
        '-c:a',
        'pcm_s16le',
        '-y',
        wavPath,
      ]);

      await execFileAsync(this.binary, [
        '-m',
        this.modelPath,
        '-f',
        wavPath,
        '-l',
        language,
        '-nt',
        '-otxt',
        '-of',
        outputBase,
        '-np',
      ]);

      return (await readFile(`${outputBase}.txt`, 'utf8')).trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transcription failed';
      if (message.includes('ENOENT')) {
        throw new ApiError(
          503,
          'transcription_unavailable',
          'Local transcription is unavailable. Install whisper.cpp and ffmpeg, then restart the API.',
        );
      }
      throw new ApiError(502, 'transcription_failed', 'The local audio transcription failed.');
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private async ensureModel() {
    if (!this.modelPromise) {
      this.modelPromise = this.downloadModel();
    }
    return this.modelPromise;
  }

  private async downloadModel() {
    try {
      await readFile(this.modelPath);
      return;
    } catch {
      // The model is downloaded on first use and cached outside the repository.
    }

    await mkdir(dirname(this.modelPath), { recursive: true });
    const response = await fetch(MODEL_URL);
    if (!response.ok || !response.body) {
      throw new ApiError(
        503,
        'transcription_model_unavailable',
        'The transcription model could not be downloaded.',
      );
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(this.modelPath, buffer);
  }
}
