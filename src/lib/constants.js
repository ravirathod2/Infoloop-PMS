export const PROJECT_STATUSES = [
  { key: 'not_started', label: 'Not Started', color: '#62666d' },
  { key: 'in_progress', label: 'In Progress', color: '#f2c94c' },
  { key: 'on_hold', label: 'On Hold', color: '#f2994a' },
  { key: 'completed', label: 'Completed', color: '#27a644' },
];

export const TASK_STATUSES = [
  { key: 'todo', label: 'To Do', color: '#62666d' },
  { key: 'in_progress', label: 'In Progress', color: '#f2c94c' },
  { key: 'in_review', label: 'In Review', color: '#5e6ad2' },
  { key: 'done', label: 'Done', color: '#27a644' },
];

export const PRIORITIES = [
  { key: 'low', label: 'Low', level: 1, color: '#8a8f98' },
  { key: 'medium', label: 'Medium', level: 2, color: '#f2c94c' },
  { key: 'high', label: 'High', level: 3, color: '#eb5757' },
];

export const OVERDUE_COLOR = '#eb5757';

export const projectStatus = (key) => PROJECT_STATUSES.find((s) => s.key === key) || PROJECT_STATUSES[0];
export const taskStatus = (key) => TASK_STATUSES.find((s) => s.key === key) || TASK_STATUSES[0];
export const priority = (key) => PRIORITIES.find((p) => p.key === key) || PRIORITIES[1];

export const MEMBER_STATUSES = [
  { key: 'active', label: 'Active', color: '#27a644' },
  { key: 'inactive', label: 'Inactive', color: '#62666d' },
];
export const isMemberActive = (m) => m.status !== 'inactive' && m.status !== 'on_leave';
export const memberStatus = (key) => MEMBER_STATUSES.find((s) => s.key === (key === 'on_leave' ? 'inactive' : key)) || MEMBER_STATUSES[0];

export const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'QA', 'Marketing', 'Sales', 'Operations', 'Management'];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
];

export const formatRate = (m) => {
  if (m.hourlyRate == null || m.hourlyRate === '') return '—';
  const sym = CURRENCIES.find((c) => c.code === (m.currency || 'INR'))?.symbol || '';
  return `${sym}${Number(m.hourlyRate).toLocaleString('en-US')}/hr`;
};

export const CLIENT_STATUSES = [
  { key: 'active', label: 'Active', color: '#27a644' },
  { key: 'prospect', label: 'Prospect', color: '#f2c94c' },
  { key: 'inactive', label: 'Inactive', color: '#62666d' },
];
export const clientStatus = (key) => CLIENT_STATUSES.find((s) => s.key === key) || CLIENT_STATUSES[0];

export const formatMoney = (amount, currency) => {
  if (amount == null || amount === '') return '';
  const sym = CURRENCIES.find((c) => c.code === (currency || 'INR'))?.symbol || '';
  return `${sym}${Number(amount).toLocaleString('en-US')}`;
};

// Photos bundled with the app (public/avatars). Members and clients only store the path, nothing is uploaded.
export const AVATARS = [
  { src: '/avatars/woman-1.png', label: 'Woman, crossed arms', pos: '50% 18%' },
  { src: '/avatars/woman-2.png', label: 'Woman, smiling', pos: '50% 30%' },
  { src: '/avatars/man-1.png', label: 'Man, glasses', pos: '50% 22%' },
  { src: '/avatars/man-2.png', label: 'Man, navy suit', pos: '50% 30%' },
  { src: '/avatars/man-3.png', label: 'Man, grey blazer', pos: '50% 30%' },
];
export const avatarPos = (src) => AVATARS.find((a) => a.src === src)?.pos || '50% 25%';
