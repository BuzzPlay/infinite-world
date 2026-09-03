import type { EventHub } from '../events.js';
import { FfmpegOutput } from '../live/output/ffmpeg.js';
import { VideoGenerator } from '../providers/ai/video.js';
import type { RunService } from '../services/run-service.js';
import { ApiError } from '../shared/errors.js';
import type { GeneratedScene, RunConfigInput, RunStartInput, StoredRun } from '../types.js';
import type { RuntimeState } from './state.js';

export class RunManager {
  private readonly controllers = new Map<string, AbortController>();
  private readonly outputs = new Map<string, FfmpegOutput>();

  constructor(
    private readonly state: RuntimeState,
    private readonly runs: RunService,
    private readonly events: EventHub,
    private readonly generator = new VideoGenerator(),
  ) {}

  start(worldId: string, input: RunStartInput) {
    const output =
      input.output ??
      (input.outputMode === 'webrtc'
        ? {
            mode: 'webrtc' as const,
            platform: 'custom' as const,
            endpoint: '',
            streamKey: '',
            title: '',
          }
        : null);
    if (output?.mode === 'rtmp' && !output.streamKey.trim())
      throw new ApiError(400, 'missing_stream_key', 'streamKey is required for RTMP output');
    const prepared = this.runs.prepare(worldId, input, output);
    const controller = new AbortController();
    this.controllers.set(worldId, controller);
    this.events.publish({ type: 'run.status', run: prepared.run });
    void this.loop(worldId, controller.signal).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'generation failed';
      const run = this.runs.finish(worldId, message);
      this.events.publish({ type: 'run.error', run, message });
    });
    return prepared.run;
  }

  stop(worldId: string) {
    const run = this.runs.stop(worldId);
    const controller = this.controllers.get(worldId);
    controller?.abort();
    this.controllers.delete(worldId);
    this.outputs.get(worldId)?.stop();
    this.outputs.delete(worldId);
    if (run.state === 'stopping') {
      const finished = this.runs.finish(worldId);
      this.events.publish({ type: 'run.status', run: finished });
      return finished;
    }
    this.events.publish({ type: 'run.status', run });
    return run;
  }

  restart(worldId: string) {
    const oldController = this.controllers.get(worldId);
    oldController?.abort();
    this.outputs.get(worldId)?.stop();
    this.outputs.delete(worldId);
    const prepared = this.runs.restart(worldId);
    const controller = new AbortController();
    this.controllers.set(worldId, controller);
    this.events.publish({ type: 'run.status', run: prepared.run });
    void this.loop(worldId, controller.signal).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'generation failed';
      const run = this.runs.finish(worldId, message);
      this.events.publish({ type: 'run.error', run, message });
    });
    return prepared.run;
  }

  updateConfig(worldId: string, input: RunConfigInput) {
    const run = this.runs.updateConfig(worldId, input);
    this.events.publish({ type: 'run.status', run });
    return run;
  }

  choose(worldId: string, optionId: string) {
    const run = this.runs.choose(worldId, optionId);
    this.events.publish({ type: 'run.status', run });
    return run;
  }

  metrics(worldId: string) {
    return this.runs.metrics(worldId);
  }

  private async loop(worldId: string, signal: AbortSignal) {
    let run = this.runs.markRunning(worldId);
    this.events.publish({ type: 'run.status', run });
    while (!signal.aborted) {
      const world = this.state.getWorld(worldId);
      const currentRun = this.state.getRun(worldId);
      if (!world || !currentRun || currentRun.state !== 'running') return;
      const generation = world.generation;
      const input = {
        world,
        run: currentRun,
        generation,
        branchDirection: currentRun.pendingDirection ?? null,
      };
      const scene = await this.generator.generate(input, this.state.provider);
      if (signal.aborted) return;
      const appended = this.runs.append(worldId, scene, generation);
      run = appended.run;
      this.events.publish({ type: 'scene.ready', run, scene: appended.scene });
      this.maybeStartOutput(worldId, run, scene);
      await delay(Math.min(15_000, Math.max(3_000, generation.durationSeconds * 1_000)), signal);
    }
  }

  private maybeStartOutput(worldId: string, run: StoredRun, scene: GeneratedScene) {
    const output = run.outputSettings;
    if (output?.mode !== 'rtmp' || scene.mediaType !== 'video') return;
    const manager = this.outputs.get(worldId) ?? new FfmpegOutput();
    manager.start(output, scene.previewUrl);
    this.outputs.set(worldId, manager);
  }
}

function delay(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
