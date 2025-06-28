# SUC Echo - V1.0 Development Plan (Refined)

This plan is adjusted to prioritize core feature completion (Replies, Admin Login) before final polishing and launch. Automated testing is postponed to a future version.

---

## Phase 1-5: Core Implementation (Partially Completed)

The initial phases covering UI, backend logic, real-time feed, and the post detail view are established. We will now build upon this foundation.

---

## Phase 6: Core Feature Completion

This phase focuses on implementing the remaining critical user and admin functionalities required for V1.0.

- **Commit 15: feat(replies): Implement reply creation flow**

  - **Goal:** Allow users to reply to a main post from the post detail page.
  - **Justification:** Completes the primary user interaction loop of reading and responding.
  - **Files to Create/Modify:**
    - `sucecho/src/app/post/[id]/page.tsx`: Add a "Reply" button that links to `/compose?parentPostId=[id]`.
    - `sucecho/src/app/compose/page.tsx`: Modify the page to handle the `parentPostId` query parameter.
    - `sucecho/src/app/components/CreatePostForm.tsx`: Update the form to read the `parentPostId` and include it in the submission.
    - `sucecho/src/app/api/posts/route.ts`: Enhance the `POST` handler to link a reply to its parent post and update the parent's `replyCount`.

- **Commit 16: feat(admin): Create simple username/password admin login**

  - **Goal:** Implement a basic but secure login system for administrators, replacing the need for an external OAuth provider.
  - **Justification:** Provides a self-contained authentication mechanism as requested.
  - **Files to Create/Modify:**
    - `.env.local` & `.env.example`: Add `ADMIN_USERNAME` and `ADMIN_PASSWORD` variables.
    - `sucecho/src/app/admin-login/page.tsx`: Create a new, simple login page.
    - `sucecho/src/app/api/admin/login/route.ts`: Create the API endpoint to verify credentials and set a secure, HttpOnly session cookie.
    - `sucecho/src/app/api/admin/logout/route.ts`: Create an endpoint to clear the session cookie.

- **Commit 17: feat(admin): Protect admin routes with middleware**
  - **Goal:** Secure all future admin-related pages and API endpoints.
  - **Justification:** Ensures that only authenticated administrators can access sensitive areas.
  - **Files to Create/Modify:**
    - `sucecho/src/middleware.ts`: Create a new middleware file to intercept requests to `/api/admin/**` (excluding login/logout) and future `/admin/**` pages, verifying the session cookie.

---

## Phase 7: Final Polish & Launch Prep

This final phase remains the same, focusing on adding the high-impact "magic" that makes the app feel complete and polished.

- **Commit 18: feat: Implement "My Echoes" page using localStorage**

  - **Goal:** Create the `/my-echoes` page for users to track their own posts on their device.

- **Commit 19: feat: Add first-visit onboarding animation**

  - **Goal:** Implement the "pixel dust" welcome animation to educate new users on the core concepts.

- **Commit 20: refactor: Final UI/UX polish and code cleanup**
  - **Goal:** Address any remaining UI inconsistencies, add subtle animations, and ensure the codebase is clean for launch.

---

## Future (Post V1.0)

- **Testing & Stability:** Introduce Playwright for E2E testing to ensure long-term stability as the app grows.
- **V1.1 Features:** Implement features like Anonymous Polls and Daily Color.
