import { useState } from 'react';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useBibleReference } from '../hooks/useBibleReference';
import { useMarkAsRead } from '../hooks/useReadingProgress';
import { useDeleteSavedVerse, useSaveVerse, useSavedVerses } from '../hooks/useSavedVerses';
import { PostComposer } from '../components/PostComposer';

export function BiblePage() {
  const [referenceInput, setReferenceInput] = useState('');
  const [submittedReference, setSubmittedReference] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerVerseReference, setComposerVerseReference] = useState('');
  const [composerSource, setComposerSource] = useState<'daily' | 'search' | null>(null);
  const { data: searchedVerse, isLoading: isVerseLoading, isError: isVerseError } = useBibleReference(submittedReference);
  const { data: dailyVerse } = useDailyVerse();
  const markAsRead = useMarkAsRead();
  const { data: savedVerses = [] } = useSavedVerses();
  const saveVerse = useSaveVerse();
  const deleteSavedVerse = useDeleteSavedVerse();

  const openComposerForVerse = (reference: string, source: 'daily' | 'search') => {
    setComposerVerseReference(reference);
    setComposerSource(source);
    setIsComposerOpen(true);
  };

  return (
    <div className="pb-24 md:pb-6">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 md:max-w-5xl">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Biblia</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-4 md:max-w-5xl md:px-4">
        {/* Versículo del día - banner estilo Inicio */}
        {dailyVerse ? (
          <section className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-800 p-4 text-white shadow-sm sm:p-5">
            <div className="mb-2 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100">
              Versículo del día
            </div>
            <p className="text-base font-semibold text-white sm:text-lg">{dailyVerse.reference}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-100 sm:text-[15px]">{dailyVerse.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary rounded-full px-4 py-2"
                onClick={() => openComposerForVerse(dailyVerse.reference, 'daily')}
              >
                Compartir
              </button>
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                onClick={() => saveVerse.mutate({ verse_reference: dailyVerse.reference })}
                disabled={saveVerse.isPending}
              >
                Guardar
              </button>
            </div>
          </section>
        ) : null}

        {/* Buscar - card estilo feed */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Buscar por referencia</h2>
          <form
            className="flex flex-col gap-2 sm:flex-row sm:gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedReference(referenceInput.trim());
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ej: Juan 3:16 o Romanos 8:28"
              value={referenceInput}
              onChange={(event) => setReferenceInput(event.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0 rounded-full px-4 py-2.5">
              Buscar
            </button>
          </form>
          {isVerseLoading ? <p className="mt-2 text-center text-sm text-slate-600">Cargando versículo...</p> : null}
          {isVerseError ? <p className="mt-2 text-center text-sm text-red-600">No fue posible consultar la API bíblica.</p> : null}
          {submittedReference && !isVerseLoading && !searchedVerse && !isVerseError ? (
            <p className="mt-2 text-center text-sm text-slate-600">No encontramos ese versículo. Intenta otra referencia.</p>
          ) : null}
        </section>

        {/* Resultado de búsqueda */}
        {searchedVerse ? (
          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">{searchedVerse.reference}</div>
            <p className="text-[15px] leading-relaxed text-slate-800">{searchedVerse.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="btn-primary rounded-full px-4 py-2"
                onClick={(event) => {
                  event.stopPropagation();
                  openComposerForVerse(searchedVerse.reference, 'search');
                }}
              >
                Compartir
              </button>
              <button
                className="btn-secondary rounded-full px-4 py-2"
                onClick={(event) => {
                  event.stopPropagation();
                  markAsRead.mutate({
                    verse_reference: searchedVerse.reference,
                    completed: true,
                    date: new Date().toISOString(),
                  });
                }}
              >
                Marcar leído
              </button>
              <button
                type="button"
                className="btn-ghost rounded-full px-4 py-2 text-sm text-slate-600"
                onClick={(event) => {
                  event.stopPropagation();
                  saveVerse.mutate({ verse_reference: searchedVerse.reference });
                }}
                disabled={saveVerse.isPending}
              >
                Guardar
              </button>
            </div>
          </section>
        ) : null}

        {/* Versículos guardados */}
        {savedVerses.length > 0 ? (
          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Tus versículos guardados</h2>
            <ul className="space-y-2">
              {savedVerses.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm transition hover:bg-slate-100"
                  onClick={() => {
                    setReferenceInput(v.verse_reference);
                    setSubmittedReference(v.verse_reference);
                  }}
                >
                  <span className="min-w-0 truncate font-medium text-slate-800">{v.verse_reference}</span>
                  <button
                    type="button"
                    className="btn-ghost shrink-0 rounded-full p-2 text-slate-400 hover:text-red-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteSavedVerse.mutate(v.id);
                    }}
                    aria-label="Eliminar"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {isComposerOpen && composerVerseReference ? (
          <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Compartir versículo</h2>
                <button
                  type="button"
                  className="btn-ghost px-2"
                  onClick={() => setIsComposerOpen(false)}
                >
                  Cerrar
                </button>
              </div>
              {composerSource === 'daily' ? (
                <div className="mb-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Versículo del día: {composerVerseReference}
                </div>
              ) : (
                <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Versículo: {composerVerseReference}
                </div>
              )}
              <PostComposer
                fixedVerseReference={composerVerseReference}
                hideVerseReference
                initialVisibility="church"
                fixedPostType="reflection"
                hideMediaUrl
                submitLabel="Compartir"
                onSuccess={() => setIsComposerOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
