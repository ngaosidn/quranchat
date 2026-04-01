/**
 * Editor admin warna: untuk PC lokal saja.
 *
 * - `next dev` → aktif (tanpa variabel tambahan), asal WARNA_ADMIN_SECRET di .env.local.
 * - `next start` / production (mis. Vercel, NODE_ENV=production) → nonaktif secara default,
 *   agar /admin dan API tidak terbuka di hosting.
 * - Untuk uji `next start` di mesin sendiri: set WARNA_ADMIN_ENABLED=1 di .env.local
 *   (jangan set di Vercel).
 */
export function isWarnaAdminEnabled(): boolean {
  const v = process.env.WARNA_ADMIN_ENABLED?.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  return process.env.NODE_ENV !== 'production';
}
