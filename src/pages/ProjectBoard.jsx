import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, ChevronRight, ListChecks, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useData } from '../data/DataContext';
import {
  Avatar, Button, ConfirmDialog, Dot, EmptyState, MemberStack, Menu, MenuItem, PriorityIcon, ProgressBar, ProjectBadge, Select,
} from '../components/ui';
import ProjectModal from '../components/ProjectModal';
import TaskModal from '../components/TaskModal';
import { OVERDUE_COLOR, formatMoney, PROJECT_STATUSES, TASK_STATUSES, projectStatus } from '../lib/constants';
import { byOrder, formatDate, isTaskOverdue, projectClientName, projectProgress } from '../lib/utils';

function TaskCard({ task, member, dragging, dropBefore, onDragStart, onDragEnd, onDragOver, onDrop, onOpen }) {
  const overdue = isTaskOverdue(task);
  const cl = task.checklist || [];
  return (
    <div
      className={`task-card ${task.status === 'done' ? 'is-done' : ''} ${dragging ? 'dragging' : ''} ${dropBefore ? 'drop-before' : ''}`}
      draggable role="button" tabIndex={0}
      onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <h4>{task.title}</h4>
      <div className="tc-meta">
        <PriorityIcon priority={task.priority} />
        {task.deadline && (
          <span className="chip" style={overdue ? { color: OVERDUE_COLOR } : undefined}>
            <CalendarDays size={12} /> {formatDate(task.deadline)}
          </span>
        )}
        {cl.length > 0 && (
          <span className="chip"><ListChecks size={12} /> {cl.filter((c) => c.done).length}/{cl.length}</span>
        )}
        {member ? <Avatar name={member.name} src={member.avatar} size={22} /> : (
          <span className="avatar avatar-empty" style={{ width: 22, height: 22 }} title="Unassigned"><User size={11} /></span>
        )}
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, members, clients, ready, add, update, remove, isAdmin } = useData();
  const project = projects.find((p) => p.id === projectId);

  const [drag, setDrag] = useState(null); // task id
  const [overCol, setOverCol] = useState(null);
  const [overCard, setOverCard] = useState(null);
  const [quick, setQuick] = useState(null); // status key with open quick-add
  const [quickTitle, setQuickTitle] = useState('');
  const [taskModal, setTaskModal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === projectId).sort(byOrder), [tasks, projectId]);

  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;
  if (!project) {
    return (
      <div className="panel">
        <EmptyState title="Project not found" description="It may have been deleted." action={<Link to="/projects" className="btn btn-secondary">Back to projects</Link>} />
      </div>
    );
  }

  const { done, total, pct } = projectProgress(project, tasks);
  const memberOf = (id) => members.find((m) => m.id === id);

  const move = (taskId, status, beforeId) => {
    const col = projectTasks.filter((t) => t.status === status && t.id !== taskId);
    let order;
    if (beforeId) {
      const i = col.findIndex((t) => t.id === beforeId);
      const next = col[i];
      const prev = col[i - 1];
      order = !next ? Date.now() : prev ? (prev.order + next.order) / 2 : next.order - 1000;
    } else {
      order = col.length ? col[col.length - 1].order + 1000 : Date.now();
    }
    update('tasks', taskId, { status, order });
  };

  const endDrag = () => { setDrag(null); setOverCol(null); setOverCard(null); };

  const quickAdd = async (status) => {
    const title = quickTitle.trim();
    if (!title) return setQuick(null);
    const col = projectTasks.filter((t) => t.status === status);
    await add('tasks', {
      projectId, title, status, priority: 'medium', assigneeId: '', deadline: '', description: '', checklist: [], comments: [],
      order: col.length ? col[col.length - 1].order + 1000 : Date.now(),
    });
    setQuickTitle('');
  };

  const confirmDelete = async () => {
    setBusy(true);
    try { await remove('projects', project.id); navigate('/projects'); } finally { setBusy(false); }
  };

  const ps = projectStatus(project.status);

  return (
    <>
      <div className="crumbs">
        <Link to="/projects">Projects</Link><ChevronRight size={14} /><span className="current">{project.name}</span>
      </div>

      <div className="proj-head">
        <div className="proj-title-row">
          <div>
            <h1>{project.name}</h1>
            <div className="meta-row">
              {isAdmin ? (
                <Select
                  className="ghost" value={project.status} aria-label="Project status"
                  onChange={(v) => update('projects', project.id, { status: v })}
                  options={PROJECT_STATUSES.map((s) => ({ value: s.key, label: s.label }))}
                  leading={<Dot color={ps.color} />}
                />
              ) : <ProjectBadge status={project.status} />}
              <span className="m">Client <b>{projectClientName(project, clients)}</b></span>
              <span className="m"><CalendarDays size={14} /> <b>{formatDate(project.startDate)}</b> → <b>{formatDate(project.deadline)}</b></span>
              {project.budget != null && <span className="m">Budget <b>{formatMoney(project.budget, project.budgetCurrency)}</b></span>}
              {memberOf(project.responsibleId) && <span className="m">Responsible <Avatar name={memberOf(project.responsibleId).name} src={memberOf(project.responsibleId).avatar} size={20} /> <b>{memberOf(project.responsibleId).name}</b></span>}
              {(project.memberIds || []).length > 0 && <span className="m"><MemberStack members={(project.memberIds || []).map(memberOf).filter(Boolean)} max={5} size={22} /></span>}
              <span className="m proj-progress">
                <span style={{ width: 120 }}><ProgressBar pct={pct} height={6} /></span>
                <b>{pct}%</b> <span>({done}/{total} {isAdmin ? 'tasks' : 'of your tasks'})</span>
              </span>
            </div>
          </div>
          {isAdmin && <div className="page-actions">
            <Menu label="Project actions">
              <MenuItem icon={Pencil} onClick={() => setEditing(true)}>Edit project</MenuItem>
              <div className="menu-sep" />
              <MenuItem icon={Trash2} danger onClick={() => setDeleting(true)}>Delete project</MenuItem>
            </Menu>
            <Button variant="primary" icon={Plus} onClick={() => setTaskModal({ status: 'todo' })}>New task</Button>
          </div>}
        </div>
        {project.description && <p className="proj-desc">{project.description}</p>}
      </div>

      <div className="board">
        {TASK_STATUSES.map((col) => {
          const colTasks = projectTasks.filter((t) => t.status === col.key);
          return (
            <section
              key={col.key}
              className={`column ${overCol === col.key && drag ? 'over' : ''}`}
              onDragOver={(e) => { if (drag) { e.preventDefault(); setOverCol(col.key); } }}
              onDrop={(e) => { e.preventDefault(); if (drag) move(drag, col.key); endDrag(); }}
            >
              <div className="col-head">
                <Dot color={col.color} /> {col.label} <span className="count">{colTasks.length}</span>
                {isAdmin && <button type="button" className="icon-btn" aria-label={`Add task to ${col.label}`} onClick={() => setTaskModal({ status: col.key })}><Plus size={15} /></button>}
              </div>

              <div className="col-cards">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id} task={t} member={memberOf(t.assigneeId)}
                    dragging={drag === t.id} dropBefore={overCard === t.id && drag && drag !== t.id}
                    onDragStart={(e) => { setDrag(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); }}
                    onDragEnd={endDrag}
                    onDragOver={(e) => { if (drag) { e.preventDefault(); e.stopPropagation(); setOverCol(col.key); setOverCard(t.id); } }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (drag && drag !== t.id) move(drag, col.key, t.id); endDrag(); }}
                    onOpen={() => navigate(`/projects/${projectId}/tasks/${t.id}`)}
                  />
                ))}
              </div>

              {isAdmin && (quick === col.key ? (
                <div className="quick-add">
                  <input
                    className="input" autoFocus placeholder="Task title" value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') quickAdd(col.key);
                      if (e.key === 'Escape') { setQuick(null); setQuickTitle(''); }
                    }}
                  />
                  <div className="row">
                    <Button size="sm" variant="primary" onClick={() => quickAdd(col.key)}>Add</Button>
                    <Button size="sm" variant="tertiary" onClick={() => { setQuick(null); setQuickTitle(''); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button type="button" className="add-task" onClick={() => { setQuick(col.key); setQuickTitle(''); }}>
                  <Plus size={14} /> Add task
                </button>
              ))}
            </section>
          );
        })}
      </div>

      {taskModal && <TaskModal projectId={projectId} initialStatus={taskModal.status} onClose={() => setTaskModal(null)} />}
      {editing && <ProjectModal project={project} onClose={() => setEditing(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete project?" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(false)}
          message={`“${project.name}” and its ${total} task${total === 1 ? '' : 's'} will be permanently deleted. This can’t be undone.`}
        />
      )}
    </>
  );
}
