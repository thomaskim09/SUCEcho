# Project Document 3: UI/UX & Brand Identity Guide (Expanded)

**Project Name:** SUC Echo (南方回音壁)
**Version:** 1.2
**Date:** June 25, 2025

---

### 1.0 Brand Identity

-   **Name:** SUC Echo
-   **Chinese Name:** 南方回音壁
-   **Tagline:** 声音只存在一天。
-   **Secondary Tagline (for onboarding):** 完全匿名，自由发声。
-   **Core Personality & "Cruel Aesthetics":** 我们的品牌人格是 **神秘的、冷静的、转瞬即逝的**。它不讨好用户，而是通过设定绝对的、不可改变的规则（如24小时销毁）来提供一种独特的公平和自由。这种“不近人情”的规则之美，就是我们的“残酷美学”。所有UI、动画和文案都应服务于这种气质。

---

### 2.0 Logo Concept

-   **Recommended Concept:** "The Dispersing Wave" (消散的声波)
-   **Creative Brief:** Logo的核心是传达“回声”和“消散”两个概念。它应由3-4条同心圆弧构成，形态上是声波的抽象表达。最外层的弧线最清晰完整，越向内层则越发破碎，从虚线最终变为细小的粒子或点，仿佛声音在传播过程中能量衰减，最终归于虚无。整体感觉必须是干净、高科技且略带一丝忧郁的。它需要是单色友好的，在作为PWA图标或favicon时必须保持高辨识度。

---

### 3.0 Visual Design System

-   **Theme:** Dark Mode exclusively.
-   **Background Color Palette:**
    -   Primary: Deep Midnight Blue (`#0B192F`)
    -   Secondary: Carbon Gray (`#1A1A1A`)
-   **Accent Color Palette (Choose One):**
    -   Option A (Vibrant): Electric Purple (`#9F70FD`)
    -   Option B (Calm): Mint Green (`#A7F3D0`)
-   **Typography:**
    -   **Primary (Body Text):** Noto Sans SC (思源黑体).
    -   **Stylistic (Data & Accents):** Roboto Mono. Used for numbers (`👍 90`), timers (`⏳ 23:59`), admin codes, and the Logo text.
-   **Iconography:**
    -   **Style:** Thin, minimalist, line-art style.
    -   **Recommendation:** Use a consistent open-source icon set like **Feather Icons** or **Tabler Icons**.

---

### 4.0 Information Architecture & Page Flow

#### 4.1 Site Map (V1.0)

