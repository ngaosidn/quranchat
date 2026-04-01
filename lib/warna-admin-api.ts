import { NextResponse } from 'next/server';
import { isWarnaAdminEnabled } from '@/lib/warna-admin-enabled';

/** 404 tanpa body agar tidak terlihat ada endpoint admin di production. */
export function warnaAdminDisabledResponse(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

export function assertWarnaAdminEnabled(): NextResponse | null {
  if (!isWarnaAdminEnabled()) return warnaAdminDisabledResponse();
  return null;
}
