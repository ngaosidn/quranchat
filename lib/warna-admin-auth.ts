import { cookies } from 'next/headers';
import { verifyAdminSessionToken } from '@/lib/warna-admin-session';

export async function isWarnaAdminAuthorized(req: Request): Promise<boolean> {
  const secret = process.env.WARNA_ADMIN_SECRET;
  if (!secret) return false;

  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ') && auth.slice(7) === secret) {
    return true;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('warna_admin_session')?.value;
  return verifyAdminSessionToken(token);
}
