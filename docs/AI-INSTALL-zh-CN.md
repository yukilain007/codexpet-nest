# 让 AI 帮你下载安装桌宠

这份说明适用于具备本机操作能力的 Codex、Claude、ChatGPT 或其他电脑助手。AI 可以负责识别系统、下载、核对文件和打开安装器，但遇到系统安全确认时必须停下来让你本人决定。

固定来源：

https://github.com/yukilain007/codexpet-nest/releases/tag/v0.2.0

## 简洁版：直接复制给 AI

~~~text
请帮我安装 CodexPet Nest v0.2.0 桌宠。

先问我想安装“夏以昼”“沈星回”还是两个都安装，然后只读检查我的操作系统版本和 CPU 架构：
- macOS 14+ Apple Silicon：夏以昼用 CodexPet.Nest.Xia.Yizhou_0.2.0_aarch64.dmg，沈星回用 CodexPet.Nest.Shen.Xinghui_0.2.0_aarch64.dmg。
- Windows 10/11 x64：优先使用对应角色名称后缀为 _x64-setup.exe 的文件，MSI 只作为备用。
- 不支持的系统或架构请停止，不要猜测或下载其他版本。

只能从这个 Release 下载：
https://github.com/yukilain007/codexpet-nest/releases/tag/v0.2.0

下载对应安装包和 SHA256SUMS.txt。先计算并核对 SHA-256，校验不一致就停止，删除损坏下载并报告原因，不要打开安装器。校验通过后：
- macOS：挂载 DMG，把应用复制到“应用程序”并尝试启动。
- Windows：打开对应的 -setup.exe；只有它无法使用时才建议 MSI。

如果出现 Gatekeeper、SmartScreen、未知发布者、管理员授权或其他安全确认，请暂停并把提示原文告诉我，由我本人确认。不要关闭或绕过 Gatekeeper、SmartScreen、Defender，不要移除隔离属性，不要把文件加入白名单，也不要使用 curl | sh 之类的方式执行未知内容。

安装结束后告诉我：角色、系统和架构、下载的文件名、SHA-256 是否一致、安装位置、是否成功启动。没有本机执行权限时，只给我下一步命令，不要假装已经安装。
~~~

## 严格版：给有命令执行能力的 AI

~~~text
你是我的本机安装助手。请安装 CodexPet Nest v0.2.0 的夏以昼、沈星回，或我明确指定的其中一个角色。

安全边界：
1. 唯一来源是 https://github.com/yukilain007/codexpet-nest/releases/tag/v0.2.0，不得使用 Actions artifact、第三方网盘、镜像或 latest 链接。
2. 先只读检测操作系统、版本和 CPU 架构；不符合 macOS 14+ Apple Silicon 或 Windows 10/11 x64 时停止。
3. 按角色选择精确文件名，不要用模糊匹配：
   - 夏以昼 macOS：CodexPet.Nest.Xia.Yizhou_0.2.0_aarch64.dmg
   - 沈星回 macOS：CodexPet.Nest.Shen.Xinghui_0.2.0_aarch64.dmg
   - 夏以昼 Windows：CodexPet.Nest.Xia.Yizhou_0.2.0_x64-setup.exe；备用 CodexPet.Nest.Xia.Yizhou_0.2.0_x64_en-US.msi
   - 沈星回 Windows：CodexPet.Nest.Shen.Xinghui_0.2.0_x64-setup.exe；备用 CodexPet.Nest.Shen.Xinghui_0.2.0_x64_en-US.msi
4. 同时下载 Release 中的 SHA256SUMS.txt。安装前计算所选安装包 SHA-256，与校验文件中同名条目逐字符比较；不一致、文件缺失或下载失败时停止。
5. macOS 校验通过后才挂载 DMG，将正确的 .app 复制到 /Applications；Windows 校验通过后才打开 -setup.exe，只有 EXE 无法使用时才询问我是否改用 MSI。
6. Gatekeeper、SmartScreen、未知发布者、UAC、管理员密码或任何安全确认都必须暂停并交给我。不要自动点击“仍要运行”，不要关闭安全工具，不要执行 xattr -cr 或类似绕过命令，不要修改 Defender/防火墙/白名单。
7. 安装后启动应用并检查是否出现桌宠；如果无法确认 GUI 结果，要明确说“无法确认”，不能假报成功。
8. 最后用以下格式报告：
   角色：
   系统/架构：
   安装包：
   SHA-256：
   安装位置：
   启动结果：
   需要我确认的系统提示：
~~~

## AI 的执行顺序

AI 应严格按这个顺序工作：

1. 询问角色；若用户没有选择，不下载。
2. 读取系统和架构；不符合要求就停止。
3. 只从固定 Release 选择精确资产。
4. 下载安装包和 SHA256SUMS.txt。
5. 校验 SHA-256；失败就停止。
6. 执行对应系统的正常安装动作。
7. 安全提示出现时暂停，交给用户。
8. 启动并按模板报告结果。

如果助手只能聊天、不能操作本机，它可以把下一步命令写出来，但必须明确说明没有替用户执行。
