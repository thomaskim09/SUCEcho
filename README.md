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

* **Framework:** Next.js (with TypeScript)
* **Database:** Supabase (PostgreSQL)
* **ORM:** Prisma
* **Real-time:** Server-Sent Events (SSE)
* **Anonymity:** FingerprintJS (Community Edition)
* **Deployment:** Vercel & Supabase
* **Styling:** Tailwind CSS
* **Authentication (Admin):** NextAuth.js

## Getting Started

### Prerequisites

* Node.js (LTS)
* npm or yarn
* Git

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