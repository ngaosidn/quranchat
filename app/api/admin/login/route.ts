import { NextResponse } from 'next/server';
import { assertWarnaAdminEnabled } from '@/lib/warna-admin-api';
import { signAdminSession } from '@/lib/warna-admin-session';

export async function POST(req: Request) {
  const disabled = assertWarnaAdminEnabled();
  if (disabled) return disabled;

  const secret = process.env.WARNA_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Server belum di-set: tambahkan WARNA_ADMIN_SECRET di .env.local' },
      { status: 503 }
    );
  }

  let body: { secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ error: 'Kata sandi salah' }, { status: 401 });
  }

  let token: string;
  try {
    token = signAdminSession();
  } catch {
    return NextResponse.json({ error: 'Konfigurasi sesi gagal' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('warna_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
