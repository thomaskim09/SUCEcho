# SUC Echo (南方回音壁)

[![Project Status: Active](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)

**Motto:** 声音只存在一天。(Sounds only exist for a day.)

## Vision

SUC Echo aims to be the premier, trusted, and most vibrant anonymous communication platform for the Southern University College (SUC) community. It is a digital space for sharing fleeting thoughts, secrets, and moments that define the "campus moment," free from the social pressures of permanent, real-name platforms.

## Core Philosophy

This project is built on four pillars:

1.  **Cruel Aesthetics:** Rules are absolute. All posts and their replies are permanently destroyed after 24 hours, creating a unique sense of fairness and ephemerality.
2.  **Absolute Anonymity:** No registration required. Identity is abstracted to focus discussions on content, not the speaker.
3.  **Community Sovereignty:** The community governs itself through a voting system. The role of admins is to guard the rules, not to censor content.
4.  **Minimalist Efficiency:** Every feature is simple, intuitive, and serves a clear purpose, avoiding feature bloat.

## Tech Stack

-   **Framework:** Next.js (with TypeScript)
-   **Database:** Supabase (PostgreSQL)
-   **ORM:** Prisma
-   **Real-time:** Server-Sent Events (SSE)
-   **Anonymity:** FingerprintJS (Community Edition)
-   **Deployment:** Vercel & Supabase
-   **Styling:** Tailwind CSS
-   **Authentication (Admin):** NextAuth.js

## Getting Started

### Prerequisites

-   Node.js (LTS)
-   npm or yarn
-   Git

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    cd sucecho
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory. Copy the contents of an `.env.example` file (you should create this to show what variables are needed) and fill in your Supabase, NextAuth, and other credentials.
4.  **Sync the database schema:**
    ```bash
    npx prisma db pull
    npx prisma generate
    ```
5.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

---

## Important: Next.js 15+ Development Note

A key change in Next.js 15 (especially when using Turbopack) is how parameters from dynamic routes are handled. They must be awaited.

**Problem:** You get an error like `Error: Route "..." used \`params.id\`. \`params\` should be awaited before using its properties.`

**Solution:** Always `await` the `params` object before accessing its properties in both page components and API routes.

### **For Page Components (`/app/post/[id]/page.tsx`):**

````typescript
// Define the params type as a Promise
export type PageParams = Promise<{ id: string }>;

// The component must be async
export default async function MyPage({ params }: { params: PageParams }) {
  // Await the params to get the value
  const { id } = await params;

  // Now you can safely use `id`
  return <div>The post ID is: {id}</div>;
}

---

## Troubleshooting

A quick guide for common setup errors.

### **Problem: Build fails with "params should be awaited" error when using Turbopack.**

* **Symptom:** When running `npm run dev -- --turbo` or building with Next.js 15+, you get an error like `Error: Route "/..." used \`params.id\`. \`params\` should be awaited before using its properties.`
* **Cause:** This is a known issue in some versions of Next.js, particularly with Turbopack. The `params` object in dynamic routes needs to be explicitly awaited, even though it's not a standard Promise.
* **Solution:** In your dynamic route handlers or page components, `await` the params object before accessing its properties.

    ```javascript
    // Example for a page or component
    export default async function MyPage({ params }) {
      const awaitedParams = await params;
      const id = awaitedParams.id;
      // ... use id
    }

    // Example for an API route
    export async function GET(request, { params }) {
      const awaitedParams = await params;
      const id = awaitedParams.id;
      // ... use id
    }
    ```

### **Problem: Database is empty after running a Prisma command.**

* **Symptom:** You run a command, and your Supabase database has no tables, or only a `_prisma_migrations` table.
* **Cause:** For the very first setup, `migrate` is not the right tool. You need to "push" your schema to the empty database.
* **Solution:** Run `npx prisma db push`. This command reads your `schema.prisma` and creates all the tables.
    * **Important:** Remember to use the `.env` rename trick for this command (see below).

### **Problem: Prisma command fails (e.g., `db push`, `migrate`).**

* **Error:** `Environment variable not found: DIRECT_URL`.
* **Cause:** Prisma's command-line tools read from a `.env` file, not `.env.local`.
* **Solution:** **Temporarily rename `.env.local` to `.env`**, run the Prisma command, then **rename it back to `.env.local`** so your app can run.

### **Problem: Editor shows `"No exported member 'PrismaClient'"`**

* **Error:** A red squiggly line appears under your import from `@prisma/client`.
* **Cause:** The editor's TypeScript cache is stale and hasn't seen the newly generated client.
* **Solution:** Restart the TS Server. In VS Code/Cursor, press `Ctrl+Shift+P` (or `Cmd+Shift+P`) and run **`TypeScript: Restart TS Server`**.

### **Problem: App fails to run (`npm run dev`)**

* **Error:** `PrismaClient did not initialize...`
* **Cause:** This usually means the database tables don't exist (see the first problem) or the `DATABASE_URL` is incorrect in your `.env.local` file.
````
