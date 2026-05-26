import { useState } from 'react';
import './UserAvatar.css';

interface UserAvatarProps {
  name?: string;
  email?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.split('@')[0] || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function UserAvatar({ name, email, avatarUrl, size = 'md' }: UserAvatarProps) {
  const initials = getInitials(name, email);
  const [imgFailed, setImgFailed] = useState(false);

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`user-avatar user-avatar-${size}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span className={`user-avatar user-avatar-${size} user-avatar-fallback`} aria-hidden>
      {initials}
    </span>
  );
}
