import { Link } from 'react-router-dom';
import { useMemo, useState, type FormEvent } from 'react';
import { useCreateCommunity, useMyCommunities, usePublicCommunities } from '../hooks/useCommunity';
import {
  useApproveCommunityRequest,
  useCommunityRequests,
  useRejectCommunityRequest,
  useSubmitCommunityRequest,
} from '../hooks/useCommunityRequests';
import { useAuth } from '../hooks/useAuth';
import { matchesSearch } from '../utils/search';
import type { Church } from '../types/models';

type ChurchWithCount = Church & { member_count: number };

function CommunityCard({ c, isMember }: { c: ChurchWithCount; isMember?: boolean }) {
  return (
    <Link
      to={`/community/${c.id}`}
      className="flex gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-lg font-semibold text-indigo-600">
        {c.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">{c.name}</h3>
        {c.description ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{c.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>{c.city}, {c.country}</span>
          <span>·</span>
          <span>{c.member_count} miembros</span>
          {isMember ? (
            <>
              <span>·</span>
              <span className="font-medium text-indigo-600">Miembro</span>
            </>
          ) : null}
        </div>
      </div>
      <span className="self-center text-slate-400">→</span>
    </Link>
  );
}

function RecommendedSidebar({
  communities,
  myIds,
  onCreateClick,
  showCreateButton = true,
}: {
  communities: ChurchWithCount[];
  myIds: Set<string>;
  onCreateClick: () => void;
  showCreateButton?: boolean;
}) {
  const recommended = useMemo(
    () =>
      communities
        .filter((c) => !myIds.has(c.id))
        .sort((a, b) => b.member_count - a.member_count)
        .slice(0, 8),
    [communities, myIds],
  );

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Comunidades recomendadas</h3>
        <p className="mt-1 text-xs text-slate-500">
          Por cercanía y actividad
        </p>
        <ul className="mt-3 space-y-2">
          {recommended.length === 0 ? (
            <li className="text-sm text-slate-500">No hay más comunidades por ahora.</li>
          ) : (
            recommended.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/community/${c.id}`}
                  className="flex items-center gap-2 rounded-lg py-2 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.member_count} miembros</span>
                  </div>
                  <span className="text-slate-400">→</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
      {showCreateButton ? (
        <button
          type="button"
          onClick={onCreateClick}
          className="w-full rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 py-3 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
        >
          + Crear o solicitar comunidad
        </button>
      ) : null}
    </aside>
  );
}

export function ChurchFeedPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const { user } = useAuth();
  const { data: myCommunities = [] } = useMyCommunities();
  const { data: publicCommunities = [] } = usePublicCommunities();
  const { data: requests = [] } = useCommunityRequests();
  const createCommunity = useCreateCommunity();
  const submitRequest = useSubmitCommunityRequest();
  const approveRequest = useApproveCommunityRequest();
  const rejectRequest = useRejectCommunityRequest();

  const canCreate = user?.is_platform_admin || user?.can_create_community;
  const myIds = useMemo(() => new Set(myCommunities.map((c) => c.id)), [myCommunities]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (canCreate) {
      await createCommunity.mutateAsync({ name, description, city, country, location });
    } else {
      await submitRequest.mutateAsync({ name, description, city, country, location });
    }
    setName('');
    setDescription('');
    setCity('');
    setCountry('');
    setLocation('');
    setShowCreate(false);
  };

  const searchTrimmed = search.trim();
  const communitiesToShow = useMemo(() => {
    const filtered = publicCommunities
      .filter((c) => !myIds.has(c.id))
      .sort((a, b) => b.member_count - a.member_count);
    if (!searchTrimmed) return filtered;
    return filtered.filter(
      (c) =>
        matchesSearch(c.name, searchTrimmed) ||
        matchesSearch(c.city, searchTrimmed) ||
        matchesSearch(c.country, searchTrimmed) ||
        matchesSearch(c.description, searchTrimmed),
    );
  }, [publicCommunities, myIds, searchTrimmed]);

  const isSearching = searchTrimmed.length > 0;

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pb-24 md:pb-6">
      {/* Header estilo red social - sticky */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <h1 className="mb-3 text-xl font-bold text-slate-900 md:text-2xl">
            Comunidades
          </h1>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar comunidades por nombre, ciudad o país..."
                className="w-full rounded-full border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                  aria-label="Limpiar búsqueda"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
            {/* Botón al costado del buscador en mobile/tablet; en desktop va en sidebar */}
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="shrink-0 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-3 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 lg:hidden"
            >
              + Crear
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-4 lg:grid lg:max-w-5xl lg:grid-cols-[1fr_280px] lg:gap-6">
        {/* Contenido principal */}
        <main className="space-y-4">
          {/* Mis comunidades - pill rápido */}
          {myCommunities.length > 0 ? (
            <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Mis comunidades</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {myCommunities.map((c) => (
                  <Link
                    key={c.id}
                    to={`/community/${c.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-800 transition hover:bg-indigo-200"
                  >
                    {c.name}
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* Resultados de búsqueda o explorar */}
          <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            {isSearching ? (
              <>
                <h2 className="text-sm font-semibold text-slate-900">
                  Resultados de búsqueda
                  <span className="ml-2 font-normal text-slate-500">
                    ({communitiesToShow.length} {communitiesToShow.length === 1 ? 'comunidad' : 'comunidades'})
                  </span>
                </h2>
                {communitiesToShow.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No encontramos comunidades con &quot;{search}&quot;. Prueba con otro término o explora las recomendadas.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {communitiesToShow.map((c) => (
                      <li key={c.id}>
                        <CommunityCard c={c} />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-slate-900">Explorar comunidades</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Busca por nombre, ciudad o país, o revisa las recomendadas a la derecha.
                </p>
                {communitiesToShow.length > 0 ? (
                  <ul className="mt-3 space-y-3">
                    {communitiesToShow.slice(0, 6).map((c) => (
                      <li key={c.id}>
                        <CommunityCard c={c} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Usa el buscador de arriba para encontrar comunidades.
                  </p>
                )}
              </>
            )}
          </section>

          {/* Recomendadas en mobile (en desktop van al sidebar) */}
          <section className="lg:hidden">
            <RecommendedSidebar
              communities={publicCommunities}
              myIds={myIds}
              onCreateClick={() => setShowCreate(true)}
              showCreateButton={false}
            />
          </section>

          {/* Formulario crear/solicitar comunidad */}
          {showCreate ? (
            <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">
                {canCreate ? 'Nueva comunidad' : 'Solicitar nueva comunidad'}
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Completa los datos. Un administrador revisará la información.
              </p>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Iglesia Esperanza Viva"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Ciudad</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Buenos Aires"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">País</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Ej: Argentina"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Dirección (opcional)</label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Barrio, calle o referencia"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Descripción (opcional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enfoque de la comunidad (jóvenes, familias, misiones...)"
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={createCommunity.isPending || submitRequest.isPending}
                  >
                    {canCreate ? 'Crear comunidad' : 'Enviar solicitud'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {/* Admin: solicitudes pendientes */}
          {user?.is_platform_admin && requests.filter((r) => r.status === 'pending').length > 0 ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <h2 className="mb-3 text-sm font-semibold text-amber-900">Solicitudes pendientes</h2>
              <ul className="space-y-3">
                {requests
                  .filter((r) => r.status === 'pending')
                  .map((r) => (
                    <li key={r.id} className="rounded-lg border border-amber-200 bg-white p-3">
                      <div className="font-medium text-slate-900">{r.name}</div>
                      {r.description ? <p className="text-sm text-slate-600">{r.description}</p> : null}
                      <div className="text-sm text-slate-600">{r.city}, {r.country}</div>
                      <div className="mt-2 flex gap-2">
                        <button
                          className="btn-success px-3 py-1 text-sm"
                          onClick={() => approveRequest.mutate(r.id)}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn-danger px-3 py-1 text-sm"
                          onClick={() => rejectRequest.mutate(r.id)}
                        >
                          Rechazar
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </main>

        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <RecommendedSidebar
              communities={publicCommunities}
              myIds={myIds}
              onCreateClick={() => setShowCreate(true)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