/ (Home Page)
|
├── /compose (Post Creation Page)
|
├── /post/[id] (Post Detail & Echo Thread Page)
|
├── /my-echoes (User's personal post tracker)
|
└── (From Menu)
├── /about (About & Donation Page)
├── /how-it-works (Rules & Guides Page)
└── /privacy (Privacy Policy Page)

/a-d-m-i-n-portal (Admin Login - Hidden URL)
|
└── (Mobile Admin Hub - Modal/Overlay)
├── Dashboard View
├── Reports View
└── User Management View

```

#### 4.2 Core User Flows
1.  **Posting Flow (Ad-Optimized):**
    `Home (/)` → Click `+` Button → **Navigate to `/compose`** → Write & Publish → **Auto-redirect to `/`** with special parameter → See new post appear with "Glow" animation.
2.  **Reading & Replying Flow:**
    `Home (/)` → Scroll Feed → Click on a Post Card (with `💬` indicator) → **Navigate to `/post/[id]`** → Read Main Echo and Child Echoes → Long-press Main Echo to reply → **Navigate to `/compose`** with parent post context.
3.  **Self-Tracking Flow:**
    `Home (/)` → Click `☰` Menu or a dedicated top-bar icon → Click "My Echoes" → **Navigate to `/my-echoes`**.

---

### 5.0 Page & Component Breakdown

This section details the elements on each key page.

#### 5.1 Main Page (`/`)
-   **Components:**
    -   **Header:** `☰ Menu Button` (left), `Logo` (center). For admins, `🛡️ Admin Hub Button` (right).
    -   **Live Feed:** A vertical list of `Post Card` components.
    -   **"New Echoes" Pill Button:** Appears at the top when user has scrolled down and new posts are available.
    -   **Post Button:** A `+` floating action button in the bottom-right corner.
    -   **Footer Ad:** A sticky Google AdSense banner at the bottom of the screen.

#### 5.2 Anatomy of a `Post Card` Component
This is the most important component, from top to bottom:
-   **Header:**
    -   Left: Relative Timestamp (e.g., "5分钟前").
    -   Right: `⏳` Lifespan Countdown Timer.
-   **Content:**
    -   The main post text (variable height).
    -   If text exceeds ~10 lines, it's truncated with a `...[阅读全文]` link that navigates to `/post/[id]`.
-   **Footer (Interaction Bar):**
    -   **Vote Dashboard:** Displays `👍 [Upvotes]`, `👎 [Downvotes]`, `🔥 [Total Votes]`. Numbers are clickable to vote.
    -   **Community Purification Bar:** A thin progress bar that **only appears** when a post meets the "precarious" threshold (`total_votes >= 20` and `downvote_ratio > 40%`).
    -   **Echo Thread Indicator:** A `💬 [Reply Count]` indicator. The card itself will also have the "Stacked Card" visual effect if `Reply Count > 0`.
-   **Card Behavior:** The entire card is a clickable element that navigates to `/post/[id]`.

#### 5.3 Post Detail Page (`/post/[id]`)
-   **Components:**
    -   A prominent display of the "Main Echo" (the parent post) at the top. Its full text is shown.
    -   An admin-only `🚩 Report Button` in the corner of the Main Echo card.
    -   A chronological list of "Child Echoes" (replies) below the Main Echo. Each Child Echo is a full `Post Card` component itself, with its own votes and timer.
    -   A "Reply" button (`回应此声 💬`) that is sticky or at the bottom, which navigates to `/compose` with the `parentPostId`.

---

### 6.0 Core Interaction Design & Animation Details

This section defines the "feel" of the application.

#### 6.1 The "Stacked Card" Reply Animation
-   **CSS Implementation:** This effect is achieved using the `::before` and `::after` pseudo-elements of the `Post Card` `div`.
-   **Styling:**
    -   The pseudo-elements are positioned absolutely behind the main card (`z-index: -1`).
    -   They have the same `border-radius` and `background-color` as the main card but with a lower `opacity` (e.g., `0.5` and `0.2`).
    -   They are slightly rotated and shifted using `transform`. Example:
        -   `::before { transform: rotate(-3deg) translateY(4px); }`
        -   `::after { transform: rotate(2deg) translateY(2px); }`
-   **Animation:** When a post's reply count changes from 0 to 1, these pseudo-elements should transition into view. The `transition` property should be applied to `opacity` and `transform` for a duration of ~300ms.

#### 6.2 The "Pixel Dust" (化为尘埃) Destruction Animation
-   **Method:** This is a JavaScript-driven animation that manipulates multiple HTML elements.
-   **Logic:**
    1.  **Event Trigger:** JS receives the `destroy_post` event from the SSE connection.
    2.  **Hide Original:** The target `Post Card`'s opacity is set to 0.
    3.  **Generate Particles:** JS calculates the card's position and generates 50-100 small `<div>` "particles" at that location.
    4.  **Animate Particles:** JS applies a CSS animation class to each particle.
        -   The `@keyframes` for this class will move the particle to a random `translateX` and `translateY` position while fading its `opacity` to 0.
        -   Crucially, JS assigns a **random `animation-delay` and `animation-duration`** to each particle. This ensures the "shattering" effect looks organic and not uniform.
    5.  **Cleanup:** After the longest animation completes, the original (now hidden) `Post Card` element is removed from the DOM.

#### 6.3 Button Micro-interaction
-   **Principle:** All primary buttons (`👍`, `👎`, `+`, etc.) must provide physical feedback.
-   **Implementation:** Use a CSS `transition` on the `transform` property. On `:active` (when the user is pressing down), apply a `transform: scale(0.90)` to make the button feel like it's being pressed into the screen. When released, it smoothly transitions back to `scale(1)`.
