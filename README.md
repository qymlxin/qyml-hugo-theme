# qyml-hugo-theme

**现代极简卡片风 / 专注技术阅读的卡片式排版（Clean Editorial Card UI）** Hugo 主题：冷灰画布衬托轻质卡片、克制的单科技蓝强调色，以及开箱即用的客户端搜索、交互式图表与代码块体验。

## 主要特性

- **双色现代极简卡片风**：亮色模式使用低饱和冷灰底（`#f2f3f5`）搭配纯白圆角卡片；暗夜模式使用深蓝灰夜色画布（`#151921`）搭配高对比度卡片层（`#212733`），支持随系统切换或手动切换并自动防闪烁。
- **三栏首页与吸顶侧栏**：`82rem` 宽屏桌面栅格，左侧个人资料与站点统计卡片，中间文章流，右侧热门话题与按月归档。
- **舒展文章阅读与组合右栏**：
  - 宽敞的文章阅读卡 + 右侧组合侧栏（作者紧凑名片 + 吸顶 `h2`–`h4` 三级目录 + 相关/推荐阅读；无目录文章自动以热门标签卡补全）。
  - 目录支持实时阅读进度百分比、折叠/展开、当前小节左蓝条指示以及目录容器自身平滑跟随滚动。
- **差异化导航视图**：
  - `/posts/`：左列日期时间轨 + 右列文章主体 + 侧栏分类/标签快捷索引。
  - `/categories/`：专栏书架式两栏卡片，直接预览各分类最新 3 篇文章。
  - `/tags/`：分层标签云 + 本地即时关键词筛选。
  - `/archive/`：按年/月整理的时间线归档。
- **技术写作与交互预览**：
  - 集成 Shiki 代码高亮（`github-light` / `github-dark`）、KaTeX 公式（按需开启 `math = true`）与顶部阅读进度条。
  - **Mermaid 流程图**：支持 `[params.mermaid]` 亮/暗双主题实时重绘、工具栏行内缩放与拖拽平移、复制源码及全屏预览。
  - **交互式 Lightbox**：点击正文图片、Excalidraw SVG 或 Mermaid「全屏」均可缩放（滚轮、双击、双指捏合、键盘 `+`/`-`/`0`/`Esc`）与拖拽平移。
  - **零依赖 Excalidraw 短代码**：使用 `{{</* excalidraw src="diagrams/xxx.excalidraw.svg" alt="..." */>}}` 直接嵌入内嵌场景数据的 `.excalidraw.svg`，默认支持暗夜自动反色（可用 `invert="false"` 关闭，或传 `dark="..."` 指定独立暗色图）。
- **客户端搜索与按需评论**：基于 Fuse.js + `index.json` 的全站即时搜索（支持 `⌘K` / `Ctrl+K`）；支持 Artalk 评论（主题默认关闭，可在站点配置按需开启）。
- **零配置安全兜底**：不配置横幅图、头像或评论服务也能完整运行，不会出现裂图或报错。

## 安装方式

### 方式一：Hugo Module（推荐）

在站点根目录执行：

```bash
hugo mod init github.com/yourname/your-blog
hugo mod get github.com/qymlxin/qyml-hugo-theme
```

在站点 `hugo.toml` 中导入主题模块：

```toml
[module]
  [[module.imports]]
    path = 'github.com/qymlxin/qyml-hugo-theme'
```

### 方式二：Git Submodule

```bash
git submodule add https://github.com/qymlxin/qyml-hugo-theme.git themes/qyml-hugo-theme
```

在站点 `hugo.toml` 中指定主题：

```toml
theme = 'qyml-hugo-theme'
```

## 最小可用 `hugo.toml` 示例

```toml
baseURL = 'https://example.com'
locale = 'zh-cn'
title = 'My Tech Blog'
theme = 'qyml-hugo-theme' # 若使用 Hugo Module 则替换为 [module] 导入

# 必须保留 JSON 输出以启用全站搜索
[outputs]
  home = ['HTML', 'RSS', 'JSON']

[params]
  author = 'Your Name'
  description = '个人技术博客'
  subtitle = 'Stay hungry, stay foolish.'
  location = 'Chengdu, China'
  # avatar = '/images/avatar.png'        # 可选，不填自动显示首字母头像
  # homeBanner = '/images/banner.jpg'    # 可选，不填显示内置渐变横幅
  homeIntro = '记录写代码时遇到的问题，也留下一些平时的想法。'
  homeCoverEyebrow = 'FIELD NOTES'
  homeCoverTitle = '代码、系统与长期思考'

[params.mermaid]
  theme = 'neutral'
  darkTheme = 'dark'

[params.artalk]
  enabled = false # 默认关闭；如需开启请设为 true 并填写 server 与 site
  server = ''
  site = ''

[params.social]
  github = 'yourname'
  email = 'you@example.com'
```

## 新建文章与归档页

1. 若需要 `/archive/` 归档页，在站点 `content/archive.md` 中写入：

```toml
+++
title = '归档'
layout = 'archive'

[build]
  list = 'never'
+++
```

2. 主题内置了 `archetypes/` 模板，在站点根目录运行以下命令即可生成带预设 Front Matter 的新文章：

```bash
hugo new content/posts/my-first-post.md
```

## 本地预览 `exampleSite`

在主题目录的父级或站点根目录可直接用 `exampleSite` 预览效果：

```bash
hugo server --source themes/qyml-hugo-theme/exampleSite --themesDir ../..
```
