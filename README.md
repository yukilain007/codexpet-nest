# CodexPet Nest

[简体中文](#简体中文) | [English](#english)

---

<a name="简体中文"></a>

## 简体中文

CodexPet Nest 是 [codexpet.xyz](https://codexpet.xyz) 的 macOS 桌面伴侣应用。它在你的 Codex Desktop 宠物旁边显示一个透明悬浮小窝（nest overlay），内置时钟、倒计时、番茄钟等小组件。

### 重要声明

- CodexPet Nest 与 Codex / OpenAI 相互独立，除非将来有官方合作。
- **不会** 修改或注入 Codex Desktop 的 app bundle。
- **不会** 修改 Codex 的全局状态（global state）。读取其位置数据**仅用于**让 nest 跟随 pet 移动。
- **不支持** 自动切换 Codex 当前使用的宠物。安装宠物后，请手动在 Codex 设置中选择。
- **不会** 上传你的 prompts、session、仓库代码或项目文件。
- 可完全卸载，不留残留。

### 系统要求

- macOS 14 Sonoma 或更高版本
- Apple Silicon (arm64) — Intel 支持后续添加

### v0.1 主要功能

- **透明置顶悬浮巢窗口**：跟随 Codex pet 移动（或独立显示）。
- **内置 4 个小窝示例**：
  - **Capacity Orbit** — 经典的动态使用量圆环（内置渲染）。
  - **Basket Pomodoro Nest** — 带有专注番茄钟的舒适篮子。
  - **Legend Status Nest** — 游戏风格的状态面板。
  - **Nest Terminal** — 复古终端风格的小窝。
- **内置小组件**：
  - **时钟** — 当前时间和日期。
  - **倒计时** — 设置并显示目标日期/时间。
  - **番茄钟** — 专注与休息计时器。
  - **使用量指示器** — 基于本地日志的 Codex 使用量环形图（无需 API Key）。
- **本地宠物管理**：
  - 自动扫描并列出已安装的 Codex 宠物。
  - 支持安装本地宠物 ZIP 包。
  - 只读识别当前活动宠物。
- **在线宠物市场**：
  - 在应用内浏览并一键下载 [codexpet.xyz](https://codexpet.xyz) 上的宠物。
- **本地 Nest Skin 管理**：
  - 预览并切换小窝外观。支持自动安装内置皮肤。
- **在线 Nest 市场**：
  - 计划中 (Coming Soon)，初始版本优先支持内置示例。
- **安全保障**：
  - 强制 SHA256 校验，防止路径遍历，禁止脚本执行。
- **多显示器支持**：自动适配多屏环境。

### 下载与安装

> [!IMPORTANT]
> 目前 CodexPet Nest 仅支持 **macOS** 系统。

你可以通过以下任一方式获取：

- **官网下载**：[codexpet.xyz/nest/](https://codexpet.xyz/nest/)
- **GitHub Release**：[GitHub Releases](https://github.com/RyanNiu/codexpet-nest/releases)

1. 下载并打开 `CodexPetNest.dmg`。
2. 将 `CodexPet Nest.app` 拖入 `Applications` 文件夹。

> 首次运行时，如果 Gatekeeper 提示"无法验证开发者"，请在 Finder 中右键 app → 打开，或在「系统设置 → 隐私与安全性」中点击"仍要打开"。

### 使用说明

#### 切换宠物

1. 在 CodexPet Nest 中点击“Install”安装新宠物。
2. **手动操作**：打开 Codex Desktop 的设置面板。
3. 在“Avatar/Pet”选项中找到新安装的宠物并选择。

#### 切换小窝外观

1. 在菜单栏点击“Nest Marketplace”或“Local Nests”。
2. 选择喜欢的外观点击“Apply Now”。

### 卸载

1. 从菜单栏退出 CodexPet Nest。
2. 从 `Applications` 删除 `CodexPet Nest.app`。
3. （可选）删除数据目录 `~/Library/Application Support/CodexPet Nest/`。

### 从源码构建

#### 快速开始

`````bash
# 克隆仓库
git clone https://github.com/RyanNiu/codexpet-nest.git
cd codexpet-nest

# 安装依赖 — 需要 Xcode Command Line Tools
xcode-select --install 2>/dev/null || echo "CLT 已安装"

# 构建 debug 版本
make

# 构建 release 版本
make release

# 打包为 .app
make app

# 运行 app
make run

# 清理构建产物
make clean

# 生成发布安装包 (DMG)
make dmg


### 项目结构

```text
codexpet-nest/
├── Makefile                    # 构建系统
├── README.md
├── PRIVACY.md
├── SECURITY.md
├── LICENSE
├── Resources/
│   └── Info.plist              # App bundle 身份配置
├── Sources/
│   └── CodexPetNest/
│       ├── main.swift          # 入口
│       ├── AppDelegate.swift   # 生命周期 & 设置窗口
│       ├── MenuBarController.swift  # 菜单栏
│       ├── NestOverlayWindow.swift  # 悬浮巢窗 (NSPanel)
│       ├── NestRenderer.swift       # 巢渲染视图
│       ├── PetPositionReader.swift  # 读取 Codex pet 位置
│       ├── SettingsStore.swift      # 本地设置
│       ├── CodexPetAPI.swift        # API 客户端（网络层）
│       ├── KeychainManager.swift    # Keychain token 存储
│       ├── PackageManager.swift     # 下载/校验/安装
│       └── Widgets/
│           ├── ClockWidget.swift     # 时钟
│           ├── CountdownWidget.swift # 倒计时
│           ├── PomodoroWidget.swift  # 番茄钟
│           └── UsageIndicatorWidget.swift # 使用量指示器
├── UsageLimitReader.swift            # 读取 Codex 使用量日志
└── docs/
    ├── architecture.md         # 架构说明
    ├── permissions.md          # 权限说明
    └── specs/
        └── nest-package.md     # Nest 小窝包标准规范
```

### 架构概览

```
┌─────────────────────────────────┐
│         CodexPet Nest           │
│                                 │
│  MenuBarController              │  ← 菜单栏图标 & 菜单
│  NestOverlayWindow (NSPanel)    │  ← 透明悬浮巢窗
│    ├─ NestRenderer              │  ← 背景 + widget 容器
│    ├─ PetPositionReader         │  ← 读取 .codex-global-state.json
│    ├─ UsageLimitReader          │  ← 读取 logs_2.sqlite 使用量
│    └─ Widgets (Clock/Countdown/Pomodoro/Usage)
│                                 │
│  ┌─── API Layer ──────────────┐ │
│  │ CodexPetAPI                │ │  ← codexpet.xyz API 调用
│  │ PackageManager             │ │  ← 下载/校验/安装包
│  │ KeychainManager            │ │  ← token 安全存储
│  └────────────────────────────┘ │
│                                 │
│  SettingsStore                  │  ← ~/Library/.../settings.json
└─────────────────────────────────┘
```

详见 [docs/architecture.md](docs/architecture.md)。

### 鸣谢 / Acknowledgements

- CodexPet Nest 的悬浮伴随窗口方案受 [codex-pet-limit-rings](https://github.com/petergpt/codex-pet-limit-rings) 启发——该项目由 petergpt 开发并以 MIT 协议开源，展示了一种无需修改 Codex 即可让透明置顶窗口跟随 Codex pet 移动的实现方式。
- 特别感谢 [LINUX DO](https://linux.do) 社区的支持与灵感。

CodexPet Nest 是一个独立项目，专注于宠物小窝、小组件、市场安装与创作者上传流程。除非后续项目材料中明确声明，否则 CodexPet Nest 与 codex-pet-limit-rings、petergpt、OpenAI 或 Codex 均无关联。

### 许可证

FSL-1.1-MIT — CodexPet Nest 源码可见，可用于非竞争性用途，并将于 2028-05-06 自动转换为 MIT License。详见 [LICENSE](LICENSE)。

本仓库包含 CodexPet Nest bridge integrations 的再分发例外：非官方再分发、环境适配 fork 与兼容性改造是允许的，但必须清楚标明为非官方且不受官方支持，不得暗示 Ryan Niu 或 CodexPet Nest 的认可。

### 隐私与安全

详见 [PRIVACY.md](PRIVACY.md)、[SECURITY.md](SECURITY.md) 和 [docs/permissions.md](docs/permissions.md)。

---

<a name="english"></a>

## English

CodexPet Nest is a macOS desktop companion app for [codexpet.xyz](https://codexpet.xyz). It displays a transparent floating "nest overlay" next to your Codex Desktop pet, featuring built-in widgets like a clock, countdown, and Pomodoro timer.

### Important Notice

- CodexPet Nest is independent from Codex / OpenAI, unless official cooperation is announced in the future.
- **Does NOT** modify or inject into the Codex Desktop app bundle.
- **Does NOT** modify Codex global state. Reading position data is **ONLY** used to allow the nest to follow the pet.
- **Does NOT** support auto-switching of the active pet in Codex. After installing a pet, please select it manually in Codex settings.
- **Does NOT** upload your prompts, sessions, repository code, or project files.
- Fully uninstallable with no residues.

### System Requirements

- macOS 14 Sonoma or later
- Apple Silicon (arm64) — Intel support coming soon

### v0.1 Key Features

- **Transparent Floating Nest Window**: Follows the Codex pet or stays in a fixed position.
- **4 Built-in Nest Examples**:
  - **Capacity Orbit** — Classic dynamic usage rings (built-in rendering).
  - **Basket Pomodoro Nest** — Cozy basket with a focus timer.
  - **Legend Status Nest** — Game-style status panel.
  - **Nest Terminal** — Retro terminal-style nest.
- **Built-in Widgets**:
  - **Clock**, **Countdown**, **Pomodoro**, and **Usage Indicator**.
- **Local Pet Management**:
  - Automatically scans and lists installed Codex pets. Supports local ZIP installation.
- **Online Pet Marketplace**:
  - Browse and download pets from [codexpet.xyz](https://codexpet.xyz).
- **Local Nest Skin Management**:
  - Preview and switch nest skins. Automatically installs built-in skins.
- **Online Nest Marketplace**:
  - Coming Soon. Initial version focused on built-in examples.
- **Security Assurance**:
  - Enforced SHA256 verification and path traversal protection.
- **Multi-monitor Support**: Automatically adapts to multi-screen environments.

### Download & Installation

> [!IMPORTANT]
> Currently, CodexPet Nest only supports **macOS**.

You can download the latest version from:

- **Official Website**: [codexpet.xyz/nest/](https://codexpet.xyz/nest/)
- **GitHub Release**: [GitHub Releases](https://github.com/RyanNiu/codexpet-nest/releases)

1. Download and open `CodexPetNest.dmg`.
2. Drag `CodexPet Nest.app` into your `Applications` folder.

> Upon first launch, if Gatekeeper warns "Developer cannot be verified," right-click the app in Finder → Open, or click "Open Anyway" in "System Settings → Privacy & Security."

### Usage Instructions

#### Switching Pets

1. Click "Install" in CodexPet Nest to install a new pet.
2. **Manual Step**: Open Codex Desktop's settings panel.
3. Find the newly installed pet under "Avatar/Pet" and select it.

#### Switching Nest Skins

1. Click "Nest Marketplace" or "Local Nests" in the menu bar.
2. Choose your preferred appearance and click "Apply Now."

### Uninstallation

1. Quit CodexPet Nest from the menu bar.
2. Delete `CodexPet Nest.app` from `Applications`.
3. (Optional) Delete the data directory: `~/Library/Application Support/CodexPet Nest/`.

### Build from Source

#### Quick Start

````bash
# Clone the repository
git clone https://github.com/RyanNiu/codexpet-nest.git
cd codexpet-nest

# Install dependencies — Xcode Command Line Tools required
xcode-select --install 2>/dev/null || echo "CLT already installed"

# Build debug version
make

# Build release version
make release

# Package as .app
make app

# Run the app
make run

# Clean build artifacts
make clean

# Generate release package (DMG)
make dmg


### Project Structure

```text
codexpet-nest/
├── Makefile                    # Build system
├── README.md
├── PRIVACY.md
├── SECURITY.md
├── LICENSE
├── Resources/
│   └── Info.plist              # App bundle configuration
├── Sources/
│   └── CodexPetNest/
│       ├── main.swift          # Entry point
│       ├── AppDelegate.swift   # Lifecycle & Settings window
│       ├── MenuBarController.swift  # Menu bar
│       ├── NestOverlayWindow.swift  # Floating nest window (NSPanel)
│       ├── NestRenderer.swift       # Nest rendering view
│       ├── PetPositionReader.swift  # Reads Codex pet position
│       ├── SettingsStore.swift      # Local settings
│       ├── CodexPetAPI.swift        # API client (Networking)
│       ├── KeychainManager.swift    # Keychain token storage
│       ├── PackageManager.swift     # Download/Verify/Install
│       └── Widgets/
│           ├── ClockWidget.swift     # Clock
│           ├── CountdownWidget.swift # Countdown
│           ├── PomodoroWidget.swift  # Pomodoro
│           └── UsageIndicatorWidget.swift # Usage indicator
├── UsageLimitReader.swift            # Reads Codex usage logs
└── docs/
    ├── architecture.md         # Architecture documentation
    ├── permissions.md          # Permissions documentation
    └── specs/
        └── nest-package.md     # Nest package standard specification
`````

### Architecture Overview

```
┌─────────────────────────────────┐
│         CodexPet Nest           │
│                                 │
│  MenuBarController              │  ← Menu bar icon & menu
│  NestOverlayWindow (NSPanel)    │  ← Transparent floating window
│    ├─ NestRenderer              │  ← Background + widget container
│    ├─ PetPositionReader         │  ← Reads .codex-global-state.json
│    ├─ UsageLimitReader          │  ← Reads logs_2.sqlite usage
│    └─ Widgets (Clock/Countdown/Pomodoro/Usage)
│                                 │
│  ┌─── API Layer ──────────────┐ │
│  │ CodexPetAPI                │ │  ← codexpet.xyz API calls
│  │ PackageManager             │ │  ← Download/Verify/Install
│  │ KeychainManager            │ │  ← Secure token storage
│  └────────────────────────────┘ │
│                                 │
│  SettingsStore                  │  ← ~/Library/.../settings.json
└─────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for details.

### Acknowledgements

- CodexPet Nest's companion-window approach was inspired by [codex-pet-limit-rings](https://github.com/petergpt/codex-pet-limit-rings)—an MIT-licensed project by petergpt that demonstrates how a transparent, always-on-top window can follow the active Codex pet without patching Codex.
- Special thanks to the [LINUX DO](https://linux.do) community for their support and inspiration.

CodexPet Nest is an independent project focused on pet nests, widgets, marketplace installation, and creator workflows. Unless explicitly stated in future project materials, CodexPet Nest has no affiliation with codex-pet-limit-rings, petergpt, OpenAI, or Codex.

### License

FSL-1.1-MIT — CodexPet Nest source code is visible and can be used for non-competing purposes, and will automatically convert to the MIT License on 2028-05-06. See [LICENSE](LICENSE) for details.

This repository includes a redistribution exception for CodexPet Nest bridge integrations: unofficial redistributions, environment-adapted forks, and compatibility modifications are allowed, provided they are clearly marked as unofficial and not endorsed by Ryan Niu or CodexPet Nest.

### Privacy and Security

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), and [docs/permissions.md](docs/permissions.md) for more information.
