<div align="center">

<img src="apps/web/public/logo.svg" alt="Infinite World 标志" width="88" />

# Infinite World

**基于多模态 LLM 构建可交互、持续变化的世界。**

理解世界，模拟它如何变化，再通过交互影响接下来发生的事情。

[快速开始](#快速开始) · [文档](docs/README.md) · [架构](docs/architecture/README.md) · [路线图](#路线图) · [参与贡献](#参与贡献)

[English](README.md) · ⭐ 感兴趣的话，欢迎 Star，关注后续进展。

</div>

> [!NOTE]
> 早期开发阶段——API 和本地存储格式可能变化。

<p align="center">
  <strong>演示：</strong> 当前原型演示。
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/2af88467-0e25-4529-916e-d576ecb59291" controls muted playsinline width="640"></video>
</p>

## Infinite World 是什么？

Infinite World 将多模态理解、世界模拟和交互连接成一个持续运行的循环：

- **理解：** 读取提示词、图片和已生成的场景上下文。
- **模拟：** 将输入转化为世界状态、规则和可能的下一步行动。
- **交互：** 让人、智能体和事件影响接下来发生的事情。
- **持续运行：** 记录世界运行中的场景、选择、状态变化和分支。

## 为什么构建 Infinite World？

更快的模型推理，正在让可交互、持续变化的世界变得更可行。

Infinite World 将多模态理解、世界状态和交互连接起来，让人和智能体共同影响接下来发生的事情。

目前的多模态生成仍以单段内容为主。Infinite World 将理解、模拟和交互连接起来，让世界持续运行。

持续运行的世界可以承载新的游戏形态和互动内容，让人和智能体共同影响世界的变化。同一套系统也可以继续探索具身智能，帮助智能体理解上下文、模拟可能的结果并决定下一步行动。

Infinite World 选择开源，希望更多开发者、创作者和研究者一起参与：接入新的模型、输入、交互和输出，创造新的世界，并分享各自的探索。

## 当前进展

| 方向 | 当前进展 |
| --- | --- |
| 文字交互 | 通过文字输入和选项影响世界状态与后续场景，现已可用 |
| 语音交互 | 使用语音输入影响世界，现已可用 |
| 图片交互 | 在场景最后画面中选择可交互区域，决定接下来的发展，现已可用 |
| 连续世界 | 跨场景和剧情分支保留世界状态与上下文，现已可用 |
| 本地预览与回放 | 在本地运行世界、回看保存的分支，并播放已缓存的生成视频，现已可用 |
| 直播 | 直播互动功能开发中 |
| 更多交互 | 聊天、声音、鼠标和键盘输入，计划中 |

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 10+
- FFmpeg（语音识别和直播输出使用）
- whisper.cpp CLI（`whisper-cli`）

克隆仓库并安装 workspace 依赖：

```bash
git clone https://github.com/BuzzPlay/infinite-world.git
cd infinite-world
pnpm install
```

请根据当前平台安装 whisper.cpp 和 FFmpeg。例如 macOS 可以使用 Homebrew：

```bash
brew install whisper-cpp ffmpeg
```

Linux 可以使用发行版的包管理器安装或自行构建 `whisper.cpp` CLI 和 FFmpeg。Windows 可以
下载或构建对应的 CLI，并将所在目录加入 `PATH`。

API 构建时会自动准备 `ggml-base` Whisper 模型，并将模型缓存到仓库之外。第一次构建或第一次
使用语音输入时需要网络连接。若 `whisper-cli` 已经在 `PATH` 中，
`INFINITE_WORLD_WHISPER_BIN` 不需要填写；只有 CLI 使用自定义名称或路径时才需要设置。
`INFINITE_WORLD_WHISPER_MODEL` 同样是可选项，仅在使用自定义模型路径时设置。

分别在两个终端启动 API 和 Web 应用：

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

打开 [http://localhost:5173](http://localhost:5173)。

## 工作方式

```text
提示词、图片与交互
        |
        v
      世界理解
        |
        v
持续状态与上下文 --------> 场景生成 --------> 预览 / 输出
        ^                     |
        |                     v
        +--------------- 历史与反馈
```

运行时拆分为七个概念：

| 概念 | 含义 |
| --- | --- |
| **World 世界** | 拥有自身规则、上下文和状态的持续性环境。 |
| **Scene 场景** | 根据当前世界状态生成的一个时刻。 |
| **Interaction 交互** | 可能改变世界的选择、事件或输入。 |
| **Branch 分支** | 由选项或事件产生的一种可能延续。 |
| **History 历史** | 世界状态、场景、选择和路径的运行记录。 |
| **Output 输出** | 观察或分享运行过程的方式，例如本地预览或 RTMP 直播。 |
| **Preview 预览** | 在分享世界前，用于本地运行和塑造世界的界面。 |
| **Replay 回放** | 回看一个世界中已保存场景和选择路径的方式。 |

运行时边界、生命周期和 API 协议请参阅[架构文档](docs/architecture/README.md)。

## 探索方向

以下视频展示计划中的交互方向，当前实现状态见表格。

| 方向 | 概念视频 | 状态 |
| --- | --- | --- |
| **图文输入** | <video src="https://github.com/user-attachments/assets/9c5637d7-d2ab-41da-818a-b4fd6f896a19" controls muted playsinline width="320"></video> | 已可用 |
| **语音交互** | <video src="https://github.com/user-attachments/assets/61d4f497-0a35-49f9-97e8-6941d47ec550" controls muted playsinline width="320"></video> | 已可用 |
| **鼠标与键盘输入** | <video src="https://github.com/user-attachments/assets/57936a0b-08b9-43d8-b75d-f72d765a2ec1" controls muted playsinline width="320"></video> | 计划中 |
| **直播输出** | <video src="https://github.com/user-attachments/assets/658ca16c-d999-4118-8526-d6d23d470436" controls muted playsinline width="320"></video> | 开发中 |
| **多模态交互** | <video src="https://github.com/user-attachments/assets/da0b08ab-a04b-46d0-8f4b-65e7204cc9bc" controls muted playsinline width="320"></video> | 计划中 |

## 正在探索

- 如何让生成场景在时间上保持身份、状态和因果连续性？
- 文本、媒体、参与者和外部事件应如何更新共享世界状态？
- 怎样的边界能让模型、渲染器、输入和输出保持可替换？
- 如何评估持续世界，同时让生成记录仍由用户控制？
- 当生成世界持续运行时，会产生哪些新的游戏和交互形式？

## 路线图

- [x] 创建由文字、语音和图片交互推动的世界。
- [ ] 持续完善本地预览、回放与直播输出。（开发中）
- [ ] 支持更多直播平台。
- [ ] 支持更多交互输入。
- [ ] 探索新的交互方式和游戏形态。

各阶段和验收标准请参阅[产品路线图](docs/product/roadmap.md)。

## 参与贡献

可以从这些方向参与：

- 可复现的世界示例和生成预设；
- 模型服务、输入、预览与输出适配器；
- 连续性评估和失败案例；
- 文档、平台测试和交互实验。

提交 Pull Request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。影响项目边界的修改还应遵循 [Agent Guide](AGENTS.md)。

欢迎在 [GitHub Discussions](https://github.com/BuzzPlay/infinite-world/discussions) 中交流问题和实验。Bug 与范围明确的建议可以提交到 [GitHub Issues](https://github.com/BuzzPlay/infinite-world/issues)。

## 参考项目

- [infinite-tv](https://github.com/alex-remade/infinite-tv)
- [fal.live](https://fal.live/)
- [H3 World Action Demo](https://huggingface.co/spaces/hugging-apps/h3-world-action-demo)
- [Odin Lovis](https://x.com/OdinLovis/status/2095644474055782725)
- [Diiverge](https://www.diiverge.co/)
- [Code World Model](https://github.com/buaacyw/code-world-model)

## 开源协议

Infinite World 使用 [Apache License 2.0](LICENSE)。
