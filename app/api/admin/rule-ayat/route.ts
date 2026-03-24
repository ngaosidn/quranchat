import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { assertWarnaAdminEnabled } from '@/lib/warna-admin-api';
import { isWarnaAdminAuthorized } from '@/lib/warna-admin-auth';

const RULE_AYAT_PATH = path.join(process.cwd(), 'public', 'data', 'rule-ayat.json');

function isOptionalString(v: unknown): boolean {
  return v === undefined || typeof v === 'string';
}

function sanitizeRule(r: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof r.surah !== 'number' || typeof r.ayat !== 'number') return null;
  if (!isOptionalString(r.title)) return null;
  if (!isOptionalString(r.audio_url)) return null;
  if (!isOptionalString(r.image_url)) return null;
  if (!isOptionalString(r.video_url)) return null;
  if (!isOptionalString(r.explanation)) return null;

  const out: Record<string, unknown> = {
    surah: r.surah,
    ayat: r.ayat,
  };
  if (r.title !== undefined) out.title = r.title;
  if (r.audio_url !== undefined) out.audio_url = r.audio_url;
  if (r.image_url !== undefined) out.image_url = r.image_url;
  if (r.video_url !== undefined) out.video_url = r.video_url;
  if (r.explanation !== undefined) out.explanation = r.explanation;
  return out;
}

export async function POST(req: Request) {
  const disabled = assertWarnaAdminEnabled();
  if (disabled) return disabled;

  if (!(await isWarnaAdminAuthorized(req))) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON tidak valid' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !('rules' in body)) {
    return NextResponse.json({ error: 'Harus berisi { rules: [...] }' }, { status: 400 });
  }

  const rawRules = (body as { rules: unknown }).rules;
  if (!Array.isArray(rawRules)) {
    return NextResponse.json({ error: 'rules harus array' }, { status: 400 });
  }

  const rules: Record<string, unknown>[] = [];
  for (const r of rawRules) {
    if (!r || typeof r !== 'object') {
      return NextResponse.json({ error: 'Rule tidak valid' }, { status: 400 });
    }
    const clean = sanitizeRule(r as Record<string, unknown>);
    if (!clean) {
      return NextResponse.json(
        {
          error:
            'Setiap rule wajib surah/ayat (angka). Field title/audio_url/image_url/video_url/explanation bersifat opsional string.',
        },
        { status: 400 }
      );
    }
    rules.push(clean);
  }

  const out = JSON.stringify({ rules }, null, 2) + '\n';
  try {
    await fs.writeFile(RULE_AYAT_PATH, out, 'utf8');
  } catch (e) {
    console.error('write rule-ayat.json', e);
    return NextResponse.json(
      { error: 'Gagal menulis file (cek izin folder di server)' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

