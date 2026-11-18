// Sample workspace data, built to cover as many UI cases as possible:
// every project/task/client/member status, overdue and due-soon items, empty and crowded projects,
// unassigned tasks, inactive members, missing photos/rates/phones, long names, 13-member teams, etc.
import { addDays, newId } from '../lib/utils';

const photo = (n) => `/avatars/${n}.png`;

/**
 * @param {string} ownerMemberId  the admin's own member record, so they appear on projects and tasks too
 * @returns {{members: object[], clients: object[], projects: object[], tasks: object[]}}
 */
export function buildSample(ownerMemberId) {
  const now = Date.now();
  const stamp = { createdAt: now };

  // ───────── Members ─────────
  const mk = (name, role, department, status, hourlyRate, currency, avatar = '', phone = '') => ({
    id: newId(), name, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@sample.example`, role, department,
    status, hourlyRate, currency, avatar, phone, ...stamp,
  });
  const priya = mk('Priya Nair', 'Engineering Manager', 'Engineering', 'active', 3200, 'INR', photo('woman-2'), '+91 98200 11122');
  const aarav = mk('Aarav Mehta', 'Frontend Developer', 'Engineering', 'active', 1800, 'INR', photo('man-2'));
  const sara = mk('Sara Collins', 'Product Designer', 'Design', 'active', 45, 'USD', photo('woman-1'), '+1 555 0113');
  const diego = mk('Diego Alvarez', 'QA Engineer', 'QA', 'inactive', 28, 'USD', photo('man-3')); // inactive, still has tasks
  const meera = mk('Meera Iyer', 'Backend Developer', 'Engineering', 'active', 2000, 'INR'); // no photo
  const jonas = mk('Jonas Weber', 'DevOps Engineer', 'Engineering', 'active', 55, 'EUR', photo('man-1'));
  const kenji = mk('Kenji Sato', 'UX Researcher', 'Design', 'active', 40, 'GBP');
  const amara = mk('Amara Njoku', 'Marketing Lead', 'Marketing', 'active', 1700, 'INR', photo('woman-1'));
  const liam = mk('Liam O\'Connor', 'Sales Executive', 'Sales', 'active', 35, 'GBP', photo('man-3'));
  const fatima = mk('Fatima Khan', 'Operations Lead', 'Operations', 'active', null, 'INR', photo('woman-2')); // no rate
  const noah = mk('Noah Fischer', 'Data Analyst', 'Product', 'active', 38, 'EUR', photo('man-1'));
  const chloe = mk('Chloe Martin', 'Content Writer', 'Marketing', 'inactive', 25, 'USD'); // inactive, no photo
  const rohan = mk('Rohan Desai', 'Mobile Developer', 'Engineering', 'active', 2100, 'INR', photo('man-2'));
  const hannah = mk('Hannah Lee', 'Product Manager', 'Product', 'active', 60, 'USD', photo('woman-1'));
  const members = [priya, aarav, sara, diego, meera, jonas, kenji, amara, liam, fatima, noah, chloe, rohan, hannah];
  const me = ownerMemberId || '';
  const activeIds = [me, ...members.filter((m) => m.status === 'active').map((m) => m.id)].filter(Boolean); // 13 when the admin exists

  // ───────── Clients ─────────
  const mc = (name, company, email, phone, hourlyRate, currency, status, address, notes, avatar = '') => ({
    id: newId(), name, company, email, phone, hourlyRate, currency, status, address, notes, avatar, ...stamp,
  });
  const acme = mc('Priya Shah', 'Acme Corp', 'priya@acme.example', '+91 98200 55512', 3000, 'INR', 'active', 'Mumbai, India', 'Prefers weekly Friday updates.\nInvoices on the 1st of each month.', photo('woman-2'));
  const northwind = mc('Tom Becker', 'Northwind Traders', 'tom@northwind.example', '+1 555 0142', 60, 'USD', 'active', 'Seattle, USA', 'Pays within 15 days.', photo('man-1'));
  const lumen = mc('Lena Fischer', 'Lumen Studio', 'lena@lumen.example', '+49 30 5550 191', 45, 'EUR', 'inactive', 'Berlin, Germany', 'Brand project delivered. Check back in Q1.', photo('woman-1'));
  const harbor = mc('Marcus Reid', 'Harbor Foods', 'marcus@harbor.example', '+44 20 7946 0321', 55, 'GBP', 'prospect', 'London, UK', 'Interested in a Q4 campaign. Proposal sent.', photo('man-3'));
  const orbit = mc('Neha Kapoor', 'Orbit Logistics', 'neha@orbit.example', '+91 99100 45678', 2500, 'INR', 'active', 'Bengaluru, India', 'Needs data access approval before work resumes.', photo('woman-2'));
  const bright = mc('Daniel Okafor', 'Brightpath Education', 'daniel@brightpath.example', '', 50, 'USD', 'prospect', 'Austin, USA', '', photo('man-2')); // no phone, no projects
  const verde = mc('Sofia Marino', 'Verde Interiors', 'sofia@verde.example', '+39 02 5550 144', 40, 'EUR', 'active', 'Milan, Italy', 'Prefers email over calls.', photo('woman-1'));
  const ethan = mc('Ethan Brooks', '', 'ethan.brooks@example.com', '', null, 'USD', 'active', '', ''); // no company, rate, phone, photo
  const kiran = mc('Kiran Patel', '', 'kiran.patel@example.com', '+91 90000 12345', null, 'INR', 'inactive', 'Pune, India', 'Not working with us anymore.'); // no projects
  const clients = [acme, northwind, lumen, harbor, orbit, bright, verde, ethan, kiran];

  // ───────── Projects ─────────
  const name = (c) => c.company || c.name;
  const mp = (title, client, status, startOff, deadOff, budget, currency, team, responsible, description) => ({
    id: newId(), name: title, clientId: client.id, client: name(client), description, status,
    startDate: addDays(startOff), deadline: addDays(deadOff), budget, budgetCurrency: currency,
    memberIds: [...new Set([...team, responsible].filter(Boolean))], responsibleId: responsible || '', ...stamp,
  });
  const website = mp('Website Redesign', acme, 'in_progress', -30, 20, 850000, 'INR', [me, priya.id, aarav.id, sara.id, meera.id, kenji.id], priya.id,
    'Rebuild the marketing site with a new design system, faster pages and a simple CMS.');
  const mobile = mp('Mobile App Launch', northwind, 'in_progress', -60, -4, 120000, 'USD', activeIds, rohan.id,
    'Ship the first public release of the iOS and Android customer app. Overdue and staffed by everyone.');
  const brand = mp('Brand Identity Refresh', lumen, 'completed', -90, -20, 18000, 'EUR', [sara.id, kenji.id], sara.id,
    'Logo, typography and brand guidelines for the Lumen rebrand. Fully delivered.');
  const campaign = mp('Q4 Marketing Campaign', harbor, 'not_started', 7, 60, 30000, 'GBP', [amara.id, liam.id, me], amara.id,
    'Plan and produce the seasonal campaign across email, social and paid. Not started, no tasks yet.');
  const analytics = mp('Analytics Dashboard', orbit, 'on_hold', -14, 35, 600000, 'INR', [me, noah.id, meera.id, fatima.id], noah.id,
    'Internal reporting dashboard for fleet performance. Paused until data access is approved.');
  const portal = mp('Customer Portal', acme, 'in_progress', -20, 3, null, 'INR', [aarav.id, meera.id, hannah.id], hannah.id,
    'Self-service portal for Acme customers. No budget set, deadline in three days.');
  const migration = mp('Legacy Data Migration', ethan, 'completed', -120, -45, 9500, 'USD', [meera.id, jonas.id], jonas.id,
    'Completed project with no tasks recorded (shows 100% by status).');
  const report = mp('Annual Report 2026', verde, 'in_progress', -50, -10, 250000, 'INR', [me], me,
    'One-person project, overdue, with nothing finished yet (0% progress).');
  const tools = mp('Internal Tools Cleanup', acme, 'not_started', 45, 120, null, 'INR', [], '',
    'Starts next quarter. No team, no responsible person, no tasks.');
  const sales = mp('Sales Enablement Kit', northwind, 'on_hold', -35, -1, 40000, 'USD', [liam.id, amara.id, chloe.id], liam.id,
    'On hold and past its deadline. Includes an inactive teammate.');
  const audit = mp('Q3 Regulatory Compliance Audit and Documentation Refresh for EU Operations', orbit, 'in_progress', -25, 28, 1500000, 'INR', [me, fatima.id, hannah.id, jonas.id], fatima.id,
    'A deliberately long project name to check truncation in cards, lists and breadcrumbs.');
  const projects = [website, mobile, brand, campaign, analytics, portal, migration, report, tools, sales, audit];

  // ───────── Tasks ─────────
  let order = now;
  const mt = (project, title, status, priority, assignee, deadlineOff, extra = {}) => ({
    id: newId(), projectId: project.id, title, status, priority, assigneeId: assignee || '',
    deadline: deadlineOff == null ? '' : addDays(deadlineOff), description: '', checklist: [], comments: [],
    order: (order += 1000), ...stamp, ...extra,
  });
  const cl = (...items) => items.map(([text, done]) => ({ id: newId(), text, done }));
  const cm = (author, text, minutesAgo) => ({ id: newId(), authorName: author, text, createdAt: now - minutesAgo * 60000 });

  const tasks = [
    // Website Redesign: every status, mixed priorities, an overdue task, a task due today
    mt(website, 'Audit existing pages and sitemap', 'done', 'medium', sara.id, -18, { description: 'Inventory every current page and decide what stays, merges or goes.' }),
    mt(website, 'Design homepage hero and navigation', 'done', 'high', sara.id, -9),
    mt(website, 'Build responsive component library', 'in_progress', 'high', aarav.id, 4, {
      description: 'Buttons, inputs, cards and layout primitives following the new design tokens.',
      checklist: cl(['Buttons and inputs', true], ['Cards and modals', true], ['Navigation', false], ['Forms', false]),
      comments: [cm('Aarav Mehta', 'Buttons and inputs are merged. Starting on navigation tomorrow.', 380), cm('Priya Nair', 'Please keep the focus ring consistent with the design file.', 120)],
    }),
    mt(website, 'Integrate CMS for blog content', 'todo', 'medium', meera.id, 12),
    mt(website, 'Cross-browser QA pass', 'todo', 'low', diego.id, 16), // assigned to an inactive member
    mt(website, 'Content migration review', 'in_review', 'medium', me, -2), // overdue, in review
    mt(website, 'Write launch announcement', 'todo', 'low', null, null), // unassigned, no deadline
    mt(website, 'Final accessibility audit', 'todo', 'high', kenji.id, 0, { description: 'Due today.' }), // due today
    mt(website, 'Set up redirects from the old site', 'in_progress', 'high', meera.id, 1, { checklist: cl(['Export old URLs', true], ['Map to new URLs', false]) }), // due tomorrow
    mt(website, 'Performance budget and Lighthouse targets', 'in_review', 'medium', aarav.id, 6, { checklist: cl(['LCP under 2.5s', true], ['CLS under 0.1', true], ['TBT under 200ms', true]) }),

    // Mobile App Launch: overdue project, lots of overdue tasks, 13 people
    mt(mobile, 'Finalise onboarding flow', 'done', 'high', sara.id, -25),
    mt(mobile, 'Push notification service', 'in_progress', 'high', rohan.id, -6, { description: 'Hook up FCM and APNs, including quiet hours.', comments: [cm('Rohan Desai', 'APNs certificates expire next week, renewing now.', 2000)] }),
    mt(mobile, 'App Store submission checklist', 'todo', 'high', me, -3),
    mt(mobile, 'Regression test on low-end Android devices', 'in_review', 'medium', diego.id, 2),
    mt(mobile, 'Crash reporting and analytics events', 'in_progress', 'medium', noah.id, -1),
    mt(mobile, 'Store listing screenshots and copy', 'todo', 'low', amara.id, 5),
    mt(mobile, 'Beta feedback triage', 'todo', 'medium', hannah.id, 9),
    mt(mobile, 'Rate limiting on the public API', 'in_progress', 'high', meera.id, -8),
    mt(mobile, 'Localise the app into five languages and verify right-to-left layouts everywhere', 'todo', 'medium', null, 14), // long title, unassigned

    // Brand Identity Refresh: completed, all tasks done (one done after its deadline)
    mt(brand, 'Logo exploration round two', 'done', 'medium', sara.id, -45),
    mt(brand, 'Typography and colour system', 'done', 'medium', sara.id, -38),
    mt(brand, 'Publish brand guidelines', 'done', 'low', kenji.id, -22),
    mt(brand, 'Hand-off to the client', 'done', 'high', sara.id, -21),

    // Analytics Dashboard: on hold, mostly stalled
    mt(analytics, 'Define KPI list with the client', 'in_progress', 'medium', noah.id, 9),
    mt(analytics, 'Request read access to the fleet database', 'todo', 'high', me, 3),
    mt(analytics, 'Data model draft', 'done', 'medium', meera.id, -12),
    mt(analytics, 'Prototype the route map widget', 'todo', 'low', null, null),
    mt(analytics, 'Pick a charting library', 'todo', 'low', fatima.id, 20),

    // Customer Portal: due soon, tight deadlines
    mt(portal, 'Login and password reset screens', 'done', 'high', aarav.id, -5),
    mt(portal, 'Invoice history page', 'in_progress', 'high', meera.id, 0), // due today
    mt(portal, 'Support ticket form', 'in_progress', 'medium', aarav.id, 1), // due tomorrow
    mt(portal, 'Role-based access for company admins', 'todo', 'high', meera.id, 2),
    mt(portal, 'User acceptance testing with Acme', 'todo', 'medium', hannah.id, 3),
    mt(portal, 'Write help-centre articles', 'todo', 'low', null, null),

    // Annual Report: overdue project, nothing finished
    mt(report, 'Collect section drafts from every department', 'in_progress', 'high', me, -12, { checklist: cl(['Finance', true], ['Operations', false], ['People', false]) }),
    mt(report, 'Design the report layout', 'todo', 'medium', me, -9),
    mt(report, 'Proofread and send to print', 'todo', 'high', me, -4),

    // Sales Enablement Kit: on hold + overdue + inactive assignee
    mt(sales, 'Pitch deck refresh', 'in_progress', 'medium', liam.id, -3),
    mt(sales, 'Case study write-ups', 'todo', 'low', chloe.id, -1), // inactive assignee
    mt(sales, 'Pricing one-pager', 'done', 'high', amara.id, -20),

    // Audit: long project name, mixed
    mt(audit, 'Map data flows across all EU entities', 'in_progress', 'high', fatima.id, 7, { checklist: cl(['Germany', true], ['France', true], ['Spain', false], ['Poland', false]) }),
    mt(audit, 'Review third-party processor agreements', 'todo', 'high', hannah.id, 10),
    mt(audit, 'Update the records of processing activities', 'todo', 'medium', fatima.id, 15),
    mt(audit, 'Staff training schedule', 'in_review', 'low', me, 21),
    mt(audit, 'Penetration test findings: remediation plan', 'todo', 'high', jonas.id, -2), // overdue
  ];

  return { members, clients, projects, tasks };
}
