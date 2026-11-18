import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function ComingSoon({ icon, title, description }) {
  return (
    <div className="soon-page">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={<span className="badge">Coming soon</span>}
      />
      <Link to="/dashboard" className="link" style={{ marginTop: -24 }}>Back to dashboard</Link>
    </div>
  );
}
