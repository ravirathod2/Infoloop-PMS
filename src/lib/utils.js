const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => toStr(new Date());

export const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toStr(d);
};

const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function formatDate(s) {
  if (!s) return '—';
  const d = parse(s);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function formatDateTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const daysFromToday = (s) => Math.round((parse(s) - parse(todayStr())) / 86400000);

export function dueLabel(s) {
  if (!s) return '';
  const d = daysFromToday(s);
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  if (d > 1) return `Due in ${d}d`;
  return `${Math.abs(d)}d overdue`;
}

export const isTaskOverdue = (t) => t.status !== 'done' && !!t.deadline && t.deadline < todayStr();
export const isProjectOverdue = (p) => p.status !== 'completed' && !!p.deadline && p.deadline < todayStr();

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';

export const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

/** Progress of a project derived from its tasks (done / total). */
export function projectProgress(project, tasks) {
  const list = tasks.filter((t) => t.projectId === project.id);
  const done = list.filter((t) => t.status === 'done').length;
  const total = list.length;
  let pct = total ? Math.round((done / total) * 100) : 0;
  if (!total && project.status === 'completed') pct = 100;
  return { done, total, pct };
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isPhone = (v) => /^\+?[0-9\s().-]{7,18}$/.test(v.trim());
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now());

/** Projects store the client as plain text; match it against a client's company or name. */
export const projectsOfClient = (client, projects) => {
  const keys = [client.company, client.name].filter(Boolean).map((s) => s.trim().toLowerCase());
  return projects.filter((p) => (p.clientId ? p.clientId === client.id : keys.includes((p.client || '').trim().toLowerCase())));
};

export const clientDisplayName = (c) => c.company || c.name;

/** Client name shown for a project: follows the linked client record, falls back to the stored text. */
export const projectClientName = (project, clients) => {
  const c = project.clientId && clients.find((x) => x.id === project.clientId);
  return c ? clientDisplayName(c) : project.client || '';
};
