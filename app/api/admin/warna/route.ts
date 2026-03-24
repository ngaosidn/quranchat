import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { assertWarnaAdminEnabled } from '@/lib/warna-admin-api';
import { isWarnaAdminAuthorized } from '@/lib/warna-admin-auth';

const WARNA_PATH = path.join(process.cwd(), 'public', 'data', 'warna.json');

function isValidWords(w: unknown): boolean {
  if (typeof w === 'string') return true;
  return Array.isArray(w) && w.length > 0 && w.every((x) => typeof x === 'string');
}

function isValidOccurrence(o: unknown): boolean {
  if (o === undefined) return true;
  if (typeof o === 'number' && Number.isFinite(o) && o >= 1) return true;
  return (
    Array.isArray(o) &&
    o.length > 0 &&
    o.every((x) => typeof x === 'number' && Number.isFinite(x) && x >= 1)
  );
}

function sanitizeRule(r: Record<string, unknown>): Record<string, unknown> | null {
  if (typeof r.surah !== 'number' || typeof r.ayat !== 'number') return null;
  if (!isValidWords(r.green_word) || !isValidWords(r.red_word)) return null;
  if (!isValidOccurrence(r.green_occurrence) || !isValidOccurrence(r.red_occurrence)) return null;

  const out: Record<string, unknown> = {
    surah: r.surah,
    ayat: r.ayat,
    green_word: r.green_word,
    red_word: r.red_word,
  };
  if (r.green_occurrence !== undefined) out.green_occurrence = r.green_occurrence;
  if (r.red_occurrence !== undefined) out.red_occurrence = r.red_occurrence;
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
        { error: 'Setiap rule wajib surah/ayat (angka), green_word & red_word (teks / array teks), occurrence opsional' },
        { status: 400 }
      );
    }
    rules.push(clean);
  }

  const out = JSON.stringify({ rules }, null, 2) + '\n';
  try {
    await fs.writeFile(WARNA_PATH, out, 'utf8');
  } catch (e) {
    console.error('write warna.json', e);
    return NextResponse.json(
      { error: 'Gagal menulis file (cek izin folder di server)' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
