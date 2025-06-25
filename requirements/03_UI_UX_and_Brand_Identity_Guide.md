# Project Document 3: UI/UX & Brand Identity Guide (Expanded)

**Project Name:** SUC Echo
**Version:** 1.1
**Date:** June 25, 2025

---

### 1.0 Brand Identity

-   **Name:** SUC Echo (南方回音壁)
-   **Tagline:** 声音只存在一天。
-   **Secondary Tagline (for onboarding):** 完全匿名，自由发声。
-   **Core Personality & "Cruel Aesthetics":** 我们的品牌人格是 **神秘的、冷静的、转瞬即逝的**。它不讨好用户，而是通过设定绝对的、不可改变的规则（如24小时销毁）来提供一种独特的公平和自由。这种“不近人情”的规则之美，就是我们的“残酷美学”。所有UI、动画和文案都应服务于这种气质。

---

### 2.0 Logo Concept

-   **Recommended Concept:** "The Dispersing Wave" (消散的声波)
-   **Creative Brief:** Logo的核心是传达“回声”和“消散”两个概念。它应由3-4条同心圆弧构成，形态上是声波的抽象表达。最外层的弧线最清晰完整，越向内层则越发破碎，从虚线最终变为细小的粒子或点，仿佛声音在传播过程中能量衰减，最终归于虚无。整体感觉必须是干净、高科技且略带一丝忧郁的。它需要是单色友好的，在作为PWA图标或favicon时必须保持高辨识度。

---

### 3.0 Visual Design System

-   **Theme:** Dark Mode exclusively. 这能增强沉浸感，符合夜晚“树洞”的使用场景。
-   **Background Color Palette:**
    -   Primary: Deep Midnight Blue (`#0B192F`)
    -   Secondary: Carbon Gray (`#1A1A1A`)
-   **Accent Color Palette (Choose One):**
    -   Option A (Vibrant): Electric Purple (`#9F70FD`)
    -   Option B (Calm): Mint Green (`#A7F3D0`)
-   **Typography:**
    -   **Primary (Body Text):** Noto Sans SC (思源黑体). 保证在任何设备上都有最佳的可读性。
    -   **Stylistic (Data & Accents):** Roboto Mono. 用于渲染所有数字（票数、倒计时）、时间戳、Logo文字和管理员代号。这种字体组合能在保证内容可读性的前提下，最大化“数字终端”的科技感和匿名感。
-   **Iconography:**
    -   **Style:** Thin, minimalist, line-art style.
    -   **Recommendation:** 使用开源图标库如 **Feather Icons** 或 **Tabler Icons** 来保证全站图标风格的统一性。

---

### 4.0 UI Animation & Sound Effects (SFX) Dictionary

音效默认关闭，用户可在`☰`菜单中开启。

| Trigger Event | Visual Animation | Sound Effect (SFX) | Feel / Purpose |
| :--- | :--- | :--- | :--- |
| **First-Time Visit** | 序列动画：Logo → 匿名标语 → 24小时标语 → 全体“化为尘埃” → UI浮现。 | 无 | 在5秒内快速、深刻地将产品的两大核心理念植入用户心中。 |
| **New Echo Appears** | 从顶部平滑滑入并淡入。 | 空灵的“声纳Ping”声 (`píng...`)，带混响。 | 营造“思想不断汇入寂静空间”的氛围感。 |
| **Upvote (`👍`) Click** | 数字“弹跳”或“放大”一下。 | 清脆、音调略高的`plink`声。 | 提供轻快、积极的即时反馈。 |
| **Downvote (`👎`) Click** | 数字“弹跳”或“放大”一下。 | 沉闷、音调略低的`thump`声。 | 提供果断、负面但非攻击性的反馈。 |
| **Community Purified** | “化为尘埃”/“碎裂”特效。 | 短暂的“信号干扰”`bzzzt`声，由强到弱。 | 象征着“不和谐”的内容被社区规则清除。 |
| **24-Hour Expiration** | “化为尘埃”/“碎裂”特效。 | 轻微的玻璃碎裂声，接细碎的沙沙声，归于寂静。 | 强调“自然消亡”的宿命感，充满“残酷美学”。 |
| **Post Reply (Send)** | “Whoosh”或文字汇聚飞出的动画。 | 短促、带有方向感的`whoosh`声。 | 给予“发送成功”的动态满足感。 |
| **Scroll to Top** | “传送”特效：当前视图淡出，瞬间滚动，新视图淡入。 | 可选的、轻微的“相位转移”或“充能”声。 | 创造干净、高级、无打扰的页面跳转体验。 |

---

### 5.0 Core Layout Principles

-   **Navigation:** `☰`汉堡菜单位于左上角，点击后从左侧滑出菜单面板，包含指向`/about`, `/how-it-works`, `/privacy`等页面的链接。
-   **Admin Access:** `🛡️`盾牌图标在激活“管理员模式”后，悬浮于右下角，作为移动端管理中心的入口。
-   **Reply Indication:** “堆叠卡片”效果。有回覆的帖子卡片后方会有一到两层带有透明度的“影子卡片”，通过`transform`属性在位置上进行微小偏移，创造3D堆叠感。
-   **Card Height:** 采用可变高度，优先保证阅读效率。
-   **Read More:** 超过10行或250字符的帖子将被截断，并显示`...[阅读全文]`链接，点击后跳转至该帖子的独立详情页`/post/[id]`。