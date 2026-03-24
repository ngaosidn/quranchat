import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSessionToken } from '@/lib/warna-admin-session';

export const metadata = {
  title: 'Editor warna.json',
  robots: { index: false, follow: false },
};

export default async function WarnaEditorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('warna_admin_session')?.value;
  if (!verifyAdminSessionToken(token)) {
    redirect('/admin/login?next=%2Fadmin%2Fwarna');
  }
  return <>{children}</>;
}
