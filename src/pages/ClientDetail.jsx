import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { useData } from '../data/DataContext';
import { Avatar, Button, ConfirmDialog, Dot, EmptyState, ProgressBar, ProjectBadge } from '../components/ui';
import ClientModal from '../components/ClientModal';
import { clientStatus, formatRate } from '../lib/constants';
import { formatDate, projectProgress, projectsOfClient } from '../lib/utils';

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, projects, tasks, ready, remove } = useData();
  const client = clients.find((c) => c.id === clientId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;
  if (!client) {
    return <div className="panel"><EmptyState title="Client not found" description="It may have been deleted." action={<Link to="/clients" className="btn btn-secondary">Back to clients</Link>} /></div>;
  }

  const s = clientStatus(client.status);
  const list = projectsOfClient(client, projects);
  const confirmDelete = async () => {
    setBusy(true);
    try { await remove('clients', client.id); navigate('/clients'); } finally { setBusy(false); }
  };
  const info = [
    ['Email', client.email && <a className="link" href={`mailto:${client.email}`}>{client.email}</a>],
    ['Phone', client.phone],
    ['Company', client.company],
    ['Hourly rate', formatRate(client) === '—' ? '' : formatRate(client)],
    ['Address', client.address],
    ['Added', client.createdAt && formatDate(new Date(client.createdAt).toISOString().slice(0, 10))],
  ];

  return (
    <>
      <div className="crumbs"><Link to="/clients">Clients</Link><ChevronRight size={14} /><span className="current">{client.name}</span></div>
      <header className="page-head">
        <div className="who-cell" style={{ gap: 16 }}>
          <Avatar name={client.name} src={client.avatar} size={48} />
          <div>
            <h1>{client.name}</h1>
            <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {client.company || 'No company'} <span className="badge"><Dot color={s.color} />{s.label}</span>
            </p>
          </div>
        </div>
        <div className="page-actions">
          <Button icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="danger" icon={Trash2} onClick={() => setDeleting(true)}>Delete</Button>
        </div>
      </header>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head"><h2>Projects</h2><span className="muted" style={{ fontSize: 13 }}>{list.length}</span></div>
          <div className="panel-body">
            {list.length === 0 ? (
              <EmptyState icon={FolderKanban} title="No projects yet" description="Projects whose client name matches this client appear here." action={<Link to="/projects" className="btn btn-secondary">Go to projects</Link>} />
            ) : list.map((p) => {
              const { done, total, pct } = projectProgress(p, tasks);
              return (
                <Link key={p.id} to={`/projects/${p.id}`} className="row-link prog-row">
                  <div className="row-main">
                    <div className="row-title">{p.name}</div>
                    <div className="row-sub" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><ProjectBadge status={p.status} /> Due {formatDate(p.deadline)}</div>
                  </div>
                  <div className="prog-bar-col"><ProgressBar pct={pct} height={6} /><small>{done} of {total} tasks done</small></div>
                  <div className="pct">{pct}%</div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="stack">
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
          {client.notes && (
            <section className="panel">
              <div className="panel-head"><h2>Notes</h2></div>
              <div className="panel-body" style={{ padding: '8px 20px 16px', color: 'var(--ink-muted)', whiteSpace: 'pre-wrap' }}>{client.notes}</div>
            </section>
          )}
        </div>
      </div>

      {editing && <ClientModal client={client} onClose={() => setEditing(false)} />}
      {deleting && <ConfirmDialog title="Delete client?" busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(false)} message={`${client.name} will be removed. Their projects stay, but are no longer linked to a client record.`} />}
    </>
  );
}
