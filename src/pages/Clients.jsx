import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useData } from '../data/DataContext';
import { Avatar, Button, ConfirmDialog, Dot, EmptyState, Menu, MenuItem, PageHeader } from '../components/ui';
import ClientModal from '../components/ClientModal';
import { CLIENT_STATUSES, clientStatus, formatRate } from '../lib/constants';
import { projectsOfClient } from '../lib/utils';

export default function Clients() {
  const navigate = useNavigate();
  const { clients, projects, ready, remove } = useData();
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const counts = useMemo(() => {
    const n = { all: clients.length };
    CLIENT_STATUSES.forEach((s) => { n[s.key] = clients.filter((c) => (c.status || 'active') === s.key).length; });
    return n;
  }, [clients]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return clients
      .filter((c) => tab === 'all' || (c.status || 'active') === tab)
      .filter((c) => !term || `${c.name} ${c.company || ''} ${c.email} ${c.phone || ''} ${c.address || ''}`.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, tab, q]);

  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;

  const confirmDelete = async () => {
    setBusy(true);
    try { await remove('clients', del.id); setDel(null); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Keep client details and billing rates in one place."
        actions={<Button variant="primary" icon={Plus} onClick={() => setModal({})}>New client</Button>}
      />

      {clients.length > 0 && (
        <div className="toolbar">
          <div className="tabs" role="tablist">
            {[{ key: 'all', label: 'All' }, ...CLIENT_STATUSES].map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>
                {t.label} <small>{counts[t.key]}</small>
              </button>
            ))}
          </div>
          <div className="search">
            <Search size={15} />
            <input className="input" placeholder="Search name, company or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" />
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Building2} title="No clients yet" description="Add the people and companies you work for." action={<Button variant="primary" icon={Plus} onClick={() => setModal({})}>New client</Button>} />
        </div>
      ) : list.length === 0 ? (
        <div className="panel"><EmptyState icon={Building2} title="No clients match" description="Try a different search or status." action={<Button onClick={() => { setQ(''); setTab('all'); }}>Clear filters</Button>} /></div>
      ) : (
        <div className="table">
          <div className="tr th"><span>CLIENT</span><span className="col-hide">COMPANY</span><span className="col-hide">HOURLY RATE</span><span className="col-hide">STATUS</span><span className="col-hide">PROJECTS</span><span /></div>
          {list.map((c) => {
            const s = clientStatus(c.status);
            return (
              <div className="tr clickable" key={c.id} onClick={() => navigate(`/clients/${c.id}`)}>
                <div className="who-cell">
                  <Avatar name={c.name} src={c.avatar} size={32} />
                  <div><b>{c.name}</b><span>{c.email}</span></div>
                </div>
                <span className="ellipsis col-hide">{c.company || '—'}</span>
                <span className="ellipsis col-hide">{formatRate(c)}</span>
                <span className="col-hide"><span className="badge"><Dot color={s.color} />{s.label}</span></span>
                <span className="tcount col-hide">{projectsOfClient(c, projects).length}</span>
                <div className="actions">
                  <Menu label={`Actions for ${c.name}`}>
                    <MenuItem icon={Eye} onClick={() => navigate(`/clients/${c.id}`)}>View client</MenuItem>
                    <MenuItem icon={Pencil} onClick={() => setModal({ client: c })}>Edit client</MenuItem>
                    <div className="menu-sep" />
                    <MenuItem icon={Trash2} danger onClick={() => setDel(c)}>Delete client</MenuItem>
                  </Menu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <ClientModal client={modal.client} onClose={() => setModal(null)} />}
      {del && (
        <ConfirmDialog
          title="Delete client?" busy={busy} onConfirm={confirmDelete} onCancel={() => setDel(null)}
          message={`${del.name} will be removed. Their projects stay, but are no longer linked to a client record.`}
        />
      )}
    </>
  );
}
