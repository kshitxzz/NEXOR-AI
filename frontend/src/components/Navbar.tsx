import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { plan } = useUser();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="navbar glass-card">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">◆</span>
          <span>
            NEXOR<span className="gradient-text">AI</span>
          </span>
        </Link>

        <nav className="nav-links">
          <Link to="/#tools" className={pathname === '/' ? 'active' : ''}>
            Tools
          </Link>
          <Link to="/#categories">Categories</Link>
          <Link to="/pricing">Pricing</Link>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              {plan && (
                <span className={`plan-badge plan-${plan.plan}`} title="Your personal daily limit">
                  {plan.plan === 'pro'
                    ? 'Pro'
                    : `Free · ${plan.remaining ?? 0}/${plan.dailyLimit ?? 5} today`}
                </span>
              )}
              <span className="nav-email" title={user.email}>
                {user.email?.split('@')[0]}
              </span>
              <Link to="/pricing" className="btn btn-primary btn-sm">
                Upgrade
              </Link>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleSignOut}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
