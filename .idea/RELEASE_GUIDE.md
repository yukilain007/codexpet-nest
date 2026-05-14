# CodexPet Nest 标准发布流程

这份文档给人和 AI 共同使用。以后让 AI 发布新版本时，必须严格按这里执行，避免出现 Git tag 是 `v0.1.5`、但软件包里仍显示 `0.1.3` 的版本分叉。

当前 GitHub Actions 发布入口仍然是推送 `v*` tag：

```yaml
on:
  push:
    tags:
      - 'v*'
```

重要原则：**软件版本号来自 `Resources/Info.plist`，不是来自 Git tag。**  
打 tag 前必须先更新并提交 `Info.plist`，然后让 tag 指向这个 release commit。

---

## AI 发布任务定义

当用户要求“发布版本”“打 release”“发新版”时，AI 应完成以下事项：

1. 确认目标版本号，例如 `0.1.6`，对应 tag 为 `v0.1.6`。
2. 更新 `Resources/Info.plist`：
   - `CFBundleShortVersionString` 必须等于目标版本号，例如 `0.1.6`。
   - `CFBundleVersion` 必须递增，建议用纯数字，例如 `16`。
3. 本地构建并验证 `.app` 和 `.dmg` 里嵌入的版本号。
4. 提交 release commit。
5. 创建 tag，并只推送该 tag 触发 GitHub Actions。
6. 验证 GitHub Release 和 DMG asset 是否生成。
7. 如需 Sparkle 自动更新，收集并同步官网 Worker 元数据。

AI 不应跳过验证，也不应只打 tag 不改 `Info.plist`。

---

## 发布前检查

先确认仓库状态、最新 tag、当前 app 版本：

```bash
git status --short --branch
git fetch origin --tags
git tag --list 'v*' --sort=version:refname | tail -10

/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" Resources/Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" Resources/Info.plist
```

检查是否已有目标 tag：

```bash
git rev-parse v0.1.6 >/dev/null 2>&1 && echo "tag already exists"
git ls-remote --tags origin v0.1.6
```

如果本地有与发布无关的未提交改动，AI 必须先说明，不要把无关文件混进 release commit。

---

## 1. 更新软件版本号

以发布 `0.1.6`、build `16` 为例：

```bash
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString 0.1.6" Resources/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 16" Resources/Info.plist
```

再次确认：

```bash
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" Resources/Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" Resources/Info.plist
```

要求：

- `CFBundleShortVersionString` 必须和 tag 去掉 `v` 后完全一致。
- `CFBundleVersion` 必须比上一版递增。
- 不要只更新文档或 Git tag，必须更新 `Resources/Info.plist`。

---

## 2. 本地构建验证

正式打 tag 前先构建：

```bash
make clean
make app
make dmg
make verify-dmg
```

`make verify-dmg` 会打印 DMG 内 app 的版本号。AI 必须确认输出中的版本是目标版本，例如：

```text
DMG app version:
0.1.6
16
```

如果 `hdiutil` 报 `Resource busy`，通常是旧的 DMG mount 未清理。处理后重跑：

```bash
hdiutil info
```

找到相关挂载点后 detach，再重新执行：

```bash
hdiutil detach "<mount-path>"
make dmg
make verify-dmg
```

---

## 3. 提交 release commit

只提交发布需要的文件。最小情况下应只包含 `Resources/Info.plist`：

```bash
git diff -- Resources/Info.plist
git add Resources/Info.plist
git commit -m "release: v0.1.6"
```

如果发布还包含其他明确相关改动，AI 必须在提交前列出文件清单并说明原因。

提交后确认 release commit 中版本正确：

```bash
git show --stat --oneline HEAD
git show HEAD:Resources/Info.plist | plutil -p - | rg 'CFBundleShortVersionString|CFBundleVersion'
```

---

## 4. 创建并推送 tag

tag 必须指向 release commit：

```bash
git tag v0.1.6
git rev-list -n 1 v0.1.6
git rev-parse HEAD
```

上面两个 commit hash 必须一致。

先推送 main，再推送目标 tag：

```bash
git push origin main
git push origin v0.1.6
```

不要使用 `git push origin main --tags`，因为它会把所有本地 tag 一起推上去。发布时只推送目标 tag，减少误触发。

---

## 5. 验证 GitHub Actions 和 Release

推送 tag 后查看 workflow：

```bash
gh run list --workflow Release --limit 5
gh run watch
```

成功后检查 release 和 asset：

```bash
gh release view v0.1.6 --json tagName,publishedAt,isDraft,isPrerelease,assets,url
```

必须确认：

- Release 存在。
- `isDraft` 是 `false`。
- `isPrerelease` 是 `false`。
- assets 里有 `.dmg`。
- asset URL 指向当前 tag。

如果 Actions 失败，先看失败日志：

```bash
gh run view --log-failed
```

修复后应发布新的 patch 版本。除非用户明确要求，不要重写已经公开发布过的 tag。

---

## 6. Sparkle 自动更新元数据

GitHub Release 只负责生成和上传 DMG。Sparkle 自动更新还需要官网 Worker 提供正确 metadata。

需要收集这些字段：

- `latestVersion`：目标版本号，例如 `0.1.6`
- `buildVersion`：`CFBundleVersion`，例如 `16`
- `githubDownloadUrl`：GitHub Release asset 下载地址
- `sparkleSignature`：DMG 的 Sparkle EdDSA 签名
- `pubDate`：RFC 822 格式发布时间
- `size`：DMG 文件大小，单位字节

查看 GitHub asset 信息：

```bash
gh release view v0.1.6 --json assets,url
```

如果需要本地生成 Sparkle 签名，先确保已安装 Sparkle CLI，并且私钥只来自本地安全位置或 CI secret，绝不能提交到仓库：

```bash
brew install sparkle
generate_appcast --prepare-enclosure ".build/CodexPet Nest-0.1.6.dmg"
```

然后到 `codexpet` 官网仓库更新 `src/worker.ts` 的 `DESKTOP_NEST_CONFIG`，部署 Worker：

```bash
npx wrangler deploy
```

---

## 7. 最终验证

发布完成后，AI 应执行或指导验证：

1. 下载 GitHub Release 里的 DMG，确认可以打开。
2. 安装后检查菜单里的版本号，必须显示目标版本。
3. 用旧版本点击“检查更新...”，确认 Sparkle 能检测到新版本。
4. 确认下载 URL、签名、文件大小、发布日期都与最新 release 匹配。

---

## 禁止事项

- 不要只打 tag，不改 `Resources/Info.plist`。
- 不要让 `v0.1.6` 指向版本号仍是 `0.1.5` 或更旧的 commit。
- 不要用 `git push --tags` 一次性推送所有本地 tag。
- 不要把 Sparkle 私钥提交到仓库。
- 不要在没有用户明确授权时删除或重写远端 tag。
- 不要把无关改动混入 release commit。

---

## 快速模板

把 `0.1.6` 和 `16` 替换为目标版本：

```bash
git fetch origin --tags

/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString 0.1.6" Resources/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 16" Resources/Info.plist

make clean
make app
make dmg
make verify-dmg

git add Resources/Info.plist
git commit -m "release: v0.1.6"

git tag v0.1.6
test "$(git rev-list -n 1 v0.1.6)" = "$(git rev-parse HEAD)"

git push origin main
git push origin v0.1.6

gh run list --workflow Release --limit 5
gh run watch
gh release view v0.1.6 --json tagName,publishedAt,assets,url
```
