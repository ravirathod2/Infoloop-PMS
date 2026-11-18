import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Eye, EyeOff, MoreHorizontal, X } from 'lucide-react';
import { OVERDUE_COLOR, avatarPos, priority as getPriority, projectStatus, taskStatus } from '../lib/constants';
import { initials } from '../lib/utils';

export function BrandMark({ size = 24 }) {
  // Logo: five stacked bars, one in the brand orange. Bars use the ink colour so they read on the dark canvas.
  return (
    <svg width={size} height={size} viewBox="14 24 172 152" aria-hidden="true">
      <g fill="#f7f8f8">
        <rect x="40" y="30" width="120" height="20" rx="10" />
        <rect x="20" y="90" width="160" height="20" rx="10" />
        <rect x="67" y="120" width="66" height="20" rx="10" />
        <rect x="40" y="150" width="120" height="20" rx="10" />
      </g>
      <rect x="55" y="60" width="90" height="20" rx="10" fill="#f58220" />
    </svg>
  );
}

export function Button({ variant = 'secondary', size, icon: Icon, loading, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={loading || rest.disabled}
      className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : Icon && <Icon size={16} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-btn ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

/** Native select with a leading dot / icon and custom chevron. */
export function Select({ value, onChange, options, leading, id, placeholder, className = '', ...rest }) {
  return (
    <div className={`select ${className}`}>
      {leading && <span className="select-lead">{leading}</span>}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={leading ? 'has-lead' : ''} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value ?? o.key} value={o.value ?? o.key}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="select-chev" />
    </div>
  );
}

export function Dot({ color, size = 8 }) {
  return <span className="dot" style={{ background: color, width: size, height: size }} />;
}

export function ProjectBadge({ status }) {
  const s = projectStatus(status);
  return (
    <span className="badge">
      <Dot color={s.color} />
      {s.label}
    </span>
  );
}

export function TaskStatusIcon({ status, size = 14 }) {
  const s = taskStatus(status);
  const r = 5.25;
  const c = 2 * Math.PI * r;
  const fill = { todo: 0, in_progress: 0.5, in_review: 0.75, done: 1 }[status] ?? 0;
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-label={s.label} role="img">
      <circle cx="7" cy="7" r={r} fill="none" stroke={s.color} strokeWidth="1.5" strokeDasharray={status === 'todo' ? '2 2' : undefined} />
      {fill > 0 && fill < 1 && (
        <circle cx="7" cy="7" r={r / 2} fill="none" stroke={s.color} strokeWidth={r} strokeDasharray={`${(c / 2) * fill} ${c}`} transform="rotate(-90 7 7)" />
      )}
      {fill === 1 && <circle cx="7" cy="7" r="7" fill={s.color} />}
      {fill === 1 && <path d="M4.3 7.2l1.8 1.8 3.6-3.8" stroke="#010102" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function PriorityIcon({ priority, size = 14 }) {
  const p = getPriority(priority);
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-label={`${p.label} priority`} role="img">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={1.5 + i * 4.5} y={9 - i * 3.5} width="3" height={3 + i * 3.5} rx="1" fill={i < p.level ? p.color : '#34343a'} />
      ))}
    </svg>
  );
}

export function Avatar({ name, src, size = 24, title }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }} title={title ?? name}>
      {src ? <img src={src} alt="" loading="lazy" style={{ objectPosition: avatarPos(src) }} /> : initials(name)}
    </span>
  );
}

export function ProgressBar({ pct, color, height = 4 }) {
  return (
    <div className="progress" style={{ height }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%`, background: color || (pct === 100 ? '#27a644' : '#5e6ad2') }} />
    </div>
  );
}

export function DueChip({ label, overdue }) {
  return <span className="chip" style={overdue ? { color: OVERDUE_COLOR } : undefined}>{label}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="empty-icon">
          <Icon size={20} strokeWidth={1.5} />
        </span>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={16} /></IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', variant = 'danger', busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <div className="modal-body"><p className="muted">{message}</p></div>
      <div className="modal-foot">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant={variant} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function Menu({ renderTrigger, label = 'More actions', align = 'right', up, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((o) => !o);
  };

  // preventDefault keeps a surrounding <a> (e.g. a project card) from navigating.
  return (
    <div className="menu-root" ref={ref} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {renderTrigger ? (
        renderTrigger({ open, toggle })
      ) : (
        <IconButton label={label} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
          <MoreHorizontal size={16} />
        </IconButton>
      )}
      {open && (
        <div className={`menu menu-${align} ${up ? 'menu-up' : ''}`} role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, danger, children, ...rest }) {
  return (
    <button type="button" role="menuitem" className={`menu-item ${danger ? 'danger' : ''}`} {...rest}>
      {Icon && <Icon size={15} strokeWidth={1.75} />}
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <header className="page-head">
      <div>
        {back}
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

/** Overlapping avatars: first `max` members, then a "+N" bubble for the rest. */
export function MemberStack({ members, max = 3, size = 24 }) {
  if (!members.length) return <span className="muted" style={{ fontSize: 12 }}>No members</span>;
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  return (
    <span className="avatar-stack" title={members.map((m) => m.name).join(', ')}>
      {shown.map((m) => <Avatar key={m.id} name={m.name} src={m.avatar} size={size} title={m.name} />)}
      {rest > 0 && (
        <span className="avatar avatar-more" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.38) }}>+{rest}</span>
      )}
    </span>
  );
}

export function PasswordInput({ id, value, onChange, placeholder = '••••••••', autoComplete = 'new-password', invalid, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input id={id} type={show ? 'text' : 'password'} className="input" value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={invalid} autoFocus={autoFocus} />
      <IconButton label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </IconButton>
    </div>
  );
}
