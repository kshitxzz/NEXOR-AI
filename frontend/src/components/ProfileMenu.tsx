import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { fetchUserProfile, type UserProfile } from '../services/api';
import UserAvatar from './UserAvatar';
import './ProfileMenu.css';

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const { plan } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasActivePro = plan?.plan === 'pro' && !plan?.subscriptionLapsed;
  const displayLabel =
    profile?.displayName || profile?.fullName || user?.email?.split('@')[0] || 'Account';

  useEffect(() => {
    if (!user) return;
    fetchUserProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className="profile-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Open profile menu"
      >
        <UserAvatar
          name={profile?.fullName || profile?.displayName}
          email={user.email}
          avatarUrl={profile?.avatarUrl}
          size="sm"
        />
        <span className="profile-trigger-name">{displayLabel}</span>
        <span className={`profile-chevron ${open ? 'open' : ''}`} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="profile-dropdown glass-card" role="menu">
          <div className="profile-dropdown-header">
            <UserAvatar
              name={profile?.fullName || profile?.displayName}
              email={user.email}
              avatarUrl={profile?.avatarUrl}
              size="md"
            />
            <div>
              <p className="profile-dropdown-name">{displayLabel}</p>
              <p className="profile-dropdown-email">{user.email}</p>
              {plan && (
                <span
                  className={`plan-badge plan-${plan.subscriptionLapsed ? 'expired' : plan.plan}`}
                >
                  {plan.subscriptionLapsed
                    ? 'Pro expired'
                    : plan.plan === 'pro'
                      ? 'Pro'
                      : `Free · ${plan.remaining ?? 0}/${plan.dailyLimit ?? 5} left`}
                </span>
              )}
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          <Link
            to="/settings?section=general"
            className="profile-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <Link
            to="/settings?section=billing"
            className="profile-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Billing & plan
          </Link>
          {!hasActivePro && (
            <Link
              to="/pricing"
              className="profile-dropdown-item profile-dropdown-item-accent"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {plan?.subscriptionLapsed ? 'Renew Pro' : 'Upgrade to Pro'}
            </Link>
          )}

          <div className="profile-dropdown-divider" />

          <button
            type="button"
            className="profile-dropdown-item profile-dropdown-item-danger"
            role="menuitem"
            onClick={handleSignOut}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
