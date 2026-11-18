import { useState } from 'react';
import { useData } from '../data/DataContext';
import { Button, Dot, Field, Modal, Select } from './ui';
import AvatarPicker from './AvatarPicker';
import { CLIENT_STATUSES, CURRENCIES, clientStatus } from '../lib/constants';
import { isEmail, isPhone } from '../lib/utils';

export default function ClientModal({ client, onClose }) {
  const { add, update, clients } = useData();
  const editing = !!client;
  const [f, setF] = useState({
    avatar: client?.avatar || '', name: client?.name || '', company: client?.company || '', email: client?.email || '', phone: client?.phone || '',
    status: client?.status || 'active', hourlyRate: client?.hourlyRate ?? '', currency: client?.currency || 'INR',
    address: client?.address || '', notes: client?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const submit = async (ev) => {
    ev.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Client name is required.';
    if (!isEmail(f.email)) er.email = 'Enter a valid email address.';
    else if (clients.some((c) => c.id !== client?.id && c.email.toLowerCase() === f.email.trim().toLowerCase())) er.email = 'A client with this email already exists.';
    if (f.phone.trim() && !isPhone(f.phone)) er.phone = 'Enter a valid phone number.';
    if (f.hourlyRate !== '' && !(Number(f.hourlyRate) >= 0)) er.hourlyRate = 'Enter a valid rate.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const data = {
      avatar: f.avatar, name: f.name.trim(), company: f.company.trim(), email: f.email.trim(), phone: f.phone.trim(), status: f.status,
      currency: f.currency, hourlyRate: f.hourlyRate === '' ? null : Number(f.hourlyRate), address: f.address.trim(), notes: f.notes.trim(),
    };
    try {
      if (editing) await update('clients', client.id, data);
      else await add('clients', data);
      onClose();
    } catch (e) {
      setErrors({ form: e.message });
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit client' : 'New client'} onClose={onClose} width={560}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          {errors.form && <div className="form-error">{errors.form}</div>}
          <AvatarPicker value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} name={f.name} />
          <div className="form-grid">
            <Field label="Client name" htmlFor="c-name" error={errors.name}>
              <input id="c-name" className="input" autoFocus value={f.name} onChange={set('name')} placeholder="Priya Shah" aria-invalid={!!errors.name} />
            </Field>
            <Field label="Company (optional)" htmlFor="c-company">
              <input id="c-company" className="input" value={f.company} onChange={set('company')} placeholder="Acme Corp" />
            </Field>
            <Field label="Email" htmlFor="c-email" error={errors.email}>
              <input id="c-email" type="email" className="input" value={f.email} onChange={set('email')} placeholder="priya@acme.com" aria-invalid={!!errors.email} />
            </Field>
            <Field label="Phone number (optional)" htmlFor="c-phone" error={errors.phone}>
              <input id="c-phone" type="tel" className="input" value={f.phone} onChange={set('phone')} placeholder="+91 98765 43210" aria-invalid={!!errors.phone} />
            </Field>
            <Field label="Hourly rate (optional)" htmlFor="c-rate" error={errors.hourlyRate}>
              <div className="rate-row">
                <Select aria-label="Currency" value={f.currency} onChange={(v) => setF({ ...f, currency: v })} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol} ${c.code}` }))} />
                <input id="c-rate" type="number" min="0" step="0.01" className="input" value={f.hourlyRate} onChange={set('hourlyRate')} placeholder="0.00" aria-invalid={!!errors.hourlyRate} />
              </div>
            </Field>
            <Field label="Status" htmlFor="c-status">
              <Select id="c-status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={CLIENT_STATUSES.map((s) => ({ value: s.key, label: s.label }))} leading={<Dot color={clientStatus(f.status).color} />} />
            </Field>
            <div className="span-2"><Field label="Address / location (optional)" htmlFor="c-address">
              <input id="c-address" className="input" value={f.address} onChange={set('address')} placeholder="City, Country" />
            </Field></div>
            <div className="span-2"><Field label="Notes (optional)" htmlFor="c-notes">
              <textarea id="c-notes" className="textarea" value={f.notes} onChange={set('notes')} placeholder="Billing preferences, contacts, anything worth remembering" />
            </Field></div>
          </div>
        </div>
        <div className="modal-foot">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>{editing ? 'Save changes' : 'Add client'}</Button>
        </div>
      </form>
    </Modal>
  );
}
