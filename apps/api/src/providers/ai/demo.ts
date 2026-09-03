import type { GenerationInput, GeneratedScene } from '../../types.js';

export class DemoGenerator {
  async generate(input: GenerationInput): Promise<GeneratedScene> {
    const started = performance.now();
    const direction = input.branchDirection ? ` Direction: ${input.branchDirection}.` : '';
    const prompt = `Continue ${input.world.prompt}.${direction}`;
    const summary = `Scene ${input.run.scenes.length + 1} continues the world narrative.`;
    const hue = (input.run.scenes.length * 47 + 196) % 360;
    const previewUrl = svgDataUrl({
      width: input.generation.width,
      height: input.generation.height,
      hue,
      title: input.world.name,
      subtitle: `Scene ${input.run.scenes.length + 1}`,
      prompt,
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      prompt,
      contextSummary: summary,
      previewUrl,
      mediaType: 'image',
      continuityImageUrl: previewUrl,
      generationLatencyMs: Math.max(1, Math.round(performance.now() - started)),
    };
  }
}

function svgDataUrl(values: {
  width: number;
  height: number;
  hue: number;
  title: string;
  subtitle: string;
  prompt: string;
}) {
  const title = escapeXml(values.title);
  const subtitle = escapeXml(values.subtitle);
  const prompt = escapeXml(values.prompt.slice(0, 130));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${values.width}" height="${values.height}" viewBox="0 0 ${values.width} ${values.height}"><rect width="100%" height="100%" fill="hsl(${values.hue} 18% 94%)"/><circle cx="${values.width * 0.72}" cy="${values.height * 0.38}" r="${Math.min(values.width, values.height) * 0.18}" fill="hsl(${values.hue} 45% 78%)"/><path d="M0 ${values.height * 0.75} Q ${values.width * 0.3} ${values.height * 0.54}, ${values.width * 0.52} ${values.height * 0.74} T ${values.width} ${values.height * 0.62} V ${values.height} H0Z" fill="hsl(${(values.hue + 45) % 360} 28% 72%)"/><text x="${values.width * 0.08}" y="${values.height * 0.16}" font-family="Arial, sans-serif" font-size="${Math.max(18, values.width / 28)}" fill="#202020">${title}</text><text x="${values.width * 0.08}" y="${values.height * 0.24}" font-family="Arial, sans-serif" font-size="${Math.max(12, values.width / 48)}" fill="#4d4d4d">${subtitle}</text><text x="${values.width * 0.08}" y="${values.height * 0.9}" font-family="Arial, sans-serif" font-size="${Math.max(10, values.width / 64)}" fill="#4d4d4d">${prompt}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ??
      character,
  );
}
