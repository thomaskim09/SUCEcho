# SUC Echo - V1.0 Development Plan (with Real-time SSE)

This document outlines the step-by-step commits to build the **Minimum Viable Product (MVP)** for SUC Echo, including the core real-time feed feature.

---

## Phase 1: Project Foundation & Core UI

This phase remains the same: setting up the project structure, styling, and static UI components.

* **Commit 1: init: Project Setup & Styling Foundation**
    * **Goal:** Clean the boilerplate, establish the visual theme, and set up fonts.

* **Commit 2: feat: Define core types and implement PostCard component**
    * **Goal:** Create a reusable component for displaying a single post and establish a centralized type definition.

* **Commit 3: feat: Implement dedicated page and form for post composition**
    * **Goal:** Create the UI for users to write and submit new posts on a separate page.

---

## Phase 2: Backend Logic & Database Integration

This phase remains the same: connecting the application to the database for creating and reading data.

* **Commit 4: fix: Stabilize Prisma Client initialization**
    * **Goal:** Implement the robust singleton pattern for Prisma to prevent database connection errors.

* **Commit 5: feat: Create API endpoint for post submission**
    * **Goal:** Build the backend API route to handle the creation of new posts.

* **Commit 6: feat: Connect compose form to API and add fingerprinting**
    * **Goal:** Make the "Compose" form functional by sending its data to the API and integrating FingerprintJS.

* **Commit 7: feat: Create API endpoint to fetch posts**
    * **Goal:** Build the API route to retrieve all posts for the initial page load.

---

## Phase 3: Displaying Dynamic Data

This phase now focuses on the initial data load, which will be enhanced with real-time updates in the next phase.

* **Commit 8: feat: Fetch and display posts on homepage**
    * **Goal:** Replace the hardcoded sample post with a live feed of posts from the database on initial page load.
    * **Files to Modify:** `sucecho/src/app/page.tsx`.

---

## Phase 4: Real-time Implementation with Server-Sent Events (SSE)

This is the new phase dedicated to building the live feed functionality.

* **Commit 9: feat: Implement SSE event broadcasting mechanism**
    * **Goal:** Create a simple, in-memory event emitter to broadcast messages to all connected clients. This is the backbone of the real-time system.
    * **Files to Create:** `sucecho/src/lib/event-emitter.ts`. This file will export a singleton instance of Node's `EventEmitter`.

* **Commit 10: feat: Create SSE API route for live connections**
    * **Goal:** Establish a long-lived connection endpoint that clients can subscribe to for updates.
    * **Files to Create:** `sucecho/src/app/api/live/route.ts`. This `GET` route will keep the connection open and listen for events from the broadcaster, sending them to the client as they occur.

* **Commit 11: feat: Integrate event broadcasting into mutations**
    * **Goal:** Trigger live updates whenever data changes.
    * **Files to Modify:**
        * `sucecho/src/app/api/posts/route.ts`: After successfully creating a new post, use the event emitter to broadcast a `new_post` event with the new post's data.
        * `sucecho/src/app/api/votes/route.ts`: After a vote is successful, broadcast an `update_vote` event with the `postId` and new vote counts.

* **Commit 12: feat: Connect homepage to live SSE feed**
    * **Goal:** Make the homepage UI update in real-time without needing a manual refresh.
    * **Files to Create/Modify:**
        * Create a new client component, e.g., `sucecho/src/app/components/PostFeed.tsx`. This component will take the initial posts as a prop.
        * Inside a `useEffect` hook, it will connect to the `/api/live` SSE endpoint.
        * It will listen for `new_post` and `update_vote` events and update its internal state accordingly, causing the UI to re-render with the new data.
        * Modify `sucecho/src/app/page.tsx` to use this new `PostFeed` component.

---

## Phase 5: Final V1.0 Features & Polish

This final phase includes voting, cron jobs, and UI refinement.

* **Commit 13: feat: Implement voting API and client-side logic**
    * **Goal:** Create the backend for voting and connect the UI buttons.
    * **Files to Create/Modify:**
        * `sucecho/src/app/api/votes/route.ts`: Create the `POST` handler for votes.
        * `sucecho/src/app/components/PostCard.tsx`: Add state and `onClick` handlers for voting.

* **Commit 14: feat: Implement community purification logic**
    * **Goal:** Add auto-deletion for heavily downvoted posts.
    * **Files to Modify:** `sucecho/src/app/api/votes/route.ts`.

* **Commit 15: feat: Implement 24-hour data destruction job**
    * **Goal:** Create the cron job API route for nullifying old post content.
    * **Files to Create:** `sucecho/src/app/api/cron/route.ts`.

* **Commit 16: feat: Create static info pages**
    * **Goal:** Build the `/about` and `/how-it-works` pages.

* **Commit 17: feat: Add basic navigation**
    * **Goal:** Create a reusable `Header` component with navigation.

* **Commit 18: refactor: Final UI/UX polish**
    * **Goal:** Add animations and ensure design consistency.