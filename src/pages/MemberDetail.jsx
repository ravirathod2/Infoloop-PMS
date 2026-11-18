import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, KeyRound, ListChecks, Pencil, Trash2 } from 'lucide-react';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { useData } from '../data/DataContext';
import { Avatar, Button, ConfirmDialog, Dot, EmptyState, Switch } from '../components/ui';
import { MemberModal } from './Members';
import { OVERDUE_COLOR, formatRate, isMemberActive, memberStatus } from '../lib/constants';
import { dueLabel, formatDate, isTaskOverdue } from '../lib/utils';

export default function MemberDetail() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { members, tasks, projects, ready, update, remove, isOwner } = useData();
  const [resetting, setResetting] = useState(false);
  const member = members.find((m) => m.id === memberId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;
  if (!member) {
    return <div className="panel"><EmptyState title="Member not found" description="They may have been deleted." action={<Link to="/members" className="btn btn-secondary">Back to members</Link>} /></div>;
  }

  const active = isMemberActive(member);
  const s = memberStatus(active ? 'active' : 'inactive');
  const open = tasks.filter((t) => t.assigneeId === member.id && t.status !== 'done');
  const projectName = (id) => projects.find((p) => p.id === id)?.name || '';
  const confirmDelete = async () => {
    setBusy(true);
    try { await remove('members', member.id); navigate('/members'); } finally { setBusy(false); }
  };
  const info = [
    ['Email', member.email && <a className="link" href={`mailto:${member.email}`}>{member.email}</a>],
    ['Phone', member.phone],
    ['Role', member.role],
    ['Department', member.department],
    ['Hourly rate', formatRate(member) === '—' ? '' : formatRate(member)],
    ['Login', member.isOwner ? 'Owner account' : member.uid ? 'Enabled' : 'Not set up'],
    ['Added', member.createdAt && formatDate(new Date(member.createdAt).toISOString().slice(0, 10))],
  ];

  return (
    <>
      <div className="crumbs"><Link to="/members">Members</Link><ChevronRight size={14} /><span className="current">{member.name}</span></div>
      <header className="page-head">
        <div className="who-cell" style={{ gap: 16 }}>
          <Avatar name={member.name} src={member.avatar} size={48} />
          <div>
            <h1>{member.name}</h1>
            <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {member.role} <span className="badge"><Dot color={s.color} />{s.label}</span>
            </p>
          </div>
        </div>
        <div className="page-actions">
          <Button icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
          {isOwner && !member.isOwner && <Button icon={KeyRound} onClick={() => setResetting(true)}>{member.uid ? 'Reset password' : 'Set password'}</Button>}
          {!member.isOwner && <Button variant="danger" icon={Trash2} onClick={() => setDeleting(true)}>Delete</Button>}
        </div>
      </header>

      <div className="grid-2">
        <div className="stack">
          <section className="panel status-card">
            <div>
              <b>{active ? 'Active' : 'Inactive'}</b>
              <span className="muted">{member.isOwner ? 'This is your own account, so it always stays active.' : active ? 'Can be assigned new tasks.' : 'Hidden from task assignment. Existing tasks stay assigned.'}</span>
            </div>
            <Switch label="Member is active" checked={active} disabled={member.isOwner} onChange={(v) => update('members', member.id, { status: v ? 'active' : 'inactive' })} />
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Open tasks</h2><span className="muted" style={{ fontSize: 13 }}>{open.length}</span></div>
            <div className="panel-body">
              {open.length === 0 ? (
                <EmptyState icon={ListChecks} title="No open tasks" description="Tasks assigned to this member appear here." />
              ) : open.map((t) => (
                <Link key={t.id} to={`/projects/${t.projectId}/tasks/${t.id}`} className="row-link">
                  <div className="row-main"><div className="row-title">{t.title}</div><div className="row-sub">{projectName(t.projectId)}</div></div>
                  {t.deadline && <span className="chip" style={isTaskOverdue(t) ? { color: OVERDUE_COLOR } : undefined}>{dueLabel(t.deadline)}</span>}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-head"><h2>Details</h2></div>
          <div className="panel-body" style={{ padding: '8px 12px 12px' }}>
            {info.map(([k, v]) => (
              <div className="prop" key={k} style={{ gridTemplateColumns: '90px minmax(0,1fr)', padding: '6px 0' }}>
                <span className="k" style={{ paddingLeft: 0 }}>{k}</span>
                <span className="v" style={{ padding: 0 }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {resetting && <ResetPasswordModal member={member} onClose={() => setResetting(false)} />}
      {editing && <MemberModal member={member} onClose={() => setEditing(false)} />}
      {deleting && <ConfirmDialog title="Delete member?" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(false)} message={`${member.name} will be removed.${open.length ? ` Their ${open.length} open task(s) will become unassigned.` : ''}`} />}
    </>
  );
}
