// Local demo auth (no Firebase). For UI development only: passwords are stored in localStorage.
import { demoStore } from '../data/demoStore';
import { newId } from '../lib/utils';

const USERS = 'pms.demo.users';
const SESSION = 'pms.demo.session';
const listeners = new Set();

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS)) || [];
  } catch {
    return [];
  }
};
const writeUsers = (u) => localStorage.setItem(USERS, JSON.stringify(u));
const fail = (message, field) => Object.assign(new Error(message), { field });
const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));

// A member's profile points at the workspace (owner uid) whose data they work in.
const publicProfile = ({ password, sessionsRevokedAt, ...rest }) => ({ ...rest, workspaceId: rest.workspaceId || rest.uid });

function readSession() {
  const raw = localStorage.getItem(SESSION);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (s && s.uid) return s;
  } catch {
    /* older format: plain uid */
  }
  return { uid: raw, at: 0 };
}

/** The signed-in user, or null. A session started before the account's `sessionsRevokedAt` is dropped. */
function currentUser() {
  const s = readSession();
  if (!s) return null;
  const user = readUsers().find((u) => u.uid === s.uid);
  if (!user || (user.sessionsRevokedAt && user.sessionsRevokedAt > s.at)) {
    localStorage.removeItem(SESSION);
    return null;
  }
  return user;
}

const emit = () => {
  const u = currentUser();
  const profile = u ? publicProfile(u) : null;
  listeners.forEach((fn) => fn(profile));
};

function setSession(user) {
  if (user) localStorage.setItem(SESSION, JSON.stringify({ uid: user.uid, at: Date.now() }));
  else localStorage.removeItem(SESSION);
  emit();
  return user ? publicProfile(user) : null;
}

function createUser(data, { seedWorkspace = true } = {}) {
  const uid = newId();
  const user = {
    uid, phone: '', photoURL: '', createdAt: Date.now(), workspaceId: uid, ...data, email: data.email.trim().toLowerCase(),
  };
  writeUsers([...readUsers(), user]);
  if (seedWorkspace) demoStore.seed(user.uid, user);
  return user;
}

const emailTaken = (email) => readUsers().some((u) => u.email === email.trim().toLowerCase());

if (typeof window !== 'undefined') {
  // Another tab (or a password reset with "log out everywhere") may have ended this session.
  window.addEventListener('storage', emit);
  window.addEventListener('focus', emit);
}

export const demoAuth = {
  subscribe(cb) {
    listeners.add(cb);
    queueMicrotask(() => {
      const u = currentUser();
      cb(u ? publicProfile(u) : null);
    });
    return () => listeners.delete(cb);
  },

  async signUpEmail({ name, email, phone, password }) {
    await wait();
    if (emailTaken(email)) throw fail('An account with this email already exists. Try logging in.', 'email');
    return setSession(createUser({ name: name.trim(), email, phone: phone.trim(), password, provider: 'password' }));
  },

  async signInEmail({ email, password }) {
    await wait();
    const user = readUsers().find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) throw fail('Incorrect email or password.', 'password');
    return setSession(user);
  },

  async signInGoogle() {
    await wait();
    const email = 'demo.google@example.com';
    const user = readUsers().find((u) => u.email === email) || createUser({ name: 'Demo Google User', email, provider: 'google' });
    return setSession(user);
  },

  async signOut() {
    setSession(null);
  },

  async userExists(email) {
    await wait(300);
    return emailTaken(email);
  },

  // ── Member logins (managed by the workspace owner) ──

  /** Creates a login that works inside the owner's workspace. Returns the new uid. */
  async createMemberAccount({ workspaceId, memberId, name, email, phone = '', password }) {
    await wait(300);
    if (emailTaken(email)) throw fail('An account with this email already exists.', 'email');
    return createUser({ name, email, phone, password, provider: 'password', workspaceId, memberId }, { seedWorkspace: false }).uid;
  },

  async setPassword(uid, password, revokeSessions) {
    await wait(300);
    const users = readUsers();
    const i = users.findIndex((u) => u.uid === uid);
    if (i < 0) throw fail('This member has no login account.');
    users[i] = { ...users[i], password, ...(revokeSessions ? { sessionsRevokedAt: Date.now() } : {}) };
    writeUsers(users);
    if (revokeSessions) emit();
  },

  async deleteAccount(uid) {
    writeUsers(readUsers().filter((u) => u.uid !== uid));
    emit();
  },
};
