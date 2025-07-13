# Project Document 6: Admin Mode Specification (Mobile-First)

**Project Name:** SUC Echo (南方回音壁)
**Version:** 1.1
**Date:** June 26, 2025

---

### 1.0 Design Philosophy & Core Principles

The administrative tools for SUC Echo are built upon a **"Mobile-First, Hybrid Experience"** philosophy. This rejects the traditional model of a separate, desktop-only backend. Instead, it provides administrators with enhanced capabilities ("superpowers") directly within the standard mobile user interface they use every day.

-   **Primary Goal:** To empower a small team of trusted student administrators to perform 90% of their moderation duties quickly, efficiently, and discreetly from their mobile phones.
-   **Principle of Integration:** Admin tools are not a separate application; they are a layer of additional information and functionality overlaid on the core user experience.
-   **Principle of Progressive Complexity:** Quick, frequent actions are handled directly within the main app interface. Deeper analysis or complex tasks are housed within a dedicated "Admin Hub" accessible from the app.

---

### 2.0 Access, Authentication, and Activation

#### 2.1 Entry Point (The "彩蛋")

-   **Trigger:** An administrator, using the standard website on their mobile browser, taps the main SUC Echo logo in the header **10 consecutive times**.
-   **Action:** This client-side script triggers a full-screen modal overlay to slide up from the bottom of the screen. It does **not** navigate to a new page URL.

#### 2.2 Authentication

-   **Method:** The modal displays a simple login interface with two input fields and a button:
    -   **Field 1:** `用户名 (Username)`
    -   **Field 2:** `密码 (Password)`
    -   **Button:** `[ 登录管理模式 (Login to Admin Mode) ]`
-   **Security:**
    -   Each of the (up to) 5 administrators will be assigned a **unique, individual username and password**.
    -   **There will be no shared admin account.**
    -   **Technical Note:** The backend must store passwords securely by hashing them with a strong, salted algorithm like **Bcrypt**. Plaintext passwords must never be stored in the database.
-   **Account Management:** The primary founder will have access to a separate, simple interface to create, update, or delete these 5 admin accounts.

#### 2.3 Mode Activation & Visual Indication

-   **Feedback:** Upon successful login, the login modal slides down and disappears. A toast notification appears briefly at the top, stating "管理员模式已激活" (Admin Mode Activated).
-   **Persistent Indicator:** A **semi-transparent `🛡️` shield icon** appears and remains fixed in the bottom-right corner of the screen. This icon serves two purposes:
    1.  It constantly reminds the admin that they are in a privileged mode.
    2.  It acts as the primary button to access the "Admin Hub".

#### 2.4 Deactivation

-   The admin can tap the `🛡️` shield icon at any time and select "[ 🚪 退出管理员模式 ]" (Exit Admin Mode) to immediately end their admin session and return to a normal user view.

---

### 3.0 In-Context Admin Tools (The "Superpowers")

Once Admin Mode is active, the standard Browse experience is enhanced with contextual tools.

#### 3.1 On the Main Feed (`/`)

-   Every `Post Card` is augmented with two additional, admin-only elements:
    1.  **Publisher Codename:** Below the timestamp, a low-contrast text appears, e.g., `发布者: 勇敢的-红色-老虎`. This information is never visible to regular users.
    2.  **More Options Menu:** A `...` (kebab) icon appears in the top-right corner of the card.

#### 3.2 The "More Options" (`...`) Menu

-   Tapping the `...` icon on any post card causes an action sheet to slide up from the bottom, offering the following high-frequency actions:
    -   `[ 🗑️ 立即删除 (Instant Delete) ]`: Immediately removes the post from public view and logs the action.
    -   `[ 👤 查看用户档案 (View User Profile) ]`: Opens the "Admin Hub" directly to the profile page for this post's author.
    -   `[ ℹ️ 帖子详情 (Post Details) ]`: Displays technical info like `Post ID` for debugging or internal reference.

---

### 4.0 The Admin Hub (Accessed via `🛡️` Shield Icon)

Tapping the persistent `🛡️` shield icon opens a full-screen modal overlay, which is the central command center. It has a main menu leading to different views.

#### 4.1 `📊 核心仪表盘 (Core Dashboard)` - The "At-a-Glance" View

-   **Layout:** A simple, vertically scrolling view with large, clear "data cards". Designed for quick consumption.
-   **Displayed Information:**
    -   **Card 1: Real-time Online:** A large number showing the current active SSE connections.
    -   **Card 2: Pending Reports:** A **red, high-priority card** showing the number of unique posts in the "Urgent Report Queue". If this is `>0`, it requires immediate attention.
    -   **Card 3: 24-Hour Stats:** Shows `新增回声` (New Echoes) and `社区净化` (Community Purifications) in the last 24 hours.

#### 4.2 `🚩 紧急举报队列 (Urgent Reports)` - The "Triage" View

-   **Layout:** A clean, task-oriented list of reported posts, sorted by report count.
-   **Interaction:**
    -   Each list item shows a preview of the reported post and a summary of report reasons (e.g., `人身攻击(3)`).
    -   Tapping an item **expands** it in-place to reveal two clear Call-to-Action (CTA) buttons:
        1.  **`[ 🗑️ 删除帖子 ]` (Delete Post):** Removes the post and logs the action.
        2.  **`[ 👤 处理此用户 ]` (Handle This User):** Navigates the admin to the "User Management" view, pre-loaded with this user's profile.

#### 4.3 `👥 用户管理 (User Management)` - The "Discipline" View

-   **Layout:**
    -   Top: A search bar to find a user by their `codename`.
    -   Below: A scrollable list of all users, which can be sorted by `lastSeenAt`.
-   **Interaction:** Tapping any user navigates to a new "view" or "page" within the admin hub: the **User Anonymous Profile Page**.
-   **User Anonymous Profile Page:** This is the core investigation screen.
    -   **Information Displayed:**
        1.  `Codename`
        2.  `Community Reputation Score` (e.g., "This user has had 5 posts purified by the community.")
        3.  `Admin Action Log` (A chronological list of all past bans, warnings, etc.)
        4.  `Anonymous Activity Log` (A list of the user's recent **metadata**—votes, post outcomes—with all text content permanently removed, respecting the 24h/180d rules).
    -   **Action Panel:** A set of large, unambiguous buttons at the bottom of the screen for taking disciplinary action:
        -   `[ 封禁24小时 ]` (Ban for 24h)
        -   `[ 封禁7天 ]` (Ban for 7d)
        -   `[ 永久封禁 ]` (Permanent Ban)
        -   `[ 解除封禁 ]` (Unban)

---

### 5.0 Admin Feature Roadmap (Mobile-First)

-   **V1.0 (Launch):** Implement all features described above. The focus is on core moderation and user management capabilities being fully functional on mobile with individual username/password logins.
-   **V1.1 (Post-Launch):** Enhance the Dashboard with simple, mobile-friendly charts (e.g., a 7-day trend line for new posts) to provide better visual insights.
-   **V1.2 (Maturity):** Add advanced filtering and sorting options to the "User Management" and a new "Content Feed" view to handle a larger volume of data.
