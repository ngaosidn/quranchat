import { notFound } from 'next/navigation';
import { isWarnaAdminEnabled } from '@/lib/warna-admin-enabled';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  if (!isWarnaAdminEnabled()) {
    notFound();
  }
  return <>{children}</>;
}
