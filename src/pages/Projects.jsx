import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useData } from '../data/DataContext';
import { Avatar, Button, ConfirmDialog, EmptyState, MemberStack, Menu, MenuItem, PageHeader, ProgressBar, ProjectBadge } from '../components/ui';
import ProjectModal from '../components/ProjectModal';
import { OVERDUE_COLOR } from '../lib/constants';
import { formatDate, isProjectOverdue, projectClientName, projectProgress } from '../lib/utils';

export default function Projects() {
  const { projects, tasks, clients, members, ready, remove, isAdmin } = useData();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // {project?}
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => ({
    all: projects.length,
    active: projects.filter((p) => p.status !== 'completed').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }), [projects]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects
      .filter((p) => (tab === 'all' ? true : tab === 'completed' ? p.status === 'completed' : p.status !== 'completed'))
      .filter((p) => !term || `${p.name} ${projectClientName(p, clients)}`.toLowerCase().includes(term))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [projects, clients, tab, q]);

  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;

  const confirmDelete = async () => {
    setBusy(true);
    try { await remove('projects', del.id); setDel(null); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={isAdmin ? 'Create and track every client project in one place.' : 'The projects you are part of.'}
        actions={isAdmin && <Button variant="primary" icon={Plus} onClick={() => setModal({})}>New project</Button>}
      />

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {[['all', 'All'], ['active', 'Active'], ['completed', 'Completed']].map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
              {label} <small>{counts[k]}</small>
            </button>
          ))}
        </div>
        <div className="search">
          <Search size={15} />
          <input className="input" placeholder="Search projects or clients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={FolderKanban}
            title={projects.length === 0 ? 'No projects yet' : 'No projects match'}
            description={projects.length === 0 ? (isAdmin ? 'Create your first project to add tasks, assign teammates and track progress.' : 'You have not been added to any project yet.') : 'Try a different search or switch the tab.'}
            action={projects.length === 0 && isAdmin && <Button variant="primary" icon={Plus} onClick={() => setModal({})}>New project</Button>}
          />
        </div>
      ) : (
        <div className="cards">
          {list.map((p) => {
            const { done, total, pct } = projectProgress(p, tasks);
            const overdue = isProjectOverdue(p);
            const team = (p.memberIds || []).map((id) => members.find((m) => m.id === id)).filter(Boolean);
            const lead = members.find((m) => m.id === p.responsibleId);
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
                <div className="pc-top">
                  <ProjectBadge status={p.status} />
                  {isAdmin && (
                    <Menu label="Project actions">
                      <MenuItem icon={Pencil} onClick={() => setModal({ project: p })}>Edit project</MenuItem>
                      <div className="menu-sep" />
                      <MenuItem icon={Trash2} danger onClick={() => setDel(p)}>Delete project</MenuItem>
                    </Menu>
                  )}
                </div>
                <div>
                  <div className="pc-name">{p.name}</div>
                  <div className="pc-client">{projectClientName(p, clients)}</div>
                </div>
                <p className="pc-desc">{p.description || 'No description'}</p>
                <div className="pc-prog">
                  <div className="row-between"><span>{done} of {total} {isAdmin ? 'tasks' : 'of your tasks'}</span><b>{pct}%</b></div>
                  <ProgressBar pct={pct} />
                </div>
                <div className="pc-people">
                  <MemberStack members={team} max={3} />
                  {lead && (
                    <span className="pc-lead" title="Responsible person">
                      <Avatar name={lead.name} src={lead.avatar} size={20} /> <b>{lead.name}</b>
                    </span>
                  )}
                </div>
                <div className="pc-foot">
                  <span className="chip"><CalendarDays size={13} /> {formatDate(p.startDate)} – {formatDate(p.deadline)}</span>
                  {overdue && <span className="chip" style={{ color: OVERDUE_COLOR }}>Overdue</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {modal && <ProjectModal project={modal.project} onClose={() => setModal(null)} />}
      {del && (
        <ConfirmDialog
          title="Delete project?"
          message={`“${del.name}” and all of its tasks will be permanently deleted. This can’t be undone.`}
          busy={busy} onConfirm={confirmDelete} onCancel={() => setDel(null)}
        />
      )}
    </>
  );
}
