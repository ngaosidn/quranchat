'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type RuleAyatForm = {
  id: string;
  surah: string;
  ayat: string;
  title: string;
  audio_url: string;
  image_url: string;
  video_url: string;
  explanation: string;
};

function newRowId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function jsonToRow(r: Record<string, unknown>): RuleAyatForm {
  return {
    id: newRowId(),
    surah: String(r.surah ?? ''),
    ayat: String(r.ayat ?? ''),
    title: String(r.title ?? ''),
    audio_url: String(r.audio_url ?? ''),
    image_url: String(r.image_url ?? ''),
    video_url: String(r.video_url ?? ''),
    explanation: String(r.explanation ?? ''),
  };
}

function rowToJson(row: RuleAyatForm): Record<string, unknown> {
  const out: Record<string, unknown> = {
    surah: Number(row.surah),
    ayat: Number(row.ayat),
  };
  if (row.title.trim()) out.title = row.title.trim();
  if (row.audio_url.trim()) out.audio_url = row.audio_url.trim();
  if (row.image_url.trim()) out.image_url = row.image_url.trim();
  if (row.video_url.trim()) out.video_url = row.video_url.trim();
  if (row.explanation.trim()) out.explanation = row.explanation.trim();
  return out;
}

const emptyRow = (): RuleAyatForm => ({
  id: newRowId(),
  surah: '',
  ayat: '',
  title: '',
  audio_url: '',
  image_url: '',
  video_url: '',
  explanation: '',
});

function sortRows(list: RuleAyatForm[]): RuleAyatForm[] {
  return [...list].sort((a, b) => {
    const sa = Number(a.surah) || 0;
    const sb = Number(b.surah) || 0;
    if (sa !== sb) return sa - sb;
    return (Number(a.ayat) || 0) - (Number(b.ayat) || 0);
  });
}

function excerpt(text: string, max = 42): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '—';
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const inputClass =
  'mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

export default function RuleAyatEditorForm() {
  const router = useRouter();
  const [rows, setRows] = useState<RuleAyatForm[]>([]);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RuleAyatForm>(() => emptyRow());

  const load = useCallback(async () => {
    loadAbortRef.current?.abort();
    const ac = new AbortController();
    loadAbortRef.current = ac;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/data/rule-ayat.json', { cache: 'no-store', signal: ac.signal });
      const data = await res.json();
      if (ac.signal.aborted) return;
      const rules = Array.isArray(data.rules) ? data.rules : [];
      setRows(rules.map((r: Record<string, unknown>) => jsonToRow(r)));
    } catch {
      if (ac.signal.aborted) return;
      setRows([]);
      setMessage({ type: 'err', text: 'Gagal memuat rule-ayat.json' });
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persistRules = useCallback(
    async (list: RuleAyatForm[], successMsg = 'Tersimpan ke public/data/rule-ayat.json.') => {
      for (const row of list) {
        if (!row.surah.trim() || !row.ayat.trim()) {
          setMessage({ type: 'err', text: 'Setiap rule wajib isi surah dan ayat.' });
          return false;
        }
      }
      const payload = sortRows(list).map((r) => rowToJson(r));
      setSaving(true);
      setMessage(null);
      try {
        const res = await fetch('/api/admin/rule-ayat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: payload }),
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

  function openEdit(row: RuleAyatForm) {
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
    let next: RuleAyatForm[];
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
    if (!window.confirm('Hapus rule ini dari rule-ayat.json?')) return;
    const next = rows.filter((r) => r.id !== id);
    await persistRules(next, 'Rule dihapus.');
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  if (loading) return <div className="p-8 text-center text-slate-600">Memuat data…</div>;

  const sorted = sortRows(rows);

  return (
    <div className="relative z-10 mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Editor rule-ayat (Ahkam popup)</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola title/audio/image/video/explanation per surah-ayat.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/warna" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Editor warna
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
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Surah</th>
                <th className="px-3 py-2.5 font-semibold">Ayat</th>
                <th className="px-3 py-2.5 font-semibold">Title</th>
                <th className="px-3 py-2.5 font-semibold">Audio URL</th>
                <th className="px-3 py-2.5 font-semibold">Video URL</th>
                <th className="px-3 py-2.5 font-semibold">Explanation</th>
                <th className="px-3 py-2.5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    Belum ada rule. Klik <strong>Rule baru</strong> untuk menambah.
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{row.surah}</td>
                    <td className="px-3 py-2.5 text-slate-800">{row.ayat}</td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-slate-800" title={row.title}>{excerpt(row.title)}</td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-700" title={row.audio_url}>{excerpt(row.audio_url)}</td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-700" title={row.video_url}>{excerpt(row.video_url)}</td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-700" title={row.explanation}>{excerpt(row.explanation)}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button type="button" onClick={() => openEdit(row)} disabled={saving || panelOpen} className="mr-2 text-emerald-700 hover:underline disabled:opacity-40">Edit</button>
                      <button type="button" onClick={() => handleDelete(row.id)} disabled={saving} className="text-red-600 hover:underline disabled:opacity-40">Hapus</button>
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
          onClick={closePanel}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-800">{formMode === 'create' ? 'Rule baru' : 'Edit rule'}</h2>
              <button type="button" onClick={closePanel} className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">Tutup</button>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap gap-4">
                <label className="text-sm">
                  <span className="font-medium text-slate-700">Surah</span>
                  <input type="text" inputMode="numeric" autoComplete="off" value={draft.surah} onChange={(e) => setDraft((d) => ({ ...d, surah: e.target.value.replace(/\D/g, '') }))} className={`${inputClass} block w-28`} />
                </label>
                <label className="text-sm">
                  <span className="font-medium text-slate-700">Ayat</span>
                  <input type="text" inputMode="numeric" autoComplete="off" value={draft.ayat} onChange={(e) => setDraft((d) => ({ ...d, ayat: e.target.value.replace(/\D/g, '') }))} className={`${inputClass} block w-28`} />
                </label>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Title (opsional)</span>
                <input type="text" autoComplete="off" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className={`${inputClass} w-full`} placeholder="Ahkam Tajwid - Ayat X" />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Audio URL (opsional)</span>
                <input type="url" autoComplete="off" value={draft.audio_url} onChange={(e) => setDraft((d) => ({ ...d, audio_url: e.target.value }))} className={`${inputClass} w-full`} placeholder="https://..." />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Image URL (opsional)</span>
                <input type="url" autoComplete="off" value={draft.image_url} onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))} className={`${inputClass} w-full`} placeholder="https://..." />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Video URL YouTube (opsional)</span>
                <input type="url" autoComplete="off" value={draft.video_url} onChange={(e) => setDraft((d) => ({ ...d, video_url: e.target.value }))} className={`${inputClass} w-full`} placeholder="https://www.youtube.com/watch?v=..." />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Explanation (opsional)</span>
                <textarea value={draft.explanation} onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))} rows={5} className={`${inputClass} w-full`} />
              </label>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={closePanel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
                <button type="button" onClick={submitForm} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
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

