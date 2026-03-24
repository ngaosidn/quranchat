'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type WarnaRuleForm = {
  id: string;
  surah: string;
  ayat: string;
  greenLines: string;
  redLines: string;
  greenOccurrence: string;
  redOccurrence: string;
};

function newRowId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function linesToArray(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function wordsToLines(w: string | string[] | undefined): string {
  if (!w) return '';
  if (Array.isArray(w)) return w.join('\n');
  return w;
}

function parseOccurrence(raw: string): number | number[] | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (t.includes(',')) {
    const nums = t
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s));
    if (nums.some((n) => !Number.isFinite(n) || n < 1)) return undefined;
    return nums;
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

function rowToJson(row: WarnaRuleForm): Record<string, unknown> {
  const surah = Number(row.surah);
  const ayat = Number(row.ayat);
  const green_word = linesToArray(row.greenLines);
  const red_word = linesToArray(row.redLines);
  const out: Record<string, unknown> = { surah, ayat, green_word, red_word };
  const go = parseOccurrence(row.greenOccurrence);
  const ro = parseOccurrence(row.redOccurrence);
  if (go !== undefined) out.green_occurrence = go;
  if (ro !== undefined) out.red_occurrence = ro;
  return out;
}

function jsonToRow(r: Record<string, unknown>): WarnaRuleForm {
  const go = r.green_occurrence;
  const ro = r.red_occurrence;
  return {
    id: newRowId(),
    surah: String(r.surah ?? ''),
    ayat: String(r.ayat ?? ''),
    greenLines: wordsToLines(r.green_word as string | string[]),
    redLines: wordsToLines(r.red_word as string | string[]),
    greenOccurrence:
      go === undefined
        ? ''
        : Array.isArray(go)
          ? go.join(', ')
          : String(go),
    redOccurrence:
      ro === undefined ? '' : Array.isArray(ro) ? ro.join(', ') : String(ro),
  };
}

const emptyRow = (): WarnaRuleForm => ({
  id: newRowId(),
  surah: '',
  ayat: '',
  greenLines: '',
  redLines: '',
  greenOccurrence: '',
  redOccurrence: '',
});

function sortRows(list: WarnaRuleForm[]): WarnaRuleForm[] {
  return [...list].sort((a, b) => {
    const sa = Number(a.surah) || 0;
    const sb = Number(b.surah) || 0;
    if (sa !== sb) return sa - sb;
    return (Number(a.ayat) || 0) - (Number(b.ayat) || 0);
  });
}

function previewSnippet(text: string, maxLen: number): string {
  const first = linesToArray(text)[0] ?? '';
  const t = first.replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t || '—';
  return `${t.slice(0, maxLen)}…`;
}

function occurrenceLabel(g: string, r: string): string {
  const parts: string[] = [];
  if (g.trim()) parts.push(`H:${g.trim()}`);
  if (r.trim()) parts.push(`M:${r.trim()}`);
  return parts.length ? parts.join(' · ') : '—';
}

const inputClass =
  'mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

const textareaClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 font-uthmanic-warna-editor text-lg leading-relaxed text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export default function WarnaEditorForm() {
  const router = useRouter();
  const [rows, setRows] = useState<WarnaRuleForm[]>([]);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WarnaRuleForm>(() => emptyRow());

  const load = useCallback(async () => {
    loadAbortRef.current?.abort();
    const ac = new AbortController();
    loadAbortRef.current = ac;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/data/warna.json', { cache: 'no-store', signal: ac.signal });
      const data = await res.json();
      if (ac.signal.aborted) return;
      const rules = Array.isArray(data.rules) ? data.rules : [];
      setRows(
        rules.length ? rules.map((r: Record<string, unknown>) => jsonToRow(r)) : []
      );
    } catch {
      if (ac.signal.aborted) return;
      setMessage({ type: 'err', text: 'Gagal memuat warna.json' });
      setRows([]);
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistRules = useCallback(
    async (list: WarnaRuleForm[], successMsg = 'Tersimpan ke public/data/warna.json.') => {
      for (const row of list) {
        if (!row.surah.trim() || !row.ayat.trim()) {
          setMessage({ type: 'err', text: 'Setiap rule wajib isi surah dan ayat.' });
          return false;
        }
        if (!row.greenLines.trim() || !row.redLines.trim()) {
          setMessage({ type: 'err', text: 'Isi kata hijau dan merah (minimal satu baris).' });
          return false;
        }
      }

      const rules = sortRows(list).map((r) => rowToJson(r));
      setSaving(true);
      setMessage(null);
      try {
        const res = await fetch('/api/admin/warna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({ type: 'err', text: typeof data.error === 'string' ? data.error : 'Gagal menyimpan' });
          return false;
        }
        setRows(sortRows(list));
        setMessage({ type: 'ok', text: successMsg });
        router.refresh();
        return true;
      } finally {
        setSaving(false);
      }
    },
    [router]
  );

  function openCreate() {
    setFormMode('create');
    setEditingId(null);
    setDraft(emptyRow());
    setPanelOpen(true);
    setMessage(null);
  }

  function openEdit(row: WarnaRuleForm) {
    setFormMode('edit');
    setEditingId(row.id);
    setDraft({ ...row });
    setPanelOpen(true);
    setMessage(null);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingId(null);
    setDraft(emptyRow());
  }

  async function submitForm() {
    if (!draft.surah.trim() || !draft.ayat.trim()) {
      setMessage({ type: 'err', text: 'Isi surah dan ayat.' });
      return;
    }
    if (!draft.greenLines.trim() || !draft.redLines.trim()) {
      setMessage({ type: 'err', text: 'Isi frasa hijau dan merah (minimal satu baris).' });
      return;
    }

    let next: WarnaRuleForm[];
    if (formMode === 'create') {
      next = [...rows, { ...draft, id: draft.id || newRowId() }];
    } else if (editingId) {
      next = rows.map((r) => (r.id === editingId ? { ...draft, id: editingId } : r));
    } else {
      return;
    }

    const ok = await persistRules(next, 'Rule disimpan.');
    if (ok) closePanel();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Hapus rule ini dari warna.json?')) return;
    const next = rows.filter((r) => r.id !== id);
    await persistRules(next, 'Rule dihapus.');
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600">Memuat data…</div>
    );
  }

  const sorted = sortRows(rows);

  return (
    <div className="relative z-10 mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Editor warna (Ahkam garis)</h1>
          <p className="mt-1 text-sm text-slate-600">
            Daftar rule dari JSON. Tambah / edit membuka form; perubahan langsung ditulis ke file.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/rule-ayat"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Editor rule-ayat
          </Link>
          <button
            type="button"
            onClick={openCreate}
            disabled={saving || panelOpen}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            + Rule baru
          </button>
          <button
            type="button"
            onClick={load}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Muat ulang
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Keluar
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Surah</th>
                <th className="px-3 py-2.5 font-semibold">Ayat</th>
                <th className="px-3 py-2.5 font-semibold">Hijau (cuplikan)</th>
                <th className="px-3 py-2.5 font-semibold">Merah (cuplikan)</th>
                <th className="px-3 py-2.5 font-semibold">Occurrence</th>
                <th className="px-3 py-2.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                    Belum ada rule. Klik <strong>Rule baru</strong> untuk menambah.
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{row.surah || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-800">{row.ayat || '—'}</td>
                    <td
                      className="max-w-[180px] truncate px-3 py-2.5 font-uthmanic-warna-editor text-base text-slate-800"
                      dir="rtl"
                      title={linesToArray(row.greenLines)[0]}
                    >
                      {previewSnippet(row.greenLines, 42)}
                    </td>
                    <td
                      className="max-w-[180px] truncate px-3 py-2.5 font-uthmanic-warna-editor text-base text-slate-800"
                      dir="rtl"
                      title={linesToArray(row.redLines)[0]}
                    >
                      {previewSnippet(row.redLines, 42)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {occurrenceLabel(row.greenOccurrence, row.redOccurrence)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        disabled={saving || panelOpen}
                        className="mr-2 text-emerald-700 hover:underline disabled:opacity-40"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={saving}
                        className="text-red-600 hover:underline disabled:opacity-40"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {panelOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="warna-form-title"
          onClick={closePanel}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <h2 id="warna-form-title" className="text-lg font-semibold text-slate-800">
                {formMode === 'create' ? 'Rule baru' : 'Edit rule'}
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap gap-4">
                <label className="text-sm">
                  <span className="font-medium text-slate-700">Surah</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={draft.surah}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, surah: e.target.value.replace(/\D/g, '') }))
                    }
                    className={`${inputClass} block w-28`}
                  />
                </label>
                <label className="text-sm">
                  <span className="font-medium text-slate-700">Ayat</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={draft.ayat}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ayat: e.target.value.replace(/\D/g, '') }))
                    }
                    className={`${inputClass} block w-28`}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Kata / frasa hijau (satu per baris)</span>
                <textarea
                  dir="rtl"
                  autoComplete="off"
                  spellCheck={false}
                  value={draft.greenLines}
                  onChange={(e) => setDraft((d) => ({ ...d, greenLines: e.target.value }))}
                  rows={5}
                  className={textareaClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Kata / frasa merah (satu per baris)</span>
                <textarea
                  dir="rtl"
                  autoComplete="off"
                  spellCheck={false}
                  value={draft.redLines}
                  onChange={(e) => setDraft((d) => ({ ...d, redLines: e.target.value }))}
                  rows={5}
                  className={textareaClass}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-slate-600">green_occurrence (opsional)</span>
                  <input
                    type="text"
                    autoComplete="off"
                    value={draft.greenOccurrence}
                    onChange={(e) => setDraft((d) => ({ ...d, greenOccurrence: e.target.value }))}
                    className={`${inputClass} w-full`}
                    placeholder="mis. 2 atau 1, 2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">red_occurrence (opsional)</span>
                  <input
                    type="text"
                    autoComplete="off"
                    value={draft.redOccurrence}
                    onChange={(e) => setDraft((d) => ({ ...d, redOccurrence: e.target.value }))}
                    className={`${inputClass} w-full`}
                    placeholder="kosong = otomatis"
                  />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitForm}
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan…' : 'Simpan rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
