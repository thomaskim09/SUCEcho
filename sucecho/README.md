---

## Troubleshooting

A quick guide for common setup errors.

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