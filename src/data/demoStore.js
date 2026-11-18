// Local demo store: same API as the Firestore store, persisted in localStorage.
import { addDays, newId } from '../lib/utils';

const key = (uid) => `pms.demo.data.${uid}`;
const cache = new Map();
const listeners = new Map();

const empty = () => ({ projects: [], tasks: [], members: [], clients: [] });

function load(uid) {
  if (cache.has(uid)) return cache.get(uid);
  let data;
  try {
    data = JSON.parse(localStorage.getItem(key(uid))) || empty();
  } catch {
    data = empty();
  }
  data.clients ||= [];
  topUpClients(data);
  enrichProjects(data);
  applyAvatars(data);
  cache.set(uid, data);
  return data;
}

function commit(uid) {
  const data = load(uid);
  try {
    localStorage.setItem(key(uid), JSON.stringify(data));
  } catch {
    /* storage unavailable: keep in memory */
  }
  // fresh array copies so memoised lists in React see the change
  const snapshot = { projects: [...data.projects], tasks: [...data.tasks], members: [...data.members], clients: [...data.clients], ready: true };
  listeners.get(uid)?.forEach((fn) => fn(snapshot));
}

function dummyClients(now) {
  const c = (name, company, email, phone, hourlyRate, currency, status, address, notes) => ({
    id: newId(), name, company, email, phone, hourlyRate, currency, status, address, notes, createdAt: now,
  });
  return [
    c('Priya Shah', 'Acme Corp', 'priya@acme.example', '+91 98200 11122', 3000, 'INR', 'active', 'Mumbai, India', 'Prefers weekly Friday updates.'),
    c('Tom Becker', 'Northwind Traders', 'tom@northwind.example', '+1 555 0142', 60, 'USD', 'active', 'Seattle, USA', 'Invoices are paid within 15 days.'),
    c('Lena Fischer', 'Lumen Studio', 'lena@lumen.example', '+49 30 5550 191', 45, 'EUR', 'inactive', 'Berlin, Germany', 'Brand project delivered.'),
    c('Marcus Reid', 'Harbor Foods', 'marcus@harbor.example', '+44 20 7946 0321', 55, 'GBP', 'prospect', 'London, UK', 'Interested in a Q1 campaign. Send proposal.'),
    c('Neha Kapoor', 'Orbit Logistics', 'neha@orbit.example', '+91 99100 45678', 2500, 'INR', 'active', 'Bengaluru, India', 'Needs data access approval before work resumes.'),
    c('Daniel Okafor', 'Brightpath Education', 'daniel@brightpath.example', '', 50, 'USD', 'prospect', 'Austin, USA', ''),
    c('Sofia Marino', 'Verde Interiors', 'sofia@verde.example', '+39 02 5550 144', 40, 'EUR', 'active', 'Milan, Italy', 'Prefers email over calls.'),
  ];
}

/** Gives demo projects a team, a responsible person and a budget (once), and adds a few more demo members. */
function enrichProjects(data) {
  if (data.projectsEnriched || !data.members.length || !data.projects.length) return;
  const extra = [
    ['Meera Iyer', 'meera@example.com', 'Backend Developer', 'Engineering', 2000, 'active'],
    ['Jonas Weber', 'jonas@example.com', 'DevOps Engineer', 'Engineering', 2200, 'active'],
    ['Kenji Sato', 'kenji@example.com', 'UX Researcher', 'Design', 1500, 'active'],
    ['Amara Njoku', 'amara@example.com', 'Marketing Lead', 'Marketing', 1700, 'active'],
  ];
  const have = new Set(data.members.map((m) => m.email.toLowerCase()));
  extra.forEach(([name, email, role, department, hourlyRate, status]) => {
    if (!have.has(email)) data.members.push({ id: newId(), name, email, role, department, hourlyRate, currency: 'INR', status, phone: '', createdAt: Date.now() });
  });
  const dept = { 'aarav@example.com': ['Engineering', 1800], 'sara@example.com': ['Design', 1600], 'diego@example.com': ['QA', 1200] };
  data.members.forEach((m) => {
    const d = dept[m.email.toLowerCase()];
    if (d && !m.department) { m.department = d[0]; m.hourlyRate = d[1]; m.currency = 'INR'; }
  });
  const active = data.members.filter((m) => m.status !== 'inactive');
  const budgets = [850000, 1200000, 400000, 600000, 300000];
  data.projects.forEach((p, i) => {
    if (p.memberIds) return;
    const count = [5, 3, 2, 4, 6][i % 5];
    const team = Array.from({ length: Math.min(count, active.length) }, (_, k) => active[(i + k) % active.length]);
    p.memberIds = team.map((m) => m.id);
    p.responsibleId = team[0]?.id || '';
    p.budget = budgets[i % budgets.length];
    p.budgetCurrency = 'INR';
  });
  data.projectsEnriched = true;
}

