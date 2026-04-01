import { Suspense } from 'react';
import AdminLoginClient from './AdminLoginClient';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center p-4 text-slate-600">Memuat…</div>
      }
    >
      <AdminLoginClient />
    </Suspense>
  );
}
