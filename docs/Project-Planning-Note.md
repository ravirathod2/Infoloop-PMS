# Infoloop Project Management App: Planning Note

**Candidate:** Ravi Rathod | **Assessment:** AI-Assisted Application Development

---

## 1. Understanding of the Requirements

**Problem.** Infoloop management needs one internal place to track **clients, projects, tasks, team responsibilities, deadlines and progress**. Today this is scattered, so nobody has a single view of what is late or who owns what.

**What the app must do**
1. **Authentication:** register, log in, protected pages, session handling.
2. **Projects:** create, view, edit. Client, description, start date, deadline, status (Not Started, In Progress, On Hold, Completed).
3. **Tasks:** created under a project, assigned to a team member, with priority, deadline and status. Pending and overdue tasks are identified.
4. **Dashboard:** total, active and completed projects; pending and overdue tasks; clear progress.
5. **Database:** data persists after refresh, with proper project-to-task relationships.

**Beyond the brief (my judgement calls)**
- **Clients** and **Members** modules, because projects belong to clients and tasks need people.
- **Two roles:** the **Admin** sees everything; a **Member** sees only projects and tasks assigned to them. A management tool must not expose all data to everyone.
- **Not built yet** (shown as "Coming soon"): Roles & permissions, Invoices, Reports, Timeline, Apps & URLs.

**Questions I would clarify with stakeholders before building**
1. Why build instead of using Already available tools? What problem are the current tools not solving?
2. Which tools were already evaluated (Jira, ClickUp, Linear, Asana)? What did the team like and dislike?
3. Is subscription cost the main pain? Were free tiers or open-source options compared?
4. Internal use only, or a product to sell later? This changes multi-tenancy, billing and security effort.
5. How many users, and which roles and permissions are needed?

**Phase plan:** (1) Discovery and tool research, (2) Design system and data model, (3) Foundation: auth and database, (4) Core modules, (5) Access rules, testing, UAT, (6) Deploy and handover.

---

## 2. Technology Stack and Architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite, React Router, plain CSS (Linear-style design system) | Fast, familiar, component-based |
| Auth | Firebase Authentication (email/password + Google) | Secure sessions without building my own |
| Database | Cloud Firestore (NoSQL) | Familiar, real-time updates, zero server to manage |
| Backend logic | Firebase Security Rules + Cloud Functions (Node 22) | Rules protect data; functions do admin-only work (create member logins, reset passwords) |
| Hosting | Vercel (frontend), Firebase (backend) | Simple deploys, HTTPS by default |
| Source control | GitHub | Versioning, README, review |

**Architecture**

```
Browser (React app on Vercel)
  |-- Firebase Auth ........ sign up / log in / Google
  |-- Firestore ............ reads and writes, live updates
  |       ^-- Security Rules: admin sees all, member sees assigned only
  |-- Cloud Functions ...... createMember, setMemberPassword, deleteMemberAccount
                              (Firebase Admin SDK)
```

**Data model and relationships**

```
users/{adminId}                  workspace owner (Admin)
  |-- clients/{id}
  |-- members/{id}               linked to a login account
  |-- projects/{id}              clientId, memberIds[], responsibleId
  |-- tasks/{id}                 projectId, assigneeId
```

1. One **Admin workspace** owns all its data. Another account never sees it.
2. **Client 1 -> many Projects.**
3. **Project 1 -> many Tasks.**
4. **Project many <-> many Members** (team), plus one **responsible** member.
5. **Task -> one assigned Member.**
6. A **Member** can have a login; that login is tied to the Admin's workspace.

**API surface** (the app calls Firebase directly; there is no custom REST server yet)

| Module | Operations | Count |
|---|---|---|
| Authentication | Register, login, Google login, logout, email-exists check | 5 |
| Projects | Create, read, update, delete (cascades to tasks) | 4 |
| Tasks | Create, read, update (status, assignee, checklist, notes), delete | 4 |
| Clients | Create, read, update, delete | 4 |
| Members | Create, read, update, delete | 4 |
| Cloud Functions | `createMember`, `setMemberPassword`, `deleteMemberAccount` | 3 |
| Sample data | Bulk load | 1 |
| **Total** | | **25** |

**Why Firestore now, and what I would change for scale**
- Chosen for **speed of delivery** and my current familiarity (4 to 6 hour assessment).
- The data is **relational** (client -> project -> task -> member), and reporting needs joins and aggregations. At scale I would move to **PostgreSQL** (or **MongoDB** if the team prefers a document model), behind a **Node.js API** on **Railway or Render**.
- Trade-off today: Firestore has no joins, so relations are handled in the app, and cost grows with reads.

---

## 3. Key Milestones and Estimated Effort

*Estimates assume AI-assisted development.*

