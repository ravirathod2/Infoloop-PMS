import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { Avatar, Button, Dot, Field, Modal, Select } from './ui';
import { CURRENCIES, PROJECT_STATUSES, isMemberActive, projectStatus } from '../lib/constants';
import { clientDisplayName, todayStr } from '../lib/utils';

// Older projects stored the client as text: pre-select the client record with the same company/name.
const matchClient = (clients, text = '') =>
  clients.find((c) => [c.company, c.name].some((v) => v && v.trim().toLowerCase() === text.trim().toLowerCase()))?.id || '';

function MemberPicker({ members, value, onChange }) {
  const [q, setQ] = useState('');
  const shown = members.filter((m) => !q.trim() || `${m.name} ${m.role}`.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  if (members.length === 0) {
    return <p className="field-hint"><Link className="link" to="/members">Add members</Link> first, then pick them here.</p>;
  }
  return (
    <div className="picker">
      {members.length > 6 && (
        <input className="input picker-search" placeholder="Search members" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
      )}
      <div className="picker-list">
        {shown.map((m) => (
          <label key={m.id} className="picker-row">
            <input type="checkbox" className="checkbox" checked={value.includes(m.id)} onChange={() => toggle(m.id)} />
            <Avatar name={m.name} src={m.avatar} size={22} />
            <span className="picker-name">{m.name}</span>
            <span className="picker-role">{m.role}</span>
          </label>
        ))}
        {shown.length === 0 && <div className="picker-empty">No members match</div>}
      </div>
      <div className="picker-foot">{value.length} selected</div>
    </div>
  );
}

export default function ProjectModal({ project, onClose, onSaved }) {
  const { add, update, clients, members } = useData();
  const editing = !!project;
  const [f, setF] = useState(
    project
      ? {
          name: project.name, clientId: project.clientId || matchClient(clients, project.client), client: project.client,
          description: project.description, startDate: project.startDate, deadline: project.deadline, status: project.status,
          memberIds: project.memberIds || [], responsibleId: project.responsibleId || '',
          budget: project.budget ?? '', budgetCurrency: project.budgetCurrency || 'INR',
        }
      : {
          name: '', clientId: '', client: '', description: '', startDate: todayStr(), deadline: '', status: 'not_started',
          memberIds: [], responsibleId: '', budget: '', budgetCurrency: 'INR',
        },
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  // Inactive members can't be newly added, but stay visible if they're already on the project.
  const pickable = useMemo(
    () => members.filter((m) => isMemberActive(m) || f.memberIds.includes(m.id) || f.responsibleId === m.id),
    [members, f.memberIds, f.responsibleId],
  );

  const setResponsible = (id) => setF((cur) => ({
    ...cur, responsibleId: id, memberIds: id && !cur.memberIds.includes(id) ? [...cur.memberIds, id] : cur.memberIds,
  }));

  const submit = async (ev) => {
    ev.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Project name is required.';
    if (!f.clientId) er.client = 'Select a client.';
    if (!f.startDate) er.startDate = 'Pick a start date.';
    if (!f.deadline) er.deadline = 'Pick a deadline.';
    else if (f.startDate && f.deadline < f.startDate) er.deadline = 'Deadline can’t be before the start date.';
    if (f.budget !== '' && !(Number(f.budget) >= 0)) er.budget = 'Enter a valid budget.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const linked = clients.find((c) => c.id === f.clientId);
    const data = {
      ...f,
      name: f.name.trim(),
      client: linked ? clientDisplayName(linked) : f.client.trim(),
      description: f.description.trim(),
      budget: f.budget === '' ? null : Number(f.budget),
      memberIds: f.responsibleId && !f.memberIds.includes(f.responsibleId) ? [...f.memberIds, f.responsibleId] : f.memberIds,
    };
    try {
      const id = editing ? (await update('projects', project.id, data), project.id) : await add('projects', data);
      onSaved?.(id);
      onClose();
    } catch (e) {
      setErrors({ form: e.message });
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit project' : 'New project'} onClose={onClose} width={600}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {errors.form && <div className="form-error">{errors.form}</div>}
          <div className="form-grid">
            <div className="span-2"><Field label="Project name" htmlFor="p-name" error={errors.name}>
              <input id="p-name" className="input" autoFocus placeholder="e.g. Website redesign" value={f.name} onChange={set('name')} aria-invalid={!!errors.name} />
            </Field></div>
            <Field label="Client" htmlFor="p-client" error={errors.client}>
              <Select
                id="p-client" value={f.clientId} placeholder={clients.length ? 'Select a client' : 'No clients yet'}
                onChange={(v) => { setF({ ...f, clientId: v }); setErrors({ ...errors, client: undefined }); }}
                options={[...clients].sort((a, b) => clientDisplayName(a).localeCompare(clientDisplayName(b))).map((c) => ({ value: c.id, label: c.company ? `${c.company} · ${c.name}` : c.name }))}
              />
              {clients.length === 0 && <p className="field-hint"><Link className="link" to="/clients">Add a client</Link> first, then pick it here.</p>}
            </Field>
            <Field label="Status" htmlFor="p-status">
              <Select id="p-status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={PROJECT_STATUSES.map((s) => ({ value: s.key, label: s.label }))} leading={<Dot color={projectStatus(f.status).color} />} />
            </Field>
            <Field label="Responsible person" htmlFor="p-resp">
              <Select id="p-resp" value={f.responsibleId} onChange={setResponsible} placeholder="Select a person" options={pickable.map((m) => ({ value: m.id, label: m.name }))} />
            </Field>
            <Field label="Budget (optional)" htmlFor="p-budget" error={errors.budget}>
              <div className="rate-row">
                <Select aria-label="Currency" value={f.budgetCurrency} onChange={(v) => setF({ ...f, budgetCurrency: v })} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))} />
                <input id="p-budget" type="number" min="0" step="any" className="input" placeholder="0" value={f.budget} onChange={set('budget')} aria-invalid={!!errors.budget} />
              </div>
            </Field>
            <div className="span-2"><Field label="Team members">
              <MemberPicker members={pickable} value={f.memberIds} onChange={(ids) => setF({ ...f, memberIds: ids })} />
            </Field></div>
            <div className="span-2"><Field label="Description" htmlFor="p-desc">
              <textarea id="p-desc" className="textarea" placeholder="What is this project about?" value={f.description} onChange={set('description')} />
            </Field></div>
            <Field label="Start date" htmlFor="p-start" error={errors.startDate}>
              <input id="p-start" type="date" className="input" value={f.startDate} onChange={set('startDate')} aria-invalid={!!errors.startDate} />
            </Field>
            <Field label="Deadline" htmlFor="p-deadline" error={errors.deadline}>
              <input id="p-deadline" type="date" className="input" value={f.deadline} min={f.startDate || undefined} onChange={set('deadline')} aria-invalid={!!errors.deadline} />
            </Field>
          </div>
        </div>
        <div className="modal-foot">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>{editing ? 'Save changes' : 'Create project'}</Button>
        </div>
      </form>
    </Modal>
  );
}
