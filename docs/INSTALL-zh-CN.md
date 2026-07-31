# CodexPet Nest v0.2.0 中文安装说明

本说明对应“夏以昼”和“沈星回”两个独立桌宠。两个应用互不覆盖，可以只装一个，也可以同时安装。

## 1. 先确认系统

| 系统 | 要求 | 下载格式 |
| --- | --- | --- |
| macOS | macOS 14 或更高；Apple Silicon（M1/M2/M3/M4 等） | .dmg |
| Windows | Windows 10/11；x64 | -setup.exe（推荐）或 _en-US.msi（备用） |

Intel Mac、Windows ARM 和更早版本的 macOS 不在当前 v0.2.0 安装包的目标范围内。

## 2. 下载哪个文件

固定下载页：

https://github.com/yukilain007/codexpet-nest/releases/tag/v0.2.0

角色和文件名必须一一对应：

| 角色 | macOS DMG | Windows 推荐 EXE | Windows 备用 MSI |
| --- | --- | --- | --- |
| 夏以昼 | CodexPet Nest Xia Yizhou_0.2.0_aarch64.dmg | CodexPet Nest Xia Yizhou_0.2.0_x64-setup.exe | CodexPet Nest Xia Yizhou_0.2.0_x64_en-US.msi |
| 沈星回 | CodexPet Nest Shen Xinghui_0.2.0_aarch64.dmg | CodexPet Nest Shen Xinghui_0.2.0_x64-setup.exe | CodexPet Nest Shen Xinghui_0.2.0_x64_en-US.msi |

同一个角色不需要同时安装 EXE 和 MSI。下载页面里的 SHA256SUMS.txt 用来验证文件完整性。

## 3. macOS 安装

1. 下载自己角色的 .dmg。
2. 双击 DMG，在打开的窗口中把应用拖到“应用程序”。
3. 从“应用程序”启动对应桌宠。
4. 如果第一次打开时显示“无法验证开发者”或来源提醒，请在 Finder 中对应用按住 Control 点击，选择“打开”，确认应用名称后再继续。

当前版本未经过 Apple 开发者公证。若系统提示“应用已损坏”或校验不一致，请重新下载并核对 SHA-256；不要使用移除隔离属性或关闭系统保护的命令。

## 4. Windows 安装

1. 下载自己角色的 -setup.exe。
2. 双击安装器，按安装向导完成安装。
3. 在开始菜单或桌面启动对应桌宠。
4. 如果 Windows 显示 SmartScreen、未知发布者或管理员确认，请先确认文件名和 SHA-256，再由你本人决定是否继续。

_en-US.msi 是备用安装方式，适合 EXE 无法使用或需要系统管理工具的情况。同一角色不需要同时安装两种格式。安装器未做商业代码签名，出现发布者提醒是预期情况。

## 5. 基本使用

- 鼠标靠近桌宠时，它会转向注视；离开一段距离后会回到普通状态。
- 单击、连续点击、拖动会触发不同的动作和对话。
- 鼠标停留不动一段时间会触发等待反应。
- 长时间没有互动时，桌宠可能自主走动或做检查动作。
- 两个角色可以同时打开；它们使用独立的应用、设置和数据目录。
- 独立版不显示“跟随 Codex”模式，也不需要登录或连接 Codex Desktop。

## 6. 卸载

### macOS

退出桌宠后，在“应用程序”中把对应的 CodexPet Nest Xia Yizhou.app 或 CodexPet Nest Shen Xinghui.app 移到废纸篓，再按需要清理下载的 DMG。

### Windows

在“设置 → 应用 → 已安装的应用”中找到对应角色并卸载；也可以使用开始菜单中的卸载入口。只卸载想移除的角色，另一个角色不会受影响。

## 7. 校验 SHA-256

### macOS

在包含安装包和 SHA256SUMS.txt 的下载目录中运行：

~~~bash
shasum -a 256 "CodexPet Nest Xia Yizhou_0.2.0_aarch64.dmg"
~~~

或：

~~~bash
shasum -a 256 "CodexPet Nest Shen Xinghui_0.2.0_aarch64.dmg"
~~~

将输出的 64 位十六进制值与 SHA256SUMS.txt 中同名文件的值比较。两者必须完全一致。

### Windows PowerShell

在安装包所在目录运行：

~~~powershell
Get-FileHash ".\CodexPet Nest Xia Yizhou_0.2.0_x64-setup.exe" -Algorithm SHA256
~~~

或：

~~~powershell
Get-FileHash ".\CodexPet Nest Shen Xinghui_0.2.0_x64-setup.exe" -Algorithm SHA256
~~~

也可以把文件名替换为 MSI。值不一致时不要运行安装器，请重新从固定 Release 下载。

## 8. 常见问题

### 下载后不知道选哪个

先看角色，再看系统：夏以昼只选文件名含 Xia Yizhou 的包，沈星回只选含 Shen Xinghui 的包；macOS 选 DMG，Windows 优先选 -setup.exe。

### macOS 打不开

确认系统是 macOS 14+ 且为 Apple Silicon。首次打开可以使用 Finder 的 Control-click → Open。若提示文件损坏、哈希不一致或下载不完整，请重新下载；不要运行绕过系统保护的命令。

### Windows 提示未知发布者

这是未商业签名安装器的正常提醒。先确认来源是本 Release、文件名正确、SHA-256 一致，再由你本人决定是否继续。

### 桌宠没有出现

先确认应用没有被系统拦截，并检查是否启动了正确角色。可以退出后重新启动；两个角色要分别检查。若仍无法启动，请保留系统提示和安装包校验结果再反馈。

## 9. 测试边界

v0.2.0 的桌宠资源、前端测试、Rust 测试、发布检查和 Windows 自动化构建检查已通过。Windows 图形界面尚未在实体 Windows 设备上做人工验收；因此文档不把它描述为“所有 Windows 设备均已实测”。macOS 安装包是 Apple Silicon 版本，不承诺 Intel Mac 兼容。

如需让电脑助手代为下载和安装，请复制 [AI 安装口令](AI-INSTALL-zh-CN.md)。

