import { Response, CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE = 'accessToken';
export const REFRESH_COOKIE = 'refreshToken';

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  const options = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function ensureAdminRole(user: {
  email: string;
  role?: string;
  save: () => Promise<unknown>;
}): Promise<void> {
  const admins = getAdminEmails();
  if (admins.includes(user.email.toLowerCase()) && user.role !== 'admin') {
    (user as any).role = 'admin';
    await user.save();
  }
}
