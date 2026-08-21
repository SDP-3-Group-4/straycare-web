import type { SyntheticEvent } from 'react';

export const DEFAULT_AVATAR = 'https://res.cloudinary.com/dxpufap96/image/upload/v1765859391/cy4leimp8itbbl4spokh.png';

export function avatarOnError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== DEFAULT_AVATAR && img.src !== '') {
    img.onerror = null;
    img.src = DEFAULT_AVATAR;
  }
}

export function formatHandle(handle?: string | null, fallback = ''): string {
  const raw = (handle || fallback || '').trim();
  if (!raw) return '';
  // If it's an email address and no separate handle
  if (raw.includes('@') && raw.includes('.') && !handle) {
    return raw;
  }
  const clean = raw.replace(/^@+/, '');
  return clean ? `@${clean}` : '';
}