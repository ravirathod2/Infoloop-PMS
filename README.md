# InfoLoop PMS

Project management app: React (Vite) + Firebase Auth + Firestore. Dark UI built on the Linear-style design system (tokens in `src/styles/app.css`).

## Run

```powershell
npm install
npm run dev
```

With an empty `.env` the app runs in **demo mode**: auth and data live in the browser (`localStorage`) and a sample workspace is seeded on sign-up. Nothing else is needed to try it.

## Connect Firebase (real data)

1. Firebase console → create a project → **Add app → Web** → copy the config.
2. **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
3. **Firestore Database → Create database** (production mode), then paste `firestore.rules` into the **Rules** tab and publish (or `firebase deploy --only firestore:rules`).
4. Copy `.env.example` to `.env` and fill the six `VITE_FIREBASE_*` values.
5. Restart `npm run dev`. The "Demo mode" badge in the sidebar disappears when Firebase is connected.

For Google sign-in, `localhost` is authorised by default; add your production domain under Authentication → Settings → Authorized domains.

## Firestore data model

```
users/{uid}                  profile: name, email, phone, provider
users/{uid}/projects/{id}    name, client, description, startDate, deadline, status
users/{uid}/tasks/{id}       projectId, title, description, status, priority, assigneeId,
                             deadline, order, checklist[], comments[]
users/{uid}/members/{id}     name, email, role, phone, isOwner
emailIndex/{email}           { uid }  – only used by "Forgot password" to answer "does this user exist?"
```

Every user only ever reads/writes their own `users/{uid}` subtree (enforced in `firestore.rules`), so projects, tasks, members and the dashboard are unique per account.

## Structure

- `src/auth/` – `AuthContext`, `firebaseAuth.js`, `demoAuth.js` (same API)
- `src/data/` – `firestoreStore.js`, `demoStore.js` (same API), `DataContext` (live subscriptions)
- `src/pages/` – Auth, ForgotPassword, Dashboard, Projects, ProjectBoard, TaskDetail, Members, ComingSoon
- `src/components/` – shell, shared UI, project/task modals

## Definitions

- **Active project** = any project not Completed. **Pending task** = not Done. **Overdue task** = deadline passed and not Done.
- **Project progress** = Done tasks ÷ all tasks of that project.

## Member logins

The owner can create a member **with a password**; that member logs in with their email and works inside the owner's workspace (same projects, tasks, clients and members). Each member row has **Reset password** (or **Set password** for members without a login yet), with a checkbox **Log out this user from everywhere**.

- **Demo mode:** works in the browser, nothing to set up.
- **Firebase:** creating logins, setting other users' passwords and revoking sessions need the Admin SDK, so they run as Cloud Functions in `functions/` (`createMember`, `setMemberPassword`, `deleteMemberAccount`). Cloud Functions require the **Blaze** (pay-as-you-go) plan.

```powershell
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

Only the workspace owner can use these actions (enforced in the functions). Members currently have full access to the workspace data except managing logins; finer permissions belong to the "Roles & permissions" feature.

## Access rules (admin vs member)

- Whoever signs up (email or Google) is the **admin** of their own workspace. Nothing in it is visible to any other account.
- Members created by the admin log in and work inside that workspace, but only see:
  - **projects** they are part of (team member or responsible person),
  - **tasks** assigned to them (inside those projects),
  - a **dashboard** computed from just that data.
- Members cannot create or delete projects/tasks, reassign tasks, or open the Clients and Members pages. They can update the status, checklist and notes of their own tasks.
- This is enforced in `firestore.rules` (the database refuses other reads), not only hidden in the UI. Publish the rules after every change to that file.
- `npm run dev:demo` runs the app in local demo mode on port 5180 even when `.env` is filled in.

## Sample data

A new workspace starts empty. As admin, click **Load sample data** on the empty dashboard (or in the user menu at the bottom of the sidebar) to add ~14 members, 9 clients, 11 projects and ~40 tasks that cover many cases: every status, overdue and due-today items, a 13-person team, unassigned tasks, inactive members, missing photos and rates, long names.

## Photos

Members and clients get a photo by uploading an image file. It is cropped to a 256px square JPEG (about 10-30 KB) and saved on the record itself, so no Firebase Storage is needed.
