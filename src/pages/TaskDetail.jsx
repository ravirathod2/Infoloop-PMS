import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import { Avatar, Button, ConfirmDialog, Dot, EmptyState, IconButton, PriorityIcon, ProgressBar, Select } from '../components/ui';
import { isMemberActive, OVERDUE_COLOR, PRIORITIES, TASK_STATUSES, taskStatus } from '../lib/constants';
import { dueLabel, formatDate, formatDateTime, isTaskOverdue, newId } from '../lib/utils';

export default function TaskDetail() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, tasks, members, ready, update, remove, isAdmin } = useData();
  const task = tasks.find((t) => t.id === taskId && t.projectId === projectId);
  const project = projects.find((p) => p.id === projectId);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [item, setItem] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (task) { setTitle(task.title); setDesc(task.description || ''); }
    // reset local drafts only when navigating to a different task
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;
  if (!task || !project) {
    return (
      <div className="panel">
        <EmptyState title="Task not found" description="It may have been deleted." action={<Link to={project ? `/projects/${projectId}` : '/projects'} className="btn btn-secondary">Back</Link>} />
      </div>
    );
  }

  const patch = (p) => update('tasks', task.id, p);
  const checklist = task.checklist || [];
  const comments = task.comments || [];
  const doneCount = checklist.filter((c) => c.done).length;
  const overdue = isTaskOverdue(task);

  const commitTitle = () => {
    const v = title.trim();
    if (!v) return setTitle(task.title);
    if (v !== task.title) patch({ title: v });
  };
  const commitDesc = () => desc !== (task.description || '') && patch({ description: desc });

  const addItem = (e) => {
    e.preventDefault();
    if (!item.trim()) return;
    patch({ checklist: [...checklist, { id: newId(), text: item.trim(), done: false }] });
    setItem('');
  };
  const addNote = () => {
    if (!note.trim()) return;
    patch({ comments: [...comments, { id: newId(), text: note.trim(), authorName: user.name, createdAt: Date.now() }] });
    setNote('');
  };

  const confirmDelete = async () => {
    setBusy(true);
    try { await remove('tasks', task.id); navigate(`/projects/${projectId}`); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="crumbs">
        <Link to="/projects">Projects</Link><ChevronRight size={14} />
        <Link to={`/projects/${projectId}`}>{project.name}</Link><ChevronRight size={14} />
        <span className="current">Task</span>
      </div>

      <div className="task-layout">
        <div>
          <input className="task-title-input" readOnly={!isAdmin} value={title} aria-label="Task title" onChange={(e) => setTitle(e.target.value)} onBlur={commitTitle} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />

          <div className="task-section" style={{ marginTop: 20 }}>
            <h3>Description</h3>
            <textarea className="textarea" style={{ minHeight: 140 }} placeholder="Add a description, links or acceptance criteria…" value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={commitDesc} />
          </div>

          <div className="task-section">
            <h3>Checklist {checklist.length > 0 && <small>{doneCount}/{checklist.length}</small>}</h3>
            {checklist.length > 0 && <div style={{ marginBottom: 8 }}><ProgressBar pct={Math.round((doneCount / checklist.length) * 100)} /></div>}
            <div className="check-list">
              {checklist.map((c) => (
                <div key={c.id} className={`check-row ${c.done ? 'done' : ''}`}>
                  <input type="checkbox" className="checkbox" checked={c.done} aria-label={c.text} onChange={() => patch({ checklist: checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)) })} />
                  <span>{c.text}</span>
                  <IconButton label="Remove item" className="del" onClick={() => patch({ checklist: checklist.filter((x) => x.id !== c.id) })}><X size={14} /></IconButton>
                </div>
              ))}
            </div>
            <form className="check-add" onSubmit={addItem}>
              <input className="input" placeholder="Add an item" value={item} onChange={(e) => setItem(e.target.value)} aria-label="New checklist item" />
              <Button type="submit" icon={Plus} disabled={!item.trim()}>Add</Button>
            </form>
          </div>

          <div className="task-section">
            <h3>Notes <small>{comments.length}</small></h3>
            <div className="notes">
              {comments.map((c) => (
                <div className="note" key={c.id}>
                  <Avatar name={c.authorName} src={members.find((m) => m.name === c.authorName)?.avatar} size={28} />
                  <div className="note-body">
                    <div className="note-head">
                      <b>{c.authorName}</b><span>{formatDateTime(c.createdAt)}</span>
                      <IconButton label="Delete note" onClick={() => patch({ comments: comments.filter((x) => x.id !== c.id) })}><Trash2 size={13} /></IconButton>
                    </div>
                    <div className="note-text">{c.text}</div>
                  </div>
                </div>
              ))}
              <div className="composer">
                <textarea
                  className="textarea" style={{ minHeight: 72 }} placeholder="Write a note or update… (Ctrl+Enter to post)" value={note} aria-label="New note"
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && addNote()}
                />
                <Button variant="primary" onClick={addNote} disabled={!note.trim()}>Add note</Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="panel props">
          <h3>Details</h3>
          <div className="prop">
            <label htmlFor="d-status">Status</label>
            <Select id="d-status" className="ghost" value={task.status} onChange={(v) => patch({ status: v })} leading={<Dot color={taskStatus(task.status).color} />} options={TASK_STATUSES.map((s) => ({ value: s.key, label: s.label }))} />
          </div>
          <div className="prop">
            <label htmlFor="d-priority">Priority</label>
            <Select id="d-priority" className="ghost" disabled={!isAdmin} value={task.priority} onChange={(v) => patch({ priority: v })} leading={<PriorityIcon priority={task.priority} />} options={PRIORITIES.map((p) => ({ value: p.key, label: p.label }))} />
          </div>
          <div className="prop">
            <label htmlFor="d-assignee">Assignee</label>
            <Select id="d-assignee" className="ghost" disabled={!isAdmin} value={task.assigneeId || ''} onChange={(v) => patch({ assigneeId: v })} placeholder="Unassigned" options={members.filter((m) => isMemberActive(m) || m.id === task.assigneeId).map((m) => ({ value: m.id, label: m.name }))} />
          </div>
          <div className="prop">
            <label htmlFor="d-deadline">Deadline</label>
            <input id="d-deadline" type="date" className="input" disabled={!isAdmin} value={task.deadline || ''} onChange={(e) => patch({ deadline: e.target.value })} />
          </div>
          {task.deadline && (
            <div className="prop">
              <span className="k">Timing</span>
              <span className="v" style={overdue ? { color: OVERDUE_COLOR } : undefined}>{task.status === 'done' ? 'Completed' : dueLabel(task.deadline)}</span>
            </div>
          )}
          <div className="prop"><span className="k">Project</span><Link className="v link" to={`/projects/${projectId}`}>{project.name}</Link></div>
          <div className="prop"><span className="k">Created</span><span className="v">{formatDate(new Date(task.createdAt || Date.now()).toISOString().slice(0, 10))}</span></div>
          {isAdmin && (
            <div className="props-foot">
              <Button variant="danger" icon={Trash2} onClick={() => setConfirm(true)}>Delete task</Button>
            </div>
          )}
        </aside>
      </div>

      {confirm && <ConfirmDialog title="Delete task?" message={`“${task.title}” will be permanently deleted.`} busy={busy} onConfirm={confirmDelete} onCancel={() => setConfirm(false)} />}
    </>
  );
}