// Dummy photos for the sample people (paths into public/avatars). Applied once per demo account.
const PHOTO = {
  'aarav@example.com': 'man-2', 'sara@example.com': 'woman-1', 'diego@example.com': 'man-3', 'meera@example.com': 'woman-2',
  'jonas@example.com': 'man-1', 'kenji@example.com': 'man-3', 'amara@example.com': 'woman-1',
  'priya@acme.example': 'woman-2', 'tom@northwind.example': 'man-1', 'lena@lumen.example': 'woman-1',
  'marcus@harbor.example': 'man-3', 'neha@orbit.example': 'woman-2', 'daniel@brightpath.example': 'man-2', 'sofia@verde.example': 'woman-1',
};
function applyAvatars(data) {
  if (data.avatarsApplied) return;
  const pick = (x) => {
    const key = x.isOwner ? 'man-2' : PHOTO[(x.email || '').toLowerCase()];
    if (key && !x.avatar) x.avatar = `/avatars/${key}.png`;
  };
  data.members.forEach(pick);
  data.clients.forEach(pick);
  data.avatarsApplied = true;
}

function topUpClients(data) {
  if (data.clientsSeeded || !data.members.length) return;
  const have = new Set(data.clients.map((x) => x.email.toLowerCase()));
  data.clients.push(...dummyClients(Date.now()).filter((x) => !have.has(x.email.toLowerCase())));
  data.clientsSeeded = true;
}

