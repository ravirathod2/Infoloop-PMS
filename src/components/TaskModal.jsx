import { useState } from 'react';
import { useData } from '../data/DataContext';
import { Button, Dot, Field, Modal, PriorityIcon, Select } from './ui';
import { isMemberActive, PRIORITIES, TASK_STATUSES, taskStatus } from '../lib/constants';

export default function TaskModal({ projectId, initialStatus = 'todo', onClose }) {
  const { add, members, tasks } = useData();
  const [f, setF] = useState({ title: '', description: '', assigneeId: '', priority: 'medium', deadline: '', status: initialStatus });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    if (!f.title.trim()) return setError('Task title is required.');
    setBusy(true);
    const last = Math.max(0, ...tasks.filter((t) => t.projectId === projectId && t.status === f.status).map((t) => t.order || 0));
    try {
      await add('tasks', { ...f, title: f.title.trim(), description: f.description.trim(), projectId, checklist: [], comments: [], order: (last || Date.now()) + 1000 });
      onClose();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="New task" onClose={onClose} width={560}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          <div className="form-grid">
            <div className="span-2"><Field label="Title" htmlFor="t-title" error={error}>
              <input id="t-title" className="input" autoFocus placeholder="What needs to be done?" value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setError(''); }} aria-invalid={!!error} />
            </Field></div>
            <div className="span-2"><Field label="Description" htmlFor="t-desc">
              <textarea id="t-desc" className="textarea" placeholder="Add more detail (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            </Field></div>
            <Field label="Status" htmlFor="t-status">
              <Select id="t-status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={TASK_STATUSES.map((s) => ({ value: s.key, label: s.label }))} leading={<Dot color={taskStatus(f.status).color} />} />
            </Field>
            <Field label="Priority" htmlFor="t-priority">
              <Select id="t-priority" value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={PRIORITIES.map((p) => ({ value: p.key, label: p.label }))} leading={<PriorityIcon priority={f.priority} />} />
            </Field>
            <Field label="Assignee" htmlFor="t-assignee" hint={members.length === 0 ? 'Add team members on the Members page first.' : undefined}>
              <Select id="t-assignee" value={f.assigneeId} onChange={(v) => setF({ ...f, assigneeId: v })} placeholder="Unassigned" options={members.filter(isMemberActive).map((m) => ({ value: m.id, label: m.name }))} />
            </Field>
            <Field label="Deadline" htmlFor="t-deadline">
              <input id="t-deadline" type="date" className="input" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="modal-foot">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>Create task</Button>
        </div>
      </form>
    </Modal>
  );
}
