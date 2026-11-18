import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import AuthShell from '../components/AuthShell';
import { Button, Field, Modal } from '../components/ui';
import { isEmail } from '../lib/utils';

export default function ForgotPassword() {
  const { userExists } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [soon, setSoon] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    if (!isEmail(email)) return setError('Enter a valid email address.');
    setBusy(true);
    try {
      if (await userExists(email)) setSoon(true);
      else setError('User does not exist.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/login" className="back-link"><ArrowLeft size={14} /> Back to log in</Link>
      <h1 className="auth-title">Forgot password?</h1>
      <p className="auth-sub">Enter the email linked to your account and we’ll help you get back in.</p>

      <form className="auth-form" onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="fp-email" error={error}>
          <input
            id="fp-email" type="email" className="input" autoComplete="email" placeholder="you@company.com" autoFocus
            value={email} aria-invalid={!!error}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
          />
        </Field>
        <Button type="submit" variant="primary" className="btn-block" loading={busy}>Reset password</Button>
      </form>

      {soon && (
        <Modal title="Coming soon" onClose={() => setSoon(false)} width={400}>
          <div className="modal-body">
            <span className="empty-icon" style={{ alignSelf: 'flex-start' }}><Clock size={18} strokeWidth={1.5} /></span>
            <p className="muted">Password reset isn’t available yet. We’re working on it and it will be here soon.</p>
          </div>
          <div className="modal-foot"><Button variant="primary" onClick={() => setSoon(false)}>Got it</Button></div>
        </Modal>
      )}
    </AuthShell>
  );
}
