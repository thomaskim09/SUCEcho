# Project Document 4: Go-To-Market & Community Strategy (Expanded)

**Project Name:** SUC Echo
**Version:** 1.1
**Date:** June 25, 2025

---

### 1.0 Go-To-Market (GTM) Strategy

#### **Phase 1: Guerilla Marketing & Seeding (Day 1 - Day 30)**
-   **Objective:** 以最低成本，精准获取第一批100-200名具有高好奇心和参与度的种子用户。
-   **Primary Method:** "QR Code Poster Campaign".
-   **Execution Details:**
    1.  **Poster Design:** 使用AI图片生成工具，围绕“数字故障艺术”或“机密档案”主题进行设计。
    2.  **Poster Headlines (Examples):**
        -   `有些秘密，只存在于一瞬间。`
        -   `如果秘密有保质期，你愿意给它多久？`
        -   `一个没有“昨天”的留言板。`
    3.  **Distribution:** 将设计好的A4海报张贴或放置在校园内学生必经之处：食堂餐桌、图书馆自习区、教学楼公告栏、宿舍楼下、巴士站等。
-   **Secondary Method: Digital Seeding:**
    -   匿名地将网站链接或海报图片，发布到已有的、非官方的SUC学生微信群、Telegram群或论坛中，吸引线上用户的注意。
-   **PWA Strategy:** 网站应被设计为PWA。首次访问时，用一个非侵入式的提示，鼓励用户“添加到主屏幕”，以获得类似App的、便捷的长期访问入口。

#### **Phase 2: Organic Growth & SEO (Day 30 onwards)**
-   **Objective:** 在社区初具规模后，利用口碑和搜索引擎带来持续的自然增长。
-   **Execution:**
    1.  编辑 `robots.txt` 文件，移除 `Disallow` 规则，允许Google等搜索引擎开始索引网站。
    2.  依靠产品独特的体验（实时、匿名、短暂）和社区中产生的高共鸣内容，驱动用户间的“口口相传”。

---

### 2.0 Community Management & Engagement Strategy

#### **The "Guardian" Persona (回音壁守护者)**
-   **Role Definition:** The Guardian不是一个内容创作者，而是一个 **“氛围建筑师”** 和 **“规则守护者”**。其核心任务是维护社区的基调和健康，而非主导对话。
-   **Communication Guidelines (Dos & Don'ts):**
    -   **Do:** 保持神秘、冷静、中立；使用诗意或哲学的语言；在关键时刻发声引导；展现对社区的关怀。
    -   **Don't:** 透露个人信息或观点；参与用户间的争论；滥用管理员权限（如为个人喜好置顶）；过于频繁地发言。

#### **Building Emotional Connection (Low-Effort Methods):**
-   **The `/about` Page Story:** 这是建立连接的基石，通过真诚的“为爱发电”故事和打赏请求，与用户建立信任。
-   **The "Guardian's Journal":** 以极低的频率（例如每周一两次），发布带有特殊标记的官方帖子。
    -   **Focus on Feelings, Not Data:** 绝不直接透露后台统计数据。将数据洞察转化为对社区氛围的感性描述。
        -   **Bad:** `本周“分手”一词出现了30次。`
        -   **Good:** `[#每周回响] 本周的回声里，似乎充满了告别的叹息。愿所有逝去的，都能成为未来的养分。`
    -   **Content Types:** `[#守护者提问]`, `[#今日色彩]`, `[#回声漂流瓶]`等仪式化内容。
-   **Crisis Management:** 当社区出现大规模争论或负面事件时，Guardian应及时发布一个帖子，内容不是站队或评判，而是重申社区规则（如“禁止人身攻击”），并引导大家进行理性、尊重的讨论，扮演“降温阀”的角色。

---

### 3.0 Monetization Execution Plan (Phased)

1.  **Phase 1 (Launch): Donation-First**
    -   **Action:** Ko-fi打赏链接在`/about`页面与网站同步上线。
    -   **Goal:** 验证社区支持意愿，建立“为爱发电”的品牌形象。
2.  **Phase 2 (Post-Launch & Achieving Traction): Apply for AdSense**
    -   **Go/No-Go Criteria:** 当网站达到 **稳定日活100+** 且总帖子数 **超过500条** 时，启动申请流程。
    -   **Action:** 创建`/privacy`页面，详细说明分析工具的使用，然后提交AdSense申请。
3.  **Phase 3 (Post-Approval): Gradual Ad Rollout**
    -   **Action:**
        1.  首先，仅在页面底部激活最不打扰的“粘性横幅广告”。
        2.  观察一周，如果没有强烈的负面反馈，再在`/compose`和`/post/[id]`等页面跳转时加载的广告位。
    -   **Communication:** 可由Guardian发布一篇官方帖子，真诚地说明广告的引入是为了维持运营。
4.  **Phase 4 (Maturity): Direct Sales**
    -   **Go/No-Go Criteria:** 当网站DAU稳定在较高水平（例如500+）并能提供可信的用户数据报告时。
    -   **Action:** 创建`/advertise`页面，主动接触本地校园周边商家，开启更高利润率的直接广告销售。