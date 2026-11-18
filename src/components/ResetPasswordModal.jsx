import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useData } from '../data/DataContext';
import { Button, Field, Modal, PasswordInput } from './ui';

export default function ResetPasswordModal({ member, onClose }) {
  const { setMemberPassword } = useData();
  const hasLogin = !!member.uid;
  const [password, setPassword] = useState('');
  const [revoke, setRevoke] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const submit = async (ev) => {
    ev.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    setBusy(true);
    try {
      const res = await setMemberPassword(member, password, hasLogin && revoke);
      setDone({ created: res?.created ?? !hasLogin, revoked: hasLogin && revoke });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Modal title={done.created ? 'Login created' : 'Password updated'} onClose={onClose} width={420}>
        <div className="modal-body">
          <span className="empty-icon" style={{ alignSelf: 'flex-start' }}><CheckCircle2 size={18} color="#27a644" /></span>
          <p className="muted">
            {done.created
              ? `${member.name} can now log in with ${member.email} and the password you set.`
              : done.revoked
                ? `${member.name}'s password was changed and they were logged out everywhere. They'll need the new password to sign in again.`
                : `${member.name}'s password was changed. Anywhere they're already logged in stays signed in.`}
          </p>
        </div>
        <div className="modal-foot"><Button variant="primary" onClick={onClose}>Done</Button></div>
      </Modal>
    );
  }

  return (
    <Modal title={hasLogin ? 'Reset password' : 'Set password'} onClose={onClose} width={440}>
      <form onSubmit={submit} noValidate>
        <div className="modal-body">
          <p className="muted">
            {hasLogin
              ? <>Set a new password for <b style={{ color: 'var(--ink)' }}>{member.name}</b> ({member.email}).</>
              : <>{member.name} doesn’t have a login yet. Setting a password creates one using <b style={{ color: 'var(--ink)' }}>{member.email}</b>.</>}
          </p>
          <Field label="New password" htmlFor="rp-pass" error={error} hint="At least 8 characters.">
            <PasswordInput id="rp-pass" autoFocus value={password} invalid={!!error} onChange={(e) => { setPassword(e.target.value); setError(''); }} />
          </Field>
          {hasLogin && (
            <label className="check-option">
              <input type="checkbox" className="checkbox" checked={revoke} onChange={(e) => setRevoke(e.target.checked)} />
              <span>
                <b>Log out this user from everywhere</b>
                <small>They’ll be signed out of every device right after the password changes. If unchecked, they stay logged in where they are.</small>
              </span>
            </label>
          )}
        </div>
        <div className="modal-foot">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>{hasLogin ? 'Reset password' : 'Set password'}</Button>
        </div>
      </form>
    </Modal>
  );
}