function seed(uid, profile) {
  const data = load(uid);
  if (data.projects.length || data.members.length) return;
  const now = Date.now();
  const me = { id: newId(), name: profile.name, email: profile.email, role: 'Admin', department: 'Operations', status: 'active', hourlyRate: 2500, currency: 'INR', phone: profile.phone || '', isOwner: true, createdAt: now };
  const m2 = { id: newId(), name: 'Aarav Mehta', email: 'aarav@example.com', role: 'Frontend Developer', department: 'Engineering', status: 'active', hourlyRate: 1800, currency: 'INR', phone: '', createdAt: now };
  const m3 = { id: newId(), name: 'Sara Collins', email: 'sara@example.com', role: 'Product Designer', department: 'Design', status: 'active', hourlyRate: 1600, currency: 'INR', phone: '', createdAt: now };
  const m4 = { id: newId(), name: 'Diego Alvarez', email: 'diego@example.com', role: 'QA Engineer', department: 'QA', status: 'inactive', hourlyRate: 1200, currency: 'INR', phone: '', createdAt: now };
  data.members = [me, m2, m3, m4];

  const p1 = { id: newId(), name: 'Website Redesign', client: 'Acme Corp', description: 'Rebuild the marketing site with a new design system, faster pages and a simple CMS.', status: 'in_progress', startDate: addDays(-24), deadline: addDays(18), createdAt: now };
  const p2 = { id: newId(), name: 'Mobile App Launch', client: 'Northwind Traders', description: 'Ship the first public release of the iOS and Android customer app.', status: 'in_progress', startDate: addDays(-40), deadline: addDays(-2), createdAt: now };
  const p3 = { id: newId(), name: 'Brand Identity Refresh', client: 'Lumen Studio', description: 'Logo, typography and brand guidelines for the Lumen rebrand.', status: 'completed', startDate: addDays(-75), deadline: addDays(-20), createdAt: now };
  const p4 = { id: newId(), name: 'Q4 Marketing Campaign', client: 'Harbor Foods', description: 'Plan and produce the seasonal campaign across email, social and paid.', status: 'not_started', startDate: addDays(7), deadline: addDays(60), createdAt: now };
  const p5 = { id: newId(), name: 'Analytics Dashboard', client: 'Orbit Logistics', description: 'Internal reporting dashboard for fleet performance. Paused until data access is approved.', status: 'on_hold', startDate: addDays(-14), deadline: addDays(35), createdAt: now };
  data.projects = [p1, p2, p3, p4, p5];

  let o = now;
  const t = (projectId, title, status, priority, assignee, deadline, description = '', checklist = []) => ({
    id: newId(), projectId, title, status, priority, assigneeId: assignee?.id || '', deadline: deadline || '',
    description, checklist: checklist.map((c) => ({ id: newId(), text: c[0], done: c[1] })), comments: [], order: (o += 1000), createdAt: now,
  });
  data.tasks = [
    t(p1.id, 'Audit existing pages and sitemap', 'done', 'medium', m3, addDays(-15), 'Inventory all current pages and decide what stays, merges or goes.'),
    t(p1.id, 'Design homepage hero and navigation', 'done', 'high', m3, addDays(-8)),
    t(p1.id, 'Build responsive component library', 'in_progress', 'high', m2, addDays(4), 'Buttons, inputs, cards and layout primitives following the new design tokens.', [['Buttons and inputs', true], ['Cards and modals', true], ['Navigation', false], ['Forms', false]]),
    t(p1.id, 'Integrate CMS for blog content', 'todo', 'medium', m2, addDays(12)),
    t(p1.id, 'Cross-browser QA pass', 'todo', 'low', m4, addDays(16)),
    t(p1.id, 'Content migration review', 'in_review', 'medium', me, addDays(-1)),
    t(p2.id, 'Finalise onboarding flow', 'done', 'high', m3, addDays(-20)),
    t(p2.id, 'Push notification service', 'in_progress', 'high', m2, addDays(-5), 'Hook up FCM and APNs, including quiet hours.'),
    t(p2.id, 'App Store submission checklist', 'todo', 'high', me, addDays(-3)),
    t(p2.id, 'Regression test on low-end devices', 'in_review', 'medium', m4, addDays(2)),
    t(p3.id, 'Logo exploration round 2', 'done', 'medium', m3, addDays(-40)),
    t(p3.id, 'Publish brand guidelines', 'done', 'low', me, addDays(-22)),
    t(p4.id, 'Campaign brief and audience research', 'todo', 'medium', me, addDays(10)),
    t(p4.id, 'Draft email sequence', 'todo', 'low', null, addDays(25)),
    t(p5.id, 'Define KPI list with the client', 'in_progress', 'medium', me, addDays(9)),
  ];
  data.clients = dummyClients(now);
  data.clientsSeeded = true;
  enrichProjects(data);
  applyAvatars(data);
  commit(uid);
}

export const demoStore = {
  seed,

  subscribe(uid, cb, scope) {
    if (!listeners.has(uid)) listeners.set(uid, new Set());
    // A member only sees projects they belong to and tasks assigned to them; clients are admin-only.
    const view = (d) => (scope
      ? {
          projects: d.projects.filter((p) => (p.memberIds || []).includes(scope.memberId)),
          tasks: d.tasks.filter((t) => t.assigneeId === scope.memberId),
          members: d.members,
          clients: [],
          ready: true,
        }
      : d);
    const fn = (snap) => cb(view(snap));
    listeners.get(uid).add(fn);
    fn({ ...load(uid), ready: true });
    return () => listeners.get(uid)?.delete(fn);
  },

  async add(uid, col, data) {
    const id = newId();
    load(uid)[col].push({ ...data, id, createdAt: Date.now() });
    commit(uid);
    return id;
  },

  async addMany(uid, collections) {
    const data = load(uid);
    Object.entries(collections).forEach(([name, items]) => data[name].push(...items));
    commit(uid);
  },

  async update(uid, col, id, patch) {
    const list = load(uid)[col];
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = { ...list[i], ...patch };
    commit(uid);
  },

  async remove(uid, col, id) {
    const data = load(uid);
    data[col] = data[col].filter((x) => x.id !== id);
    if (col === 'projects') data.tasks = data.tasks.filter((t) => t.projectId !== id);
    if (col === 'members') {
      data.tasks = data.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: '' } : t));
      data.projects = data.projects.map((p) => ({
        ...p, memberIds: (p.memberIds || []).filter((m) => m !== id), responsibleId: p.responsibleId === id ? '' : p.responsibleId,
      }));
    }
    commit(uid);
  },
};
