import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import AuthShell from '../components/AuthShell';
import { Button, Field, IconButton } from '../components/ui';
import { isEmail, isPhone } from '../lib/utils';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.6 4.1-5.35 4.1a5.9 5.9 0 0 1 0-11.8c1.87 0 3.12.8 3.84 1.48l2.62-2.52C17.76 3.8 15.1 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.37 0 8.93-3.77 8.93-9.08 0-.6-.07-1.06-.15-1.12h.57Z" />
  </svg>
);

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { signUpEmail, signInEmail, signInGoogle } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState('');

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined, form: undefined }));
  };

  const validate = () => {
    const e = {};
    if (isSignup && form.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!isEmail(form.email)) e.email = 'Enter a valid email address.';
    if (isSignup && !isPhone(form.phone)) e.phone = 'Enter a valid phone number.';
    if (!form.password) e.password = 'Enter your password.';
    else if (isSignup && form.password.length < 8) e.password = 'Use at least 8 characters.';
    return e;
  };

  const run = async (kind, fn) => {
    setBusy(kind);
    try {
      await fn();
    } catch (err) {
      if (err.silent) return;
      setErrors(err.field ? { [err.field]: err.message } : { form: err.message });
    } finally {
      setBusy('');
    }
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    run('email', () => (isSignup ? signUpEmail(form) : signInEmail(form)));
  };

  return (
    <AuthShell>
      <h1 className="auth-title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
      {isSignup && (
        <p className="auth-sub">Already a member? <Link className="link" to="/login">Log in</Link></p>
      )}

      <div style={{ marginTop: 24 }}>
        <Button className="btn-block" icon={GoogleIcon} loading={busy === 'google'} disabled={!!busy} onClick={() => run('google', signInGoogle)}>
          {isSignup ? 'Sign up with Google' : 'Log in with Google'}
        </Button>
      </div>

      <div className="divider-or">or</div>

      <form className="auth-form" style={{ marginTop: 12 }} onSubmit={submit} noValidate>
        {errors.form && <div className="form-error" role="alert">{errors.form}</div>}

        {isSignup && (
          <Field label="Full name" htmlFor="name" error={errors.name}>
            <input id="name" className="input" autoComplete="name" placeholder="Ravi Rathod" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
          </Field>
        )}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" className="input" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={set('email')} aria-invalid={!!errors.email} />
        </Field>
        {isSignup && (
          <Field label="Phone number" htmlFor="phone" error={errors.phone}>
            <input id="phone" type="tel" className="input" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
          </Field>
        )}
        <Field
          label={
            <span className="row-between" style={{ width: '100%' }}>
              <span>Password</span>
              {!isSignup && <Link className="link" style={{ fontSize: 13 }} to="/forgot-password" tabIndex={0}>Forgot password?</Link>}
            </span>
          }
          htmlFor="password"
          error={errors.password}
          hint={isSignup ? 'At least 8 characters.' : undefined}
        >
          <div className="input-wrap">
            <input id="password" type={showPw ? 'text' : 'password'} className="input" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="••••••••" value={form.password} onChange={set('password')} aria-invalid={!!errors.password} />
            <IconButton label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((s) => !s)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </IconButton>
          </div>
        </Field>

        <Button type="submit" variant="primary" className="btn-block" loading={busy === 'email'} disabled={!!busy}>
          {isSignup ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <p className="auth-foot">
        {isSignup ? (
          <>By signing up you agree to our terms and privacy policy.</>
        ) : (
          <>Don’t have an account? <Link className="link" to="/signup">Sign up</Link></>
        )}
      </p>
    </AuthShell>
  );
}