| # | Milestone / Module | Deliverable | Est. effort |
|---|---|---|---|
| 1 | Setup and design system | Project scaffold, Linear-style UI tokens | 0.5 h |
| 2 | Authentication | Email and Google sign-up/login, protected routes, sessions | 1 h |
| 3 | Database and rules | Firestore structure, security rules | 0.5 h |
| 4 | Projects | Create, view, edit, status, active/completed views | 1 h |
| 5 | Tasks | Board, assignee, priority, deadline, overdue logic | 1.5 h |
| 6 | Dashboard | Totals, pending/overdue, progress chart | 0.5 h |
| 7 | Deploy, testing, docs | Live URL, README, test cases, UAT | 1 h |
| | **Core scope subtotal** | | **~6 h** |
| 8 | Clients, Members, role-based access | Extra modules, admin vs member visibility, member logins | ~3 h |
| | **Total** | | **~9 h** |

---

## 4. Technical Challenges and Dependencies

### Dependencies (what must stay true for the app to work)
1. **Firebase billing is active** (Blaze plan, valid card, budget alert). Cloud Functions stop if billing fails.
2. **Vercel project is live** and within its plan limits.
3. **Environment variables** set on Vercel (names only: the `VITE_FIREBASE_*` set). Missing values break login.
4. **Firebase Authentication providers** enabled (Email/Password, Google).
5. **Authorized domains** include the Vercel domain, or Google sign-in fails.
6. **Firestore Security Rules deployed**. Without them, no data is readable or protected.
7. **Cloud Functions deployed** and healthy, or member logins cannot be created.
8. **SPA route rewrites** on Vercel, or refreshing a deep link gives a 404.
9. **Firebase quotas** (reads, writes, function calls) not exceeded.
10. **Google services availability** (Auth, Firestore, OAuth).
11. **Daily backup schedule** configured and a restore tested.
12. **Password-reset email** not built yet; needs an email service later.
13. **Third-party libraries** (React, Firebase SDK) kept updated for security fixes.
14. **HTTPS and a custom domain** (if wanted) configured correctly.
15. **Monitoring and alerts** (errors, uptime, cost) so failures are noticed quickly.

**If I move to a custom backend later** (Railway or Render): the server must be **always running**. That means a valid payment card, a paid plan that does not "sleep" when idle, health checks and uptime alerts.

### Challenges faced (with examples)
1. **Creating logins for team members.** A browser cannot create or reset another user's login safely. *Fix:* three Cloud Functions using the Admin SDK. *Example:* the "Add member" form failed with `internal` until the functions were deployed (they need the Blaze plan).
2. **Showing each person only their data.** *Fix:* Firestore Security Rules plus queries that match them. *Example:* a member now sees only their assigned projects and tasks, and Clients/Members pages are admin-only.
3. **A login not linked to its member record.** *Example:* a new member logged in and saw an empty dashboard. Testing caught it; the login now stores its member ID.
4. **Stale screens after adding data.** *Example:* a new member did not appear in the list because the data was changed in place. *Fix:* return fresh copies so the screen updates.
5. **Configuration errors.** *Example:* Firebase keys pasted in the wrong format in `.env`. Fixed by using `VITE_` variables and restarting the dev server.

---

## 5. Data Backup

1. **Daily automatic backup** of Firestore.
2. **Retention: 7 days.** Older backups are deleted automatically.
3. Run a **restore test** once to prove the backup works.
4. **Status:** [TODO: confirm configured on the Firebase project]

---

## 6. Testing Approach

1. For each **user story**, write **acceptance criteria**, then derive **test cases** from them.
2. **Execute** the test cases and log results (pass / fail / fix / retest).
3. Include **role checks** (admin vs member) and **data isolation** (a second account must not see the first account's data).
4. Re-test affected areas after every bug fix (regression).
5. Finish with my own **User Acceptance Testing (UAT)** on the deployed app.

| Example story | Acceptance criteria | Test case |
|---|---|---|
| As a member, I see only my projects | Unassigned projects are hidden | Log in as a member; open an unassigned project URL; expect "not found" |
| As an admin, I see overdue tasks | Past-deadline, not-done tasks are flagged | Add a task with a past deadline; check the dashboard count |
| As a user, my data persists | Records survive a refresh | Create a project, refresh, confirm it remains |

*Next step for production:* automated tests (unit tests, plus security-rule tests on the Firebase emulator).

---

## 7. Production Readiness (for the technical discussion)

- **Security:** Security Rules enforce access; secrets stay out of Git (`.env` ignored); Firebase web keys are public by design, so protection comes from the rules.
- **Scalability:** move to PostgreSQL or MongoDB behind a Node API, add pagination and indexes, and cache reads.
- **Maintainability:** modular code (pages, components, data layer), README with setup steps, and a demo mode that runs without Firebase.

---

## 8. AI Usage Summary

- **Tool:** Claude Code, used to build the frontend, the Firebase integration and the Cloud Functions.
- **Design input:** I supplied the Linear design guidelines so the UI follows them: https://getdesign.md/linear.app/design-md
- **What I owned:** requirements, data model and access rules, Firebase setup and deployment, reviewing generated code, testing, and debugging. [TODO: edit to match what you personally did]

---

## 9. Submission Links

| Item | Link |
|---|---|
| Live application | [TODO: Vercel URL] |
| GitHub repository | [TODO: repo URL] (README with stack, setup, structure and env variable names is included) |
| Loom video | [TODO: Loom URL] |
