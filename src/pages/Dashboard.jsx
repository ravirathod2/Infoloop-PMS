import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FolderKanban, ListChecks, AlertCircle, Activity } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import PieChart from '../components/PieChart';
import { Avatar, Button, Dot, EmptyState, PageHeader, ProgressBar, ProjectBadge } from '../components/ui';
import { OVERDUE_COLOR, TASK_STATUSES } from '../lib/constants';
import { dueLabel, formatDate, isProjectOverdue, isTaskOverdue, projectProgress } from '../lib/utils';

function Stat({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat">
      <div className="label"><Icon size={15} strokeWidth={1.75} style={color ? { color } : undefined} />{label}</div>
      <div className="num">{value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, tasks, members, ready, isAdmin, loadSample } = useData();
  const [loadingSample, setLoadingSample] = useState(false);
  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;

  const active = projects.filter((p) => p.status !== 'completed');
  const completed = projects.filter((p) => p.status === 'completed');
  const inProgress = projects.filter((p) => p.status === 'in_progress').length;
  const pending = tasks.filter((t) => t.status !== 'done');
  const overdue = tasks.filter(isTaskOverdue).sort((a, b) => a.deadline.localeCompare(b.deadline));
  const projectName = (id) => projects.find((p) => p.id === id)?.name || 'Unknown project';
  const member = (id) => members.find((m) => m.id === id);
  const firstName = user.name.split(' ')[0];

  const progressList = [...active]
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'))
    .slice(0, 6);

  return (
    <>
      <PageHeader title={`Hello, ${firstName}`} subtitle={isAdmin ? 'Here’s where your projects and tasks stand today.' : 'Your assigned projects and tasks.'} />

      {isAdmin && projects.length === 0 && (
        <section className="panel welcome">
          <div>
            <b>Your workspace is empty</b>
            <p className="muted">Start with your own clients, members and projects, or fill it with sample data to explore every screen.</p>
          </div>
          <div className="welcome-actions">
            <Link className="btn btn-secondary" to="/projects">Create a project</Link>
            <Button variant="primary" loading={loadingSample} onClick={async () => { setLoadingSample(true); try { await loadSample(); } finally { setLoadingSample(false); } }}>Load sample data</Button>
          </div>
        </section>
      )}

      <div className="stats">
        <Stat icon={FolderKanban} label={isAdmin ? 'Total projects' : 'Your projects'} value={projects.length} sub={isAdmin ? `${members.length} team member${members.length === 1 ? '' : 's'}` : 'Assigned to you'} />
        <Stat icon={Activity} label="Active projects" value={active.length} sub={`${inProgress} in progress`} />
        <Stat icon={CheckCircle2} label="Completed projects" value={completed.length} sub="Delivered" color="#27a644" />
        <Stat icon={ListChecks} label="Pending tasks" value={pending.length} sub={`${tasks.length - pending.length} of ${tasks.length} done`} />
        <Stat icon={AlertCircle} label="Overdue tasks" value={overdue.length} sub={overdue.length ? 'Needs attention' : 'All on schedule'} color={overdue.length ? OVERDUE_COLOR : undefined} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Project progress</h2>
            <Link to="/projects" className="link" style={{ fontSize: 13 }}>View all</Link>
          </div>
          <div className="panel-body">
            {progressList.length === 0 ? (
              <EmptyState icon={FolderKanban} title="No active projects" description="Create a project to start tracking progress here." action={<Link className="btn btn-primary" to="/projects">Go to projects</Link>} />
            ) : (
              progressList.map((p) => {
                const { done, total, pct } = projectProgress(p, tasks);
                return (
                  <Link to={`/projects/${p.id}`} key={p.id} className="row-link prog-row">
                    <div className="row-main">
                      <div className="row-title">{p.name}</div>
                      <div className="row-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProjectBadge status={p.status} />
                        <span style={isProjectOverdue(p) ? { color: OVERDUE_COLOR } : undefined}>{p.deadline ? (isProjectOverdue(p) ? `Overdue · ${formatDate(p.deadline)}` : `Due ${formatDate(p.deadline)}`) : 'No deadline'}</span>
                      </div>
                    </div>
                    <div className="prog-bar-col">
                      <ProgressBar pct={pct} height={6} />
                      <small>{done} of {total} tasks done</small>
                    </div>
                    <div className="pct">{pct}%</div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <div className="stack">
          <section className="panel">
            <div className="panel-head"><h2>Overdue tasks</h2></div>
            <div className="panel-body">
              {overdue.length === 0 ? (
                <div className="all-clear"><CheckCircle2 size={18} color="#27a644" /> Nothing is overdue. Nice work.</div>
              ) : (
                overdue.slice(0, 6).map((t) => (
                  <Link key={t.id} to={`/projects/${t.projectId}/tasks/${t.id}`} className="row-link">
                    <div className="row-main">
                      <div className="row-title">{t.title}</div>
                      <div className="row-sub">{projectName(t.projectId)}</div>
                    </div>
                    <span className="chip" style={{ color: OVERDUE_COLOR }}>{dueLabel(t.deadline)}</span>
                    {member(t.assigneeId) && <Avatar name={member(t.assigneeId).name} src={member(t.assigneeId).avatar} size={24} />}
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Tasks by status</h2></div>
            <div className="panel-body" style={{ padding: '16px 20px 20px' }}>
              <PieChart
                emptyText="No tasks yet."
                slices={TASK_STATUSES.map((st) => ({ key: st.key, label: st.label, color: st.color, value: tasks.filter((t) => t.status === st.key).length }))}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
