import { generationForRunVersion, isActive } from '../domain/run.js';
import type { EventHub } from '../events.js';
import { FfmpegOutput } from '../live/output/ffmpeg.js';
import { SceneOptionGenerator } from '../providers/ai/scene-options.js';
import { VideoGenerator } from '../providers/ai/video.js';
import type { RunService } from '../services/run-service.js';
import { ApiError } from '../shared/errors.js';
import type { GeneratedScene, RunConfigInput, RunStartInput, StoredRun } from '../types.js';
import type { RuntimeState } from './state.js';

export class RunManager {
  private readonly controllers = new Map<string, AbortController>();
  private readonly outputs = new Map<string, FfmpegOutput>();
  private readonly wakeups = new Map<string, () => void>();

  constructor(
    private readonly state: RuntimeState,
    private readonly runs: RunService,
    private readonly events: EventHub,
    private readonly generator = new VideoGenerator(),
    private readonly optionGenerator = new SceneOptionGenerator(),
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
    this.launch(worldId, prepared.run);
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

  stopActive() {
    const worldId = this.state.activeWorldId;
    const run = worldId ? this.runs.get(worldId) : null;
    if (!worldId || !run || !isActive(run)) return;
    this.stop(worldId);
  }

  restart(worldId: string) {
    const oldController = this.controllers.get(worldId);
    oldController?.abort();
    this.outputs.get(worldId)?.stop();
    this.outputs.delete(worldId);
    const prepared = this.runs.restart(worldId);
    this.launch(worldId, prepared.run);
    return prepared.run;
  }

  updateConfig(worldId: string, input: RunConfigInput) {
    const run = this.runs.updateConfig(worldId, input);
    this.events.publish({ type: 'run.status', run });
    return run;
  }

  choose(worldId: string, optionId: string, sceneId?: string) {
    const run = this.runs.choose(worldId, optionId, sceneId);
    if (run.state === 'preparing') {
      this.launch(worldId, run);
      return run;
    }
    this.wakeups.get(worldId)?.();
    this.events.publish({ type: 'run.status', run });
    return run;
  }

  activateScene(worldId: string, sceneId: string) {
    const run = this.runs.activateScene(worldId, sceneId);
    this.release(worldId);
    this.launch(worldId, run, false);
    return this.runs.get(worldId) ?? run;
  }

  deleteSceneBranch(worldId: string, sceneId: string) {
    const result = this.runs.deleteSceneBranch(worldId, sceneId);
    if (result.generationInterrupted) {
      this.release(worldId);
      this.launch(worldId, result.run, false);
    }
    const run = this.runs.get(worldId) ?? result.run;
    this.events.publish({
      type: 'scene.deleted',
      run,
      sceneIds: result.removedSceneIds,
    });
    return run;
  }

  deleteRunVersion(worldId: string, versionId: string) {
    const result = this.runs.deleteRunVersion(worldId, versionId);
    this.events.publish({
      type: 'version.deleted',
      run: result.run,
      versionId,
      sceneIds: result.removedSceneIds,
    });
    return result.run;
  }

  async regenerateSceneOptions(worldId: string, sceneId: string) {
    const context = this.runs.sceneOptionContext(worldId, sceneId);
    let titles: string[];
    try {
      titles = await this.optionGenerator.generate(context, this.state.provider);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'scene option generation failed';
      throw new ApiError(502, 'scene_option_generation_failed', message);
    }
    const run = this.runs.replaceSceneOptions(worldId, sceneId, titles);
    this.events.publish({ type: 'run.status', run });
    return run;
  }

  metrics(worldId: string) {
    return this.runs.metrics(worldId);
  }

  private launch(worldId: string, run: StoredRun, generateImmediately = true) {
    const controller = new AbortController();
    this.controllers.set(worldId, controller);
    this.events.publish({ type: 'run.status', run });
    void this.loop(worldId, controller.signal, generateImmediately).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'generation failed';
      const failedRun = this.runs.finish(worldId, message);
      this.events.publish({ type: 'run.error', run: failedRun, message });
    });
  }

  private async loop(worldId: string, signal: AbortSignal, generateImmediately: boolean) {
    let run = this.runs.markRunning(worldId);
    this.events.publish({ type: 'run.status', run });
    if (!generateImmediately) await this.waitForNextScene(worldId, signal);
    while (!signal.aborted) {
      const world = this.state.getWorld(worldId);
      const currentRun = this.state.getRun(worldId);
      if (!world || !currentRun || currentRun.state !== 'running') return;
      const generation = generationForRunVersion(currentRun, currentRun.id, world.generation);
      const context = this.runs.beginGeneration(worldId);
      const input = {
        world,
        run: context.run,
        generation,
        parentSceneId: context.parentSceneId,
        sourceOptionId: context.sourceOptionId,
        branchDirection: context.branchDirection,
      };
      const scene = await this.generator.generate(input, this.state.provider, signal);
      if (signal.aborted) return;
      if (input.parentSceneId && scene.sourceContinuityImageUrl) {
        this.runs.setSceneContinuityImage(
          worldId,
          input.parentSceneId,
          scene.sourceContinuityImageUrl,
        );
      }
      const appended = this.runs.append(
        worldId,
        scene,
        generation,
        input.parentSceneId
          ? { sceneId: input.parentSceneId, optionId: input.sourceOptionId }
          : null,
      );
      run = appended.run;
      this.events.publish({ type: 'scene.ready', run, scene: appended.scene });
      this.maybeStartOutput(worldId, run, scene);
      if (this.runs.hasPendingBranch(worldId)) continue;
      await this.waitForNextScene(worldId, signal);
    }
  }

  private waitForNextScene(worldId: string, signal: AbortSignal) {
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', finish);
        if (this.wakeups.get(worldId) === finish) this.wakeups.delete(worldId);
        resolve();
      };
      this.wakeups.set(worldId, finish);
      signal.addEventListener('abort', finish, { once: true });
    });
  }

  private release(worldId: string) {
    this.controllers.get(worldId)?.abort();
    this.controllers.delete(worldId);
    this.outputs.get(worldId)?.stop();
    this.outputs.delete(worldId);
  }

  private maybeStartOutput(worldId: string, run: StoredRun, scene: GeneratedScene) {
    const output = run.outputSettings;
    if (output?.mode !== 'rtmp' || scene.mediaType !== 'video') return;
    const manager = this.outputs.get(worldId) ?? new FfmpegOutput();
    manager.start(output, scene.previewUrl);
    this.outputs.set(worldId, manager);
  }
}
