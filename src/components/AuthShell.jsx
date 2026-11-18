import { BrandMark, Avatar, Dot } from './ui';
import { CalendarDays } from 'lucide-react';

/** A static, product-style preview used as the hero image on the auth screens. */
function ProductMock() {
  const card = (title, who, date, color) => (
    <div className="mock-card">
      <p>{title}</p>
      <div className="mock-meta">
        <Dot color={color} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CalendarDays size={11} />{date}</span>
        <Avatar name={who} size={20} />
      </div>
    </div>
  );
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-bar"><span>Projects</span><span>/</span><b>Website Redesign</b></div>
      <div className="mock-stats">
        {[['Total tasks', '24'], ['In progress', '7'], ['Overdue', '2'], ['Progress', '62%']].map(([k, v]) => (
          <div className="mock-stat" key={k}><small>{k}</small><strong>{v}</strong></div>
        ))}
      </div>
      <div className="mock-body">
        <div className="mock-col">
          <h4><Dot color="#62666d" />To Do <span>3</span></h4>
          {card('Integrate CMS for blog', 'Aarav Mehta', 'Dec 12', '#f2c94c')}
          {card('Cross-browser QA pass', 'Diego Alvarez', 'Dec 16', '#8a8f98')}
        </div>
        <div className="mock-col">
          <h4><Dot color="#f2c94c" />In Progress <span>2</span></h4>
          {card('Build component library', 'Aarav Mehta', 'Dec 4', '#eb5757')}
          {card('Homepage hero motion', 'Sara Collins', 'Dec 6', '#f2c94c')}
        </div>
        <div className="mock-col">
          <h4><Dot color="#27a644" />Done <span>5</span></h4>
          {card('Audit existing pages', 'Sara Collins', 'Nov 20', '#f2c94c')}
          {card('Design navigation', 'Sara Collins', 'Nov 28', '#eb5757')}
        </div>
      </div>
    </div>
  );
}

export default function AuthShell({ children }) {
  return (
    <div className="auth">
      <section className="auth-visual">
        <div className="auth-brand"><BrandMark size={28} /> InfoLoop PMS</div>
        <div className="auth-copy">
          <p className="eyebrow">PROJECT MANAGEMENT</p>
          <h2 style={{ marginTop: 12 }}>Plan work. Track progress. Ship on time.</h2>
          <p>One calm workspace for your projects, tasks and team, so deadlines stop slipping through the cracks.</p>
        </div>
        <div className="mock-wrap"><ProductMock /></div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand auth-brand-m"><BrandMark size={28} /> InfoLoop PMS</div>
          {children}
        </div>
      </section>
    </div>
  );
}
