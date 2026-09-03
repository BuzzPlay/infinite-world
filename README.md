<div align="center">

# Infinite World

**An open-source system for using multimodal AI to understand, simulate, and interact with virtual worlds.**

**Set a world in motion. Shape what happens next. Explore where it leads.**

[Documentation](docs/README.md) · [Product](docs/product/README.md) · [Architecture](docs/architecture/README.md) · [Roadmap](#roadmap) · [Contributing](#contributing)

[简体中文](README.zh-CN.md)

</div>

---

Infinite World is an open-source project for using multimodal AI to understand and simulate worlds, then influence how they change through interaction. Text, images, video, audio, and external events can become inputs. The world turns them into state, rules, and possible next actions.

Each world keeps its scenes, choices, state changes, and branches as it runs. People can explore it locally, affect what happens, and share the resulting experience.

## Why Infinite World

Infinite World brings multimodal AI into a continuous world loop:

- **Understand.** Read the world through text, images, video, audio, and events.
- **Simulate.** Maintain state, rules, context, and history as the world changes.
- **Interact.** Let people and external events influence what happens next.
- **Explore.** Use the same world to try new interactions, play patterns, and branches.
- **Improve.** Keep the process and its records available for better models and better worlds.

## The Core Model

```text
Multimodal inputs and interaction
        |
        v
World understanding
        |
        v
World state and simulation ----> Scenes, branches, and history
        |
        +----> New observations and data
        |
        +----> Local preview and future outputs
```

An Infinite World connects seven ideas:

| Concept | Meaning |
| --- | --- |
| **World** | A persistent setting with its own rules, context, and state. |
| **Scene** | A generated moment rendered from the current world state. |
| **Interaction** | A choice, event, or input that can change the world. |
| **Branch** | A new possible continuation created by an option or event. |
| **History** | The recorded state, scenes, choices, and paths of a world. |
| **Output** | A way to share or observe a branch, such as a channel, export, or interactive view. |
| **Preview** | A local view for testing and shaping a world before sharing it. |

## Roadmap

- [x] Create interactive worlds shaped by text-based choices.
- [x] Run worlds continuously with local preview and live output.
- [ ] Connect more live platforms.
- [ ] Add more interaction inputs.
- [ ] Explore new interaction formats and game forms.

See the [Product Roadmap](docs/product/roadmap.md) for details.

## Why Open Source

Understanding and simulating the physical world still requires more experiments, and better models need more continuous, feedback-rich data. Games are a central direction for this exploration: new game forms and interaction content can reveal new ways for people and agents to engage with changing worlds. The same world systems may also serve as a brain for embodied intelligence, helping it understand the world, simulate change, and decide what to do next. Open source makes these experiments easier to inspect, share, reproduce, and extend.

- **More game forms.** Contributors can explore games built around persistent worlds, evolving rules, and meaningful choices.
- **More interaction content.** New controls, events, and forms of participation can change how people and agents enter a world.
- **Embodied intelligence.** A persistent world model can help embodied agents understand context, simulate consequences, and choose actions.
- **More use cases.** The same foundation can evolve for creative tools, research, and other applications.
- **More useful records.** Running worlds produce data about state changes, choices, branches, and feedback. With user permission and control over the data, those records can support training and evaluating better models.
- **Replaceable building blocks.** Models, renderers, encoders, and output providers can evolve independently.
- **Shared progress.** Experiments and working tools can be reused instead of rebuilt in isolation.

The project favors clear boundaries, portable data, and small composable pieces so worlds can keep changing as new ideas emerge.

## Start Locally

Install the workspace dependencies:

```bash
pnpm install
```

Start the API in one terminal:

```bash
pnpm dev:api
```

Start the Web application in another terminal:

```bash
pnpm dev:web
```

Open [http://localhost:5173](http://localhost:5173). The local workflow uses the built-in demo generator, so no provider key is required for the first run.

The Web app uses the local API at `http://127.0.0.1:4000` during development. Set `NEXT_PUBLIC_API_URL` when the Web app and API are served from different origins.

Hosted generation is optional. Set `FAL_API_KEY` (or `FAL_KEY`) before starting the API, then select a hosted model in the Web console. `fal-ltx-video` generates from text; `fal-ltx-2.3` requires an initial image URL. Provider keys stay in the local API process.

## Contributing

Start with the [Agent Guide](AGENTS.md) and the relevant document category before changing a boundary. Keep product behavior in the README or `docs/product/`, technical rationale in `docs/decisions/`, and chronological progress in `docs/development-log.md`.

Issues, experiments, documentation improvements, and implementation contributions are welcome as the project takes shape.

## Reference

- [infinite-tv](https://github.com/alex-remade/infinite-tv)
