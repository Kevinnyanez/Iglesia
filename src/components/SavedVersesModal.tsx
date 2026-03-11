import { useState, type FormEvent } from 'react';
import { useBibleReference } from '../hooks/useBibleReference';
import { useDeleteSavedVerse, useSaveVerse, useSavedVerses } from '../hooks/useSavedVerses';

export function SavedVersesModal({ onClose }: { onClose: () => void }) {
  const [verseRef, setVerseRef] = useState('');
  const [note, setNote] = useState('');
  const { data: verses = [] } = useSavedVerses();
  const saveVerse = useSaveVerse();
  const deleteVerse = useDeleteSavedVerse();

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const ref = verseRef.trim();
    if (!ref) return;
    await saveVerse.mutateAsync({ verse_reference: ref, note: note.trim() || undefined });
    setVerseRef('');
    setNote('');
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-4 md:mx-auto md:max-h-[90vh] md:max-w-xl md:rounded-2xl md:shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Versículos guardados</h2>
          <button type="button" className="btn-ghost rounded-full p-2" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSave} className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">Agregar versículo</label>
            <input
              type="text"
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              placeholder="Ej: Juan 3:16, Salmos 23:1"
              className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional"
              className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button type="submit" className="btn-primary w-full" disabled={!verseRef.trim() || saveVerse.isPending}>
              Guardar versículo
            </button>
          </form>
          {verses.length === 0 ? (
            <p className="text-center text-sm text-slate-500">Aún no guardaste ningún versículo.</p>
          ) : (
            <ul className="space-y-3">
              {verses.map((v) => (
                <SavedVerseItem key={v.id} verse={v} onDelete={() => void deleteVerse.mutateAsync(v.id)} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function SavedVerseItem({
  verse,
  onDelete,
}: {
  verse: { id: string; verse_reference: string; note: string | null };
  onDelete: () => void;
}) {
  const { data } = useBibleReference(verse.verse_reference);
  return (
    <li className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{verse.verse_reference}</p>
        {data?.text ? <p className="mt-1 text-sm text-slate-600 line-clamp-2">{data.text}</p> : null}
        {verse.note ? <p className="mt-1 text-xs text-slate-500 italic">{verse.note}</p> : null}
      </div>
      <button
        type="button"
        className="btn-ghost shrink-0 rounded-full p-2 text-slate-400 hover:text-red-600"
        onClick={onDelete}
        aria-label="Eliminar"
      >
        🗑
      </button>
    </li>
  );
}

