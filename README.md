<div align="center">

<img src="apps/web/public/logo.svg" alt="Infinite World logo" width="88" />

# Infinite World

**Build interactive worlds that keep evolving with multimodal LLMs.**

Understand a world, simulate how it changes, and interact with what happens next.

[Quick Start](#quick-start) · [Documentation](docs/README.md) · [Architecture](docs/architecture/README.md) · [Roadmap](#roadmap) · [Contributing](#contributing)

[简体中文](README.zh-CN.md) · ⭐ Star the repository to follow its progress.

</div>

> [!NOTE]
> Early development — APIs and stored data may change.

## What Is Infinite World?

Infinite World combines multimodal understanding, world simulation, and interaction in one continuous loop:

- **Understand.** Read text, images, video, audio, and external events.
- **Simulate.** Turn those inputs into world state, rules, and possible next actions.
- **Interact.** Let people, agents, and events influence what happens next.
- **Continue.** Record scenes, choices, state changes, and branches as the world runs.

## Why Build It?

[fal.ai](https://fal.ai/)'s work on H3 inference optimization showed us a possibility: use frontier LLMs and multimodal models to build interactive content where people can shape a world as it changes. Infinite World starts there.

Most multimodal generation still produces isolated pieces of content. Infinite World connects understanding, simulation, and interaction in a world that keeps running.

A continuously running world can support new forms of games and interactive content, with people and agents shaping the same evolving environment. The same system may also help embodied agents understand context, simulate possible outcomes, and decide what to do next.

Infinite World is open source so developers, creators, and researchers can build it together: add models, inputs, interactions, and outputs; create new worlds; and share what they learn.

## Current Progress

| Direction | Progress |
| --- | --- |
| Text interaction | Use text input and choices to influence the world state and upcoming scenes. In development. |
| Continuous worlds | Preserve world state and context across scenes. Continuous generation is being improved. |
| Local preview | Configure worlds, run them locally, and inspect history and metrics. Prototype available. |
| Live output | Continuous RTMP output through FFmpeg is in development. |
| More interactions | Chat, audio, mouse, and keyboard input are planned. |

## Quick Start

### Requirements

- Node.js 20+
- pnpm 10+
- FFmpeg on `PATH` only when using RTMP output

Clone the repository and install the workspace dependencies:

```bash
git clone https://github.com/BuzzPlay/infinite-world.git
cd infinite-world
pnpm install
```

Start the API and Web application in separate terminals:

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

Open [http://localhost:5173](http://localhost:5173).

## How It Works

```text
Prompt, image, and interaction
              |
              v
      World understanding
              |
              v
Persistent state and context ----> Scene generation ----> Preview / output
              ^                           |
              |                           v
              +---------------- History and feedback
```

The runtime separates seven concepts:

| Concept | Meaning |
| --- | --- |
| **World** | A persistent setting with its own rules, context, and state. |
| **Scene** | A generated moment produced from the current world state. |
| **Interaction** | A choice, event, or input that may change the world. |
| **Branch** | A possible continuation created by an option or event. |
| **History** | The recorded states, scenes, choices, and paths of a world. |
| **Output** | A way to observe or share a run, such as a preview or RTMP stream. |
| **Preview** | A local surface for testing and shaping a world before sharing it. |

See the [architecture documentation](docs/architecture/README.md) for runtime boundaries, lifecycle, and API contracts.

## Exploration Directions

These clips show the interaction directions. Current implementation status is listed below.

| Direction | Concept video | Status |
| --- | --- | --- |
| **Text and image** | <video src="https://github.com/user-attachments/assets/9c5637d7-d2ab-41da-818a-b4fd6f896a19" controls muted playsinline width="320"></video> | In development |
| **Sound** | <video src="https://github.com/user-attachments/assets/61d4f497-0a35-49f9-97e8-6941d47ec550" controls muted playsinline width="320"></video> | Planned |
| **Mouse and keyboard** | <video src="https://github.com/user-attachments/assets/57936a0b-08b9-43d8-b75d-f72d765a2ec1" controls muted playsinline width="320"></video> | Planned |
| **Live output** | <video src="https://github.com/user-attachments/assets/658ca16c-d999-4118-8526-d6d23d470436" controls muted playsinline width="320"></video> | In development |
| **Multimodal interaction** | <video src="https://github.com/user-attachments/assets/da0b08ab-a04b-46d0-8f4b-65e7204cc9bc" controls muted playsinline width="320"></video> | Planned |

## What We Are Exploring

- How can generated scenes retain identity, state, and causal continuity over time?
- How should text, media, people, and external events update a shared world state?
- Which boundaries let models, renderers, inputs, and outputs remain replaceable?
- How can persistent worlds be evaluated while keeping generated records under user control?
- What new game and interaction formats become possible when a generated world keeps running?

## Roadmap

- [ ] Create interactive worlds shaped by text-based choices. *(In development)*
- [ ] Run worlds continuously with local preview and live output. *(In development)*
- [ ] Connect more live platforms.
- [ ] Add more interaction inputs.
- [ ] Explore new interaction formats and game forms.

See the [Product Roadmap](docs/product/roadmap.md) for detailed stages and acceptance criteria.

## Contributing

Ways to contribute:

- reproducible world examples and generation presets;
- provider, input, preview, and output adapters;
- continuity evaluation and failure cases;
- documentation, platform testing, and interaction experiments.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Changes that affect project boundaries should also follow the [Agent Guide](AGENTS.md).

Questions and experiments are welcome in [GitHub Discussions](https://github.com/BuzzPlay/infinite-world/discussions). Bugs and scoped proposals can be opened as [GitHub Issues](https://github.com/BuzzPlay/infinite-world/issues).

## References

- [infinite-tv](https://github.com/alex-remade/infinite-tv)
- [fal.live](https://fal.live/)
- [H3 World Action Demo](https://huggingface.co/spaces/hugging-apps/h3-world-action-demo)
- [Odin Lovis](https://x.com/OdinLovis/status/2095644474055782725)
- [Diiverge](https://www.diiverge.co/)
- [Code World Model](https://github.com/buaacyw/code-world-model)

## License

Infinite World is licensed under the [Apache License 2.0](LICENSE).
