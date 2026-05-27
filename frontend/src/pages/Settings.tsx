import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import UserAvatar from '../components/UserAvatar';
import { supabase } from '../lib/supabase';
import {
  deleteUserAccount,
  fetchBillingInfo,
  fetchUserProfile,
  fetchUserSessions,
  updateUserProfile,
  type BillingInfo,
  type UserProfile,
  type UserSession,
} from '../services/api';
import './Settings.css';

type Section = 'general' | 'account' | 'billing';

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: 'general', label: 'General', description: 'Profile & preferences' },
  { id: 'account', label: 'Account', description: 'Security & sessions' },
  { id: 'billing', label: 'Billing', description: 'Plan & subscription' },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const section = (searchParams.get('section') as Section) || 'general';
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { refreshPlan } = useUser();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const setSection = (id: Section) => {
    setSearchParams({ section: id });
    setMessage('');
    setError('');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prof, bill, sess] = await Promise.all([
        fetchUserProfile(),
        fetchBillingInfo(),
        fetchUserSessions(),
      ]);
      setProfile(prof);
      setBilling(bill);
      setSessions(sess.sessions);
      setFullName(prof.fullName);
      setDisplayName(prof.displayName);
      setAvatarUrl(prof.avatarUrl);
      await refreshPlan();
    } catch (err) {
      setError((err as Error).message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [refreshPlan]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await updateUserProfile({ fullName, displayName, avatarUrl });
      setProfile((p) =>
        p
          ? {
              ...p,
              fullName: updated.fullName,
              displayName: updated.displayName,
              avatarUrl: updated.avatarUrl,
            }
          : p
      );
      setMessage('Profile saved successfully.');
    } catch (err) {
      setError((err as Error).message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRevokeOthers = async () => {
    if (!supabase) {
      setError('Session management is unavailable.');
      return;
    }
    setRevoking(true);
    setError('');
    setMessage('');
    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
      if (signOutError) throw signOutError;
      setMessage('Signed out on all other devices.');
    } catch (err) {
      setError((err as Error).message || 'Could not revoke other sessions');
    } finally {
      setRevoking(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Type DELETE to confirm account deletion.');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await deleteUserAccount();
      await signOut();
      navigate('/');
    } catch (err) {
      setError((err as Error).message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const hasActivePro = billing?.plan === 'pro' && !billing?.subscriptionLapsed;

  if (loading) {
    return (
      <main className="settings-page section">
        <div className="container settings-loading">
          <div className="loader" />
          <p>Loading settings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="settings-page section">
      <div className="container settings-container">
        <header className="settings-header">
          <h1>Settings</h1>
          <p className="settings-subtitle">Manage your profile, account, and subscription</p>
        </header>

        {message && <div className="settings-toast success">{message}</div>}
        {error && <div className="settings-toast error">{error}</div>}

        <div className="settings-layout">
          <aside className="settings-nav glass-card">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`settings-nav-item ${section === s.id ? 'active' : ''}`}
                onClick={() => setSection(s.id)}
              >
                <span className="settings-nav-label">{s.label}</span>
                <span className="settings-nav-desc">{s.description}</span>
              </button>
            ))}
          </aside>

          <div className="settings-panel glass-card">
            {section === 'general' && (
              <form onSubmit={handleSaveGeneral} className="settings-section">
                <h2>General</h2>
                <p className="settings-section-desc">
                  Customize how you appear across NexorAI.
                </p>

                <div className="settings-avatar-row">
                  <UserAvatar
                    name={fullName || displayName}
                    email={profile?.email}
                    avatarUrl={avatarUrl}
                    size="lg"
                  />
                  <div className="settings-field">
                    <label htmlFor="avatarUrl">Avatar URL</label>
                    <input
                      id="avatarUrl"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                    />
                    <span className="field-hint">Paste an image link, or leave blank for initials.</span>
                  </div>
                </div>

                <div className="settings-field">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    maxLength={120}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="displayName">What should NexorAI call you?</label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex"
                    maxLength={60}
                  />
                  <span className="field-hint">Used in greetings and your profile menu.</span>
                </div>

                <div className="settings-field">
                  <label>Email</label>
                  <input type="email" value={profile?.email || user?.email || ''} disabled />
                  <span className="field-hint">Email is managed through your login provider.</span>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {section === 'account' && (
              <div className="settings-section">
                <h2>Account</h2>
                <p className="settings-section-desc">Security, sessions, and account actions.</p>

                <div className="settings-block">
                  <h3>Active sessions</h3>
                  <p className="field-hint">
                    For your security, we only show details for your current session. Sign out
                    elsewhere if you suspect unauthorized access.
                  </p>
                  <ul className="sessions-list">
                    {sessions.map((s) => (
                      <li key={s.id} className="session-card">
                        <div className="session-card-top">
                          <span className="session-device">{s.device}</span>
                          {s.current && <span className="session-badge">Current</span>}
                        </div>
                        <dl className="session-meta">
                          <div>
                            <dt>IP address</dt>
                            <dd>{s.ip}</dd>
                          </div>
                          <div>
                            <dt>Signed in</dt>
                            <dd className="text-muted">{formatDateTime(s.signedInAt)}</dd>
                          </div>
                          <div>
                            <dt>Last active</dt>
                            <dd className="text-muted">{formatDateTime(s.lastActive)}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleRevokeOthers}
                    disabled={revoking}
                  >
                    {revoking ? 'Signing out...' : 'Sign out other devices'}
                  </button>
                </div>

                <div className="settings-block">
                  <h3>Log out</h3>
                  <p className="field-hint">Sign out of NexorAI on this device.</p>
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleSignOut}>
                    Log Out
                  </button>
                </div>

                <div className="settings-block settings-block-danger">
                  <h3>Delete your account</h3>
                  <p className="field-hint">
                    Permanently delete your account and all associated data. This cannot be
                    undone.
                  </p>
                  <input
                    type="text"
                    className="delete-confirm-input"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder='Type DELETE to confirm'
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirm !== 'DELETE'}
                  >
                    {deleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            )}

            {section === 'billing' && billing && (
              <div className="settings-section">
                <h2>Billing</h2>
                <p className="settings-section-desc">Your plan, usage, and subscription dates.</p>

                <div className="billing-summary">
                  <div className="billing-plan-card">
                    <span className="billing-label">Current plan</span>
                    <p className="billing-plan-name">{billing.planLabel}</p>
                    <span
                      className={`billing-status billing-status-${billing.status}`}
                    >
                      {billing.status === 'active'
                        ? 'Active'
                        : billing.status === 'expired'
                          ? 'Expired'
                          : 'Free'}
                    </span>
                  </div>

                  <dl className="billing-details">
                    <div>
                      <dt>Subscription status</dt>
                      <dd className="text-muted">
                        {billing.subscriptionLapsed
                          ? 'Ended — renew to restore Pro'
                          : hasActivePro
                            ? 'Active subscription'
                            : 'Free tier'}
                      </dd>
                    </div>
                    {hasActivePro && (
                      <>
                        <div>
                          <dt>Plan start date</dt>
                          <dd className="text-muted">{formatDate(billing.planStartedAt)}</dd>
                        </div>
                        <div>
                          <dt>Plan expiration date</dt>
                          <dd className="text-muted">{formatDate(billing.planExpiresAt)}</dd>
                        </div>
                      </>
                    )}
                    {billing.subscriptionLapsed && (
                      <div>
                        <dt>Expired on</dt>
                        <dd className="text-muted">{formatDate(billing.planExpiresAt)}</dd>
                      </div>
                    )}
                    {!hasActivePro && !billing.subscriptionLapsed && (
                      <div>
                        <dt>Today&apos;s usage</dt>
                        <dd className="text-muted">
                          {billing.dailyUsed} / {billing.dailyLimit ?? 5} generations
                          {billing.remaining !== null && (
                            <> · {billing.remaining} remaining</>
                          )}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Member since</dt>
                      <dd className="text-muted">{formatDate(billing.memberSince)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="settings-actions-row">
                  {!hasActivePro ? (
                    <Link to="/pricing" className="btn btn-primary">
                      {billing.subscriptionLapsed ? 'Renew Pro Plan' : 'Upgrade Plan'}
                    </Link>
                  ) : (
                    <Link to="/pricing" className="btn btn-outline">
                      Change Plan
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
