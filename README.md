# qyml-hugo-theme

简洁、克制的个人技术博客 Hugo 主题：浅灰底衬纯白卡片、三栏悬浮侧栏首页、左轨日期列表页、专栏书架式分类页、支持实时筛选的标签云，以及开箱即用的客户端搜索与代码高亮。

## 主要特性

- **零构建前端依赖**：原生 CSS 变量 + 轻量化脚本，支持亮/暗模式自动跟随系统与手动切换。
- **三栏首页与吸顶侧栏**：左侧个人资料与站点统计卡片，中间文章流，右侧热门话题与按月归档。
- **差异化导航视图**：
  - `/posts/`：左列日期时间轨 + 右列文章主体 + 侧栏分类/标签快捷索引。
  - `/categories/`：专栏书架式两栏卡片，直接预览各分类最新 3 篇文章。
  - `/tags/`：分层标签云 + 本地即时关键词筛选。
  - `/archive/`：按年/月整理的时间线归档。
- **技术写作友好**：集成 Shiki 代码高亮（`github-light` / `github-dark`）、Mermaid 流程图（随主题实时重绘）、KaTeX 公式（按需开启 `math = true`）、图片灯箱放大、阅读进度条与右栏粘性目录。
- **客户端搜索**：基于 Fuse.js + `index.json`，支持 `⌘K` / `Ctrl+K` 快捷键与键盘上下选择。
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

2. 主题内置了 `archetypes/default.md` 模板，在站点根目录运行以下命令即可生成带预设 Front Matter 的新文章：

```bash
hugo new content posts/my-first-post.md
```

## 本地预览 `exampleSite`

在主题目录的父级或主题内部可直接用 `exampleSite` 预览效果：

```bash
hugo server --source themes/qyml-hugo-theme/exampleSite --themesDir ../..
```
