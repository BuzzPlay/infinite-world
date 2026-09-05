import type { RunVersionSnapshot, SceneSnapshot } from '@infinite-world/api-contract';

export interface SceneVersionSummary {
  id: string;
  number: number;
  firstScene: SceneSnapshot;
  latestScene: SceneSnapshot;
  sceneCount: number;
  lastActivityAt: string;
}

export function sceneVersionSummaries(
  scenes: SceneSnapshot[],
  versions: RunVersionSnapshot[] = [],
): SceneVersionSummary[] {
  const metadata = new Map(versions.map((version) => [version.id, version]));
  const summaries = new Map<string, SceneVersionSummary>();

  for (const scene of scenes) {
    const current = summaries.get(scene.versionId);
    if (!current) {
      summaries.set(scene.versionId, {
        id: scene.versionId,
        number: scene.version,
        firstScene: scene,
        latestScene: scene,
        sceneCount: 1,
        lastActivityAt: metadata.get(scene.versionId)?.lastActivityAt ?? scene.generatedAt,
      });
      continue;
    }

    current.sceneCount += 1;
    if (scene.versionSceneSequence < current.firstScene.versionSceneSequence) {
      current.firstScene = scene;
    }
    if (scene.versionSceneSequence > current.latestScene.versionSceneSequence) {
      current.latestScene = scene;
    }
  }

  for (const summary of summaries.values()) {
    const version = metadata.get(summary.id);
    const latestScene = version?.latestSceneId
      ? scenes.find((scene) => scene.id === version.latestSceneId)
      : undefined;
    if (latestScene) summary.latestScene = latestScene;
    summary.lastActivityAt = latestScene
      ? (version?.lastActivityAt ?? latestScene.generatedAt)
      : summary.latestScene.generatedAt;
  }

  return [...summaries.values()].sort((left, right) => {
    const timeDifference = Date.parse(right.lastActivityAt) - Date.parse(left.lastActivityAt);
    return timeDifference || right.number - left.number;
  });
}
