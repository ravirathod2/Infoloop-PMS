import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, KeyRound, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useData } from '../data/DataContext';
import { Avatar, Button, ConfirmDialog, Dot, EmptyState, Field, Menu, MenuItem, Modal, PageHeader, PasswordInput, Select } from '../components/ui';
import AvatarPicker from '../components/AvatarPicker';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { isEmail } from '../lib/utils';
import { CURRENCIES, DEPARTMENTS, memberStatus, formatRate, isMemberActive } from '../lib/constants';

export function MemberModal({ member, onClose }) {
  const { update, members, createMember, isOwner } = useData();
  const editing = !!member;
  const [password, setPassword] = useState('');
  const [f, setF] = useState({ avatar: member?.avatar || '', name: member?.name || '', email: member?.email || '', role: member?.role || '', phone: member?.phone || '', department: member?.department || '', hourlyRate: member?.hourlyRate ?? '', currency: member?.currency || 'INR' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const submit = async (ev) => {
    ev.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Name is required.';
    if (!isEmail(f.email)) er.email = 'Enter a valid email address.';
    else if (members.some((m) => m.id !== member?.id && m.email.toLowerCase() === f.email.trim().toLowerCase())) er.email = 'A member with this email already exists.';
    if (!f.role.trim()) er.role = 'Role is required.';
    if (!editing && isOwner && password.length < 8) er.password = 'Use at least 8 characters.';
    if (f.hourlyRate !== '' && !(Number(f.hourlyRate) >= 0)) er.hourlyRate = 'Enter a valid rate.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const data = { avatar: f.avatar, name: f.name.trim(), email: f.email.trim().toLowerCase(), role: f.role.trim(), phone: f.phone.trim(),
      department: f.department.trim(), currency: f.currency,
      hourlyRate: f.hourlyRate === '' ? null : Number(f.hourlyRate) };
    try {
      if (editing) await update('members', member.id, data);
      else await createMember(data, isOwner ? password : '');
      onClose();
    } catch (e) {
      setErrors(e.field ? { [e.field]: e.message } : { form: e.message });
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit member' : 'Add member'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {errors.form && <div className="form-error">{errors.form}</div>}
          <AvatarPicker value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} name={f.name} />
          <Field label="Full name" htmlFor="m-name" error={errors.name}>
            <input id="m-name" className="input" autoComplete="off" autoFocus value={f.name} onChange={set('name')} placeholder="Jane Cooper" aria-invalid={!!errors.name} />
          </Field>
          <Field label="Email" htmlFor="m-email" error={errors.email}>
            <input id="m-email" type="email" className="input" autoComplete="off" value={f.email} onChange={set('email')} placeholder="jane@company.com" aria-invalid={!!errors.email} readOnly={!!member?.uid} />
          </Field>
          {!editing && isOwner && (
            <Field label="Password" htmlFor="m-pass" error={errors.password} hint="They log in with their email and this password. You can reset it later.">
              <PasswordInput id="m-pass" value={password} invalid={!!errors.password} onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: undefined }); }} />
            </Field>
          )}
          <div className="form-grid">
            <Field label="Role" htmlFor="m-role" error={errors.role}>
              <input id="m-role" className="input" autoComplete="off" value={f.role} onChange={set('role')} placeholder="Designer" aria-invalid={!!errors.role} />
            </Field>
            <Field label="Phone (optional)" htmlFor="m-phone">
              <input id="m-phone" type="tel" className="input" autoComplete="off" value={f.phone} onChange={set('phone')} placeholder="+1 555 0100" />
            </Field>
          </div>
          <div className="form-grid">
            <div className="span-2"><Field label="Department" htmlFor="m-dept">
              <input id="m-dept" className="input" autoComplete="off" list="dept-list" value={f.department} onChange={set('department')} placeholder="Engineering" />
              <datalist id="dept-list">{DEPARTMENTS.map((d) => <option key={d} value={d} />)}</datalist>
            </Field></div>
            <div className="span-2">
              <Field label="Hourly rate (optional)" htmlFor="m-rate" error={errors.hourlyRate}>
                <div className="rate-row">
                  <Select aria-label="Currency" value={f.currency} onChange={(v) => setF({ ...f, currency: v })} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))} />
                  <input id="m-rate" type="number" min="0" step="0.01" className="input" value={f.hourlyRate} onChange={set('hourlyRate')} placeholder="0.00" aria-invalid={!!errors.hourlyRate} />
                </div>
              </Field>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>{editing ? 'Save changes' : 'Add member'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Members() {
  const { user } = useAuth();
  const { members, tasks, ready, remove, isOwner } = useData();
  const [reset, setReset] = useState(null);
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('');

  const departments = useMemo(() => [...new Set(members.map((m) => m.department).filter(Boolean))].sort(), [members]);
  const counts = {
    all: members.length,
    active: members.filter(isMemberActive).length,
    inactive: members.filter((m) => !isMemberActive(m)).length,
  };
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members
      .filter((m) => (tab === 'all' ? true : tab === 'active' ? isMemberActive(m) : !isMemberActive(m)))
      .filter((m) => !dept || m.department === dept)
      .filter((m) => !term || `${m.name} ${m.email} ${m.role} ${m.department || ''}`.toLowerCase().includes(term));
  }, [members, tab, q, dept]);

  if (!ready) return <div className="splash" style={{ height: 300 }}><span className="spinner" /></div>;

  const openTasks = (id) => tasks.filter((t) => t.assigneeId === id && t.status !== 'done').length;
  const confirmDelete = async () => {
    setBusy(true);
    try { await remove('members', del.id); setDel(null); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="The people you can assign tasks to."
        actions={<Button variant="primary" icon={Plus} onClick={() => setModal({})}>Add member</Button>}
      />

      {members.length > 0 && (
        <div className="toolbar">
          <div className="tabs" role="tablist">
            {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
                {label} <small>{counts[k]}</small>
              </button>
            ))}
          </div>
          <div className="toolbar-filters">
            {departments.length > 0 && (
              <Select aria-label="Filter by department" value={dept} onChange={setDept} placeholder="All departments" options={departments.map((d) => ({ value: d, label: d }))} />
            )}
            <div className="search">
              <Search size={15} />
              <input className="input" placeholder="Search name, email or role" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
            </div>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Users} title="No members yet" description="Add teammates so you can assign them tasks." action={<Button variant="primary" icon={Plus} onClick={() => setModal({})}>Add member</Button>} />
        </div>
      ) : list.length === 0 ? (
        <div className="panel"><EmptyState icon={Users} title="No members match" description="Try a different search or filter." action={<Button onClick={() => { setQ(''); setDept(''); setTab('all'); }}>Clear filters</Button>} /></div>
      ) : (
        <div className="table">
          <div className="tr th"><span>MEMBER</span><span className="col-hide">ROLE</span><span className="col-hide">HOURLY RATE</span><span className="col-hide">STATUS</span><span className="col-hide">OPEN TASKS</span><span /></div>
          {list.map((m) => (
            <div className="tr clickable" key={m.id} onClick={() => navigate(`/members/${m.id}`)}>
              <div className="who-cell">
                <Avatar name={m.name} src={m.avatar} size={32} />
                <div><b>{m.name}{m.isOwner && <span className="you">You</span>}</b><span>{m.email}</span></div>
              </div>
              <div className="who-cell col-hide"><div><b style={{ fontWeight: 400, color: 'var(--ink-muted)' }}>{m.role}</b><span>{m.department || '—'}</span></div></div>
              <span className="ellipsis col-hide">{formatRate(m)}</span>
              <span className="col-hide"><span className="badge"><Dot color={memberStatus(m.status).color} />{memberStatus(m.status).label}</span></span>
              <span className="tcount col-hide">{openTasks(m.id)}</span>
              <div className="actions">
                <Menu label={`Actions for ${m.name}`}>
                  <MenuItem icon={Eye} onClick={() => navigate(`/members/${m.id}`)}>View member</MenuItem>
                  <MenuItem icon={Pencil} onClick={() => setModal({ member: m })}>Edit member</MenuItem>
                  {isOwner && !m.isOwner && <MenuItem icon={KeyRound} onClick={() => setReset(m)}>{m.uid ? 'Reset password' : 'Set password'}</MenuItem>}
                  {!m.isOwner && m.email !== user.email && (
                    <>
                      <div className="menu-sep" />
                      <MenuItem icon={Trash2} danger onClick={() => setDel(m)}>Delete member</MenuItem>
                    </>
                  )}
                </Menu>
              </div>
            </div>
          ))}
        </div>
      )}

      {reset && <ResetPasswordModal member={reset} onClose={() => setReset(null)} />}
      {modal && <MemberModal member={modal.member} onClose={() => setModal(null)} />}
      {del && (
        <ConfirmDialog
          title="Delete member?" busy={busy} onConfirm={confirmDelete} onCancel={() => setDel(null)}
          message={`${del.name} will be removed. ${openTasks(del.id) ? `Their ${openTasks(del.id)} open task(s) will become unassigned.` : ''}`}
        />
      )}
    </>
  );
}
