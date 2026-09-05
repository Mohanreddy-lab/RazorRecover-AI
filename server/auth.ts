import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export type UserRole = 'admin' | 'merchant';
export interface AuthUser { email: string; role: UserRole }

const cookieName = 'razorrecover_session';
const sessionSecret = process.env.AUTH_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-session-secret');

function configuredUser(role: UserRole): { email?: string; password?: string } {
  return role === 'admin'
    ? { email: process.env.AUTH_ADMIN_EMAIL, password: process.env.AUTH_ADMIN_PASSWORD }
    : { email: process.env.AUTH_MERCHANT_EMAIL, password: process.env.AUTH_MERCHANT_PASSWORD };
}

export function authRequired(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.AUTH_REQUIRED === 'true';
}

export function validateAuthConfiguration(): void {
  if (!authRequired()) return;
  const missing = [
    !sessionSecret && 'AUTH_SESSION_SECRET',
    !configuredUser('admin').email && 'AUTH_ADMIN_EMAIL',
    !configuredUser('admin').password && 'AUTH_ADMIN_PASSWORD',
    !configuredUser('merchant').email && 'AUTH_MERCHANT_EMAIL',
    !configuredUser('merchant').password && 'AUTH_MERCHANT_PASSWORD'
  ].filter(Boolean);
  if (missing.length) throw new Error(`Missing authentication environment variables: ${missing.join(', ')}`);
}

function encode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string): string {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(request: Request): Record<string, string> {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const [key, ...value] = part.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
  }));
}

export function getAuthenticatedUser(request: Request): AuthUser | null {
  if (!authRequired()) return { email: 'local@example.com', role: 'admin' };
  if (!sessionSecret) return null;
  const token = parseCookies(request)[cookieName];
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AuthUser & { exp: number };
    return session.exp > Date.now() && (session.role === 'admin' || session.role === 'merchant')
      ? { email: session.email, role: session.role }
      : null;
  } catch {
    return null;
  }
}

export function login(email: string, password: string): AuthUser | null {
  for (const role of ['admin', 'merchant'] as const) {
    const user = configuredUser(role);
    if (user.email && user.password && safeEqual(user.email, email) && safeEqual(user.password, password)) {
      return { email: user.email, role };
    }
  }
  return null;
}

export function setSession(response: Response, user: AuthUser): void {
  const payload = encode(JSON.stringify({ ...user, exp: Date.now() + 8 * 60 * 60 * 1000 }));
  response.setHeader('Set-Cookie', `${cookieName}=${payload}.${sign(payload)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export function clearSession(response: Response): void {
  response.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const user = getAuthenticatedUser(request);
    if (!user || !roles.includes(user.role)) return response.status(401).json({ error: 'Authentication required.' });
    (request as Request & { user?: AuthUser }).user = user;
    next();
  };
}
