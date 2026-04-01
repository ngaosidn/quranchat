import { createHmac, timingSafeEqual } from 'crypto';

const SALT = 'warna-admin-v1';

export function signAdminSession(): string {
  const secret = process.env.WARNA_ADMIN_SECRET;
  if (!secret) {
    throw new Error('WARNA_ADMIN_SECRET is not configured');
  }
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const sig = createHmac('sha256', secret).update(`${SALT}:${exp}`).digest('hex');
  return Buffer.from(JSON.stringify({ exp, sig })).toString('base64url');
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = process.env.WARNA_ADMIN_SECRET;
  if (!secret) return false;
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const { exp, sig } = JSON.parse(raw) as { exp: number; sig: string };
    if (typeof exp !== 'number' || typeof sig !== 'string' || Date.now() > exp) {
      return false;
    }
    const expected = createHmac('sha256', secret).update(`${SALT}:${exp}`).digest('hex');
    if (sig.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}
