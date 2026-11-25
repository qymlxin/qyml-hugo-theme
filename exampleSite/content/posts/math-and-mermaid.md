+++
date = '2026-05-12'
draft = false
title = '数学公式与 Mermaid 图表支持'
tags = ['KaTeX', 'Mermaid', 'Markdown']
categories = ['技术']
math = true
+++

在文章 Front Matter 中设置 `math = true` 即可启用 KaTeX 数学公式，同时原生支持声明式 Mermaid 流程图。

<!--more-->

## 梯度下降更新公式

$$\theta_{t+1} = \theta_t - \eta \nabla_{\theta} J(\theta_t)$$

行内公式也同样支持，例如学习率 $\eta > 0$。

## 架构流程图

```mermaid
flowchart LR
    Markdown["Markdown 文章"] --> Hugo["Hugo 构建"]
    Hugo --> Search["index.json 搜索索引"]
    Hugo --> Pages["静态 HTML 页面"]
```
