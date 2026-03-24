import { NextResponse } from 'next/server';
import { assertWarnaAdminEnabled } from '@/lib/warna-admin-api';

export async function POST() {
  const disabled = assertWarnaAdminEnabled();
  if (disabled) return disabled;

  const res = NextResponse.json({ ok: true });
  res.cookies.set('warna_admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
