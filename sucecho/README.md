---

## Important: Next.js 15+ Development Note

A key change in Next.js 15 (especially when using Turbopack) is how parameters from dynamic routes are handled. They must be awaited.

**Problem:** You get an error like `Error: Route "..." used \`params.id\`. \`params\` should be awaited before using its properties.`

**Solution:** Always `await` the `params` object before accessing its properties in both page components and API routes.

### **For Page Components (`/app/post/[id]/page.tsx`):**

```typescript
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