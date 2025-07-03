# SUC Echo (南方回音壁)

[](https://www.repostatus.org/#active)

**Motto:** 声音只存在一天。(Sounds only exist for a day.)

## Vision

SUC Echo aims to be the premier, trusted, and most vibrant anonymous communication platform for the Southern University College (SUC) community. It is a digital space for sharing fleeting thoughts, secrets, and moments that define the "campus moment," free from the social pressures of permanent, real-name platforms.

## Tech Stack

-   **Framework:** Next.js (with TypeScript)
-   **Database:** Supabase (PostgreSQL)
-   **ORM:** Prisma
-   **Real-time:** Supabase Realtime
-   **Anonymity:** FingerprintJS
-   **Deployment:** Vercel
-   **Styling:** Tailwind CSS

---

## Development Setup Guide

Follow these steps to set up the project locally for development and testing.

### 1\. Prerequisites

-   Node.js (v18.18.0 or later)
-   npm (or yarn/pnpm)
-   Git

### 2\. Initial Project Setup

First, clone the repository and install the project dependencies.

```bash
# Clone the repository
git clone [your-repo-url]
cd sucecho

# Install dependencies, including the 'dotenv-cli' for managing env files
npm install
npm install dotenv-cli --save-dev
```

### 3\. Environment Configuration

This project uses separate databases for production and testing to ensure data safety.

#### **Production Environment**

Create a file named `.env.local`. This file is used by Next.js for your production build and default development environment (`npm run dev`).

**File: `.env.local`**

```env
# Main Production Database URL from Supabase
DATABASE_URL="YOUR_PRODUCTION_DATABASE_URL"

# Supabase API Keys for Production
NEXT_PUBLIC_SUPABASE_URL="YOUR_PRODUCTION_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_PRODUCTION_SUPABASE_ANON_KEY"

# Other Production Variables
JWT_SECRET_KEY="your_strong_jwt_secret"
ADMIN_USERNAME="your_admin_username"
ADMIN_PASSWORD="your_admin_password"
# ... add any other production-specific variables
```

#### **Testing Environment**

Create a second file named `.env.development`. This will be used exclusively for local testing against a separate, safe database.

**File: `.env.development`**

```env
# Testing Database URL from your second Supabase project
DATABASE_URL="YOUR_TESTING_DATABASE_URL"

# Supabase API Keys for Testing
NEXT_PUBLIC_SUPABASE_URL="YOUR_TESTING_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_TESTING_SUPABASE_ANON_KEY"

# You can use the same secrets for local testing or generate new ones
JWT_SECRET_KEY="your_strong_jwt_secret"
ADMIN_USERNAME="your_admin_username"
ADMIN_PASSWORD="your_admin_password"
# ...
```

> **Note:** Get your `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` from your Supabase project settings. You should create two separate projects in Supabase: one for production and one for testing.

### 4\. Database Migration

You need to set up the schema for both your production and testing databases. We use `prisma migrate` to keep them in sync.

**Migrating the Production Database:**
_(Run this once to set up your main database)_

```bash
# Temporarily rename .env.local to .env before running
npm run prisma:migrate:dev
# Rename .env back to .env.local after
```

**Migrating the Testing Database:**
_(Run this once to set up your testing database)_

```bash
# This command uses dotenv-cli to load the correct .env file
npm run prisma:migrate:test
```

### 5\. Running the Application

With everything configured, you can now run the application in different modes.

**Run with the PRODUCTION database:**

```bash
npm run dev
```

**Run with the TESTING database:**

```bash
npm run dev:test
```

### 6\. Package.json Scripts

For reference, your `package.json` should contain these scripts to enable the workflow described above:

```json
"scripts": {
  "dev": "next dev",
  "dev:test": "dotenv -e .env.development -- next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint",
  "prisma:migrate:dev": "prisma migrate dev",
  "prisma:migrate:test": "dotenv -e .env.development -- prisma migrate dev"
}
```

This updated guide should make the setup process much smoother. Let me know if you have any other questions\!
