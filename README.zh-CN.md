<div align="center">

# Infinite World

**一个通过多模态 AI 理解、模拟和交互虚拟世界的开源系统。**

**让世界开始运行，影响接下来的变化，探索它会走向哪里。**

[文档](docs/README.md) · [产品](docs/product/README.md) · [架构](docs/architecture/README.md) · [路线图](#路线图) · [参与贡献](#参与贡献)

[English](README.md)

</div>

---

Infinite World 是一个开源项目，希望通过多模态 AI 理解和模拟世界，再通过交互影响世界的变化。文本、图片、视频、声音和外部事件都可以成为输入，世界会将这些输入转化为状态、规则和后续行动。

[FAL](http://fal.ai/) 对 H3 推理效率的优化，让我们看到了一种更有趣的可能：用前沿 LLM 和多模态 AI 构建可以持续发展的互动内容系统，让人们参与塑造变化中的世界，并探索更多交互方式。Infinite World 希望从这里开始，持续探索这个方向。

世界运行过程中会保留场景、选择、状态变化和分支。人们可以在本地探索世界，影响接下来发生的事情，并分享由此产生的体验。

## 为什么是 Infinite World

Infinite World 希望把多模态 AI 放进一个持续运行的世界循环中：

- **理解。** 读取文本、图片、视频、声音和事件中的世界信息。
- **模拟。** 在世界变化时持续维护状态、规则、上下文和历史。
- **交互。** 让人和外部事件影响接下来发生的事情。
- **探索。** 在同一个世界中尝试新的交互方式、游戏形态和分支。
- **改进。** 保留运行过程和相关记录，为更好的模型和世界提供基础。

## 核心模型

```text
多模态输入与交互
    |
    v
世界理解
    |
    v
世界状态与模拟 --------> 场景、分支与历史
    |
    +--------> 新的观察和数据
    |
    +--------> 本地预览和未来的输出方式
```

Infinite World 由七个相互连接的概念组成：

| 概念 | 含义 |
| --- | --- |
| **World 世界** | 拥有自身规则、上下文和状态的持续性环境。 |
| **Scene 场景** | 根据当前世界状态生成的一个时刻。 |
| **Interaction 交互** | 可以改变世界的选择、事件或输入。 |
| **Branch 分支** | 由选项或事件产生的一种新的可能延续。 |
| **History 历史** | 世界状态、场景、选择和路径的运行记录。 |
| **Output 输出** | 分享或观察某个分支的方式，例如频道、导出文件或交互式视图。 |
| **Preview 预览** | 在分享世界之前，用于本地测试和塑造世界的视图。 |

## 使用场景

| 场景 | 视频 |
| --- | --- |
| **Text and image 图文**<br><sub>开发中</sub> | <video src="https://github.com/user-attachments/assets/9c5637d7-d2ab-41da-818a-b4fd6f896a19" controls muted playsinline width="320"></video> |
| **Sound 声音**<br><sub>未开始</sub> | <video src="https://github.com/user-attachments/assets/61d4f497-0a35-49f9-97e8-6941d47ec550" controls muted playsinline width="320"></video> |
| **Mouse and keyboard 鼠标和键盘**<br><sub>未开始</sub> | <video src="https://github.com/user-attachments/assets/57936a0b-08b9-43d8-b75d-f72d765a2ec1" controls muted playsinline width="320"></video> |
| **Live output 直播输出**<br><sub>开发中</sub> | <video src="https://github.com/user-attachments/assets/658ca16c-d999-4118-8526-d6d23d470436" controls muted playsinline width="320"></video> |
| **Multimodal 多模态**<br><sub>未开始</sub> | <video src="https://github.com/user-attachments/assets/da0b08ab-a04b-46d0-8f4b-65e7204cc9bc" controls muted playsinline width="320"></video> |

## 路线图

- [x] 创建由文字选项推动的交互世界。
- [x] 持续运行世界，支持本地预览和直播输出。
- [ ] 支持更多直播平台。
- [ ] 支持更多交互输入。
- [ ] 探索新的交互方式和游戏形态。

详细内容见[产品路线图](docs/product/roadmap.md)。

## 为什么开源

对现实世界的理解和模拟需要持续实验，更好的模型也需要更多连续且有反馈的数据。游戏是重要的探索方向：未来可以通过新的游戏形态和交互内容，尝试人和智能体如何参与一个持续变化的世界。相同的世界系统也可以成为具身智能的大脑，帮助它理解世界、模拟变化并决定下一步行动。开源可以让这些实验更容易被检查、分享、复现和继续发展。

- **更多游戏形态。** 贡献者可以探索围绕持续世界、变化规则和重要选择展开的游戏。
- **更多交互内容。** 新的控制、事件和参与方式可以改变人和智能体进入世界的方式。
- **具身智能。** 持续的世界模型可以帮助具身智能理解上下文、模拟结果并选择行动。
- **更多使用场景。** 相同的基础可以延伸到创作工具、研究和其他应用。
- **更多可用记录。** 世界运行会产生状态变化、选择、分支和反馈数据。在用户同意并能控制数据的前提下，这些记录可以用于训练和评估更好的模型。
- **可替换的基础模块。** 模型、渲染器、编码器和输出服务可以独立演进。
- **共享进展。** 实验结果和可用工具可以被复用，减少重复建设。

项目重视清晰的边界、可迁移的数据和小型可组合模块，让世界可以随着新的想法继续变化。

## 本地启动

先安装 workspace 依赖：

```bash
pnpm install
```

在一个终端启动 API：

```bash
pnpm dev:api
```

在另一个终端启动 Web 应用：

```bash
pnpm dev:web
```

打开[http://localhost:5173](http://localhost:5173)。选择托管模型前，请先在 Settings 中配置对应的服务密钥。没有配置密钥时，对应能力会保持为 `none`。

开发环境下 Web 应用默认连接 `http://127.0.0.1:4000` 的 API。Web 和 API 使用不同域名或端口部署时，设置 `NEXT_PUBLIC_API_URL`。

## 参与贡献

修改项目边界前，请先阅读 [Agent 指南](AGENTS.md) 和对应的文档分类。产品行为写入 README 或 `docs/product/`，技术理由写入 `docs/decisions/`，时间线记录写入 `docs/development-log.md`。

欢迎提交问题、实验、文档改进和代码贡献，一起推动项目逐步成形。

## 参考

- [infinite-tv](https://github.com/alex-remade/infinite-tv)
- [fal.live](https://fal.live/)
- [H3 World Action Demo](https://huggingface.co/spaces/hugging-apps/h3-world-action-demo)
- [Odin Lovis](https://x.com/OdinLovis/status/2095644474055782725)
- [Diiverge](https://www.diiverge.co/)
- [Code World Model](https://github.com/buaacyw/code-world-model)
