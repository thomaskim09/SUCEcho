# Project Document 5: Technical Specification (Expanded)

**Project Name:** SUC Echo
**Version:** 1.1
**Target:** Development Team / AI Agent
**Date:** June 25, 2025

-----

### 1.0 Technology Stack

| Component | Technology Selection | Justification |
| :--- | :--- | :--- |
| **Framework** | Next.js (with TypeScript) | Integrated front-end/back-end, page-based code splitting, optimal performance. |
| **Database** | Supabase (PostgreSQL) | Robust, scalable relational DB with an excellent free tier and managed services. |
| **ORM** | Prisma | Provides type-safe database access that integrates seamlessly with TypeScript. |
| **Real-time** | Server-Sent Events (SSE) | Lightweight, unidirectional, and perfectly suited for broadcasting feed updates. |
| **Anonymity** | FingerprintJS (Community Ed.) | Core component for generating unique, anonymous browser identifiers for abuse prevention. |
| **Deployment** | Vercel & Supabase | Best-in-class, seamless CI/CD for Next.js and a managed, scalable database backend. |
| **Styling** | CSS Modules / Tailwind CSS | Component-scoped styling and utility-first CSS for rapid, consistent UI development. |
| **Animation** | Framer Motion / CSS Transitions | For creating fluid, physics-based UI animations declaratively. |
| **Authentication** | NextAuth.js (for Admin) | Simplifies adding Google OAuth for the admin panel, allowing for a secure whitelist of admin accounts. |

-----

### 2.0 Database Schema (PostgreSQL)

```sql
-- Main content table. Content is nulled after 24h, row deleted after 180 days.
CREATE TABLE "Post" (
    "id" SERIAL PRIMARY KEY,
    "content" TEXT, -- The actual text of the echo.
    "fingerprintHash" TEXT NOT NULL, -- Foreign key to UserAnonymizedProfile.
    "parentPostId" INTEGER REFERENCES "Post"("id") ON DELETE CASCADE, -- Establishes the thread relationship. NULL if it's a Main Echo.
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated stats for posts. Deleted along with Post after 180 days.
CREATE TABLE "PostStats" (
    "postId" INTEGER PRIMARY KEY REFERENCES "Post"("id") ON DELETE CASCADE,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "hotnessScore" INTEGER NOT NULL DEFAULT 0 -- Stores the total vote count for sorting.
);

-- Records individual votes. Deleted after 180 days.
CREATE TABLE "Vote" (
    "id" SERIAL PRIMARY KEY,
    "postId" INTEGER NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
    "fingerprintHash" TEXT NOT NULL,
    "voteType" SMALLINT NOT NULL, -- 1 for upvote, -1 for downvote
    UNIQUE ("postId", "fingerprintHash") -- Core constraint: one device, one vote per post.
);

-- Anonymized user profiles for moderation. Retained permanently unless user is fully purged.
CREATE TABLE "UserAnonymizedProfile" (
    "fingerprintHash" TEXT PRIMARY KEY,
    "codename" TEXT NOT NULL, -- The readable name, e.g., "Brave-Red-Tiger"
    "purifiedPostCount" INTEGER NOT NULL DEFAULT 0, -- Tracks community reputation.
    "isBanned" BOOLEAN NOT NULL DEFAULT FALSE,
    "banExpiresAt" TIMESTAMP WITH TIME ZONE,
    "firstSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admin actions log. Retained permanently for security and accountability.
CREATE TABLE "AdminLog" (
    "id" SERIAL PRIMARY KEY,
    "targetFingerprintHash" TEXT NOT NULL,
    "action" TEXT NOT NULL, -- e.g., 'BAN_24H', 'DELETE_POST', 'UNBAN'
    "adminId" TEXT NOT NULL, -- Admin's whitelisted email.
    "reason" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

-----

### 3.0 Core Logic & Algorithms

#### Data Retention Cron Job (Nightly):

```sql
UPDATE "Post" SET "content" = NULL WHERE "content" IS NOT NULL AND "createdAt" < NOW() - INTERVAL '24 hours';
DELETE FROM "Post" WHERE "createdAt" < NOW() - INTERVAL '180 days'; -- This will cascade delete related Votes and PostStats due to ON DELETE CASCADE.
```

#### Content Similarity Check (On Main Echo Submission):

  * **Logic:** Use `string-similarity` library. Fetch content of posts from the last hour. Loop through and compare similarity.
  * **Threshold:** If similarity \> 0.85, return a 400-level error with a specific message.

#### Community Purification Logic (On Downvote):

  * **Sequence:**
    1.  A downvote request comes in for `postId`.
    2.  After updating the vote count, fetch the latest `upvotes` and `downvotes` for that `postId`.
    3.  Check if `(upvotes + downvotes >= 20) AND (downvotes / (upvotes + downvotes) >= 0.7)`.
    4.  If true, delete the post from the DB (or mark as `PURIFIED`) and broadcast a `delete_post` SSE event with the `postId`. Update the author's `purifiedPostCount`.

#### Link Handling (On Post Submission):

  * **Regex:** Use a robust regex to detect URLs, e.g., `/(https?:\/\/[^\s]+)/g`.
  * **Whitelist:** `const safeDomains = ['forms.gle', 'docs.google.com'];`
  * **Logic:** For each detected URL, extract its hostname. If `safeDomains.includes(hostname)`, pass a `safeLink` flag and the URL to the frontend. Otherwise, the frontend should render it as plain text.

-----

### 4.0 API & Real-time Endpoints (Conceptual)

  * **POST /api/posts**

      * **Body:** `{ content: string, parentPostId?: number, fingerprintHash: string }`
      * **Response:** `201 Created` with new post data, or `400 Bad Request` if similarity check fails.

  * **POST /api/votes**

      * **Body:** `{ postId: number, voteType: 1 | -1, fingerprintHash: string }`
      * **Response:** `200 OK` with updated vote counts, or `403 Forbidden` if already voted.

  * **GET /api/feed**

      * **Response:** Paginated list of initial posts with their stats.

  * **GET /api/live (SSE Endpoint):**

      * Establishes a persistent connection.
      * Server sends events with `event: <eventName>` and `data: <JSON_payload>`.
      * **Events:** `new_post`, `update_vote`, `delete_post`, `destroy_post`.

  * **Admin API (/api/admin/...):**

      * Protected by NextAuth.js middleware, checking if the session user's email is in the admin whitelist.
      * **e.g., POST /api/admin/ban, Body:** `{ fingerprintHash: string, duration: '24h' | '7d' | 'permanent', reason: string }`.