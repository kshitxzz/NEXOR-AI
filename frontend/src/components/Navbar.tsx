import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import ProfileMenu from './ProfileMenu';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { plan } = useUser();

  const hasActivePro = plan?.plan === 'pro' && !plan?.subscriptionLapsed;
  const showUpgrade = user && !hasActivePro;

  return (
    <header className="navbar glass-card">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">◆</span>
          <span>
            NEXOR<span className="gradient-text">AI</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link to="/#tools" className={pathname === '/' ? 'active' : ''}>
            Tools
          </Link>
          <Link to="/#categories">Categories</Link>
          <Link to="/pricing" className={pathname === '/pricing' ? 'active' : ''}>
            Pricing
          </Link>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              {plan && (
                <span
                  className={`plan-badge plan-${plan.subscriptionLapsed ? 'expired' : plan.plan}`}
                  title="Your plan status"
                >
                  {plan.subscriptionLapsed
                    ? 'Expired'
                    : plan.plan === 'pro'
                      ? 'Pro'
                      : `${plan.remaining ?? 0}/${plan.dailyLimit ?? 5} today`}
                </span>
              )}
              {showUpgrade && (
                <Link to="/pricing" className="btn btn-primary btn-sm nav-upgrade-btn">
                  {plan?.subscriptionLapsed ? 'Renew' : 'Upgrade'}
                </Link>
              )}
              <ProfileMenu />
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
