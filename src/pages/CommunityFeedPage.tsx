import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { ImageUpload } from '../components/ImageUpload';
import { uploadCommunityAvatar, uploadCommunityBanner } from '../services/storage.service';
import {
  useCommunityById,
  useCommunityMembers,
  useCommunityMeetings,
  useCommunityEvents,
  useCreateCommunityMeeting,
  useDeleteCommunityMeeting,
  useCreateCommunityEvent,
  useDeleteCommunityEvent,
  useJoinCommunity,
  useLeaveCommunity,
  useMyCommunities,
  useMyJoinRequestStatus,
  useJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useUpdateCommunity,
} from '../hooks/useCommunity';
import type { MeetingSlot } from '../types/models';
import { InfiniteScrollTrigger } from '../components/InfiniteScrollTrigger';
import { PostComposer } from '../components/PostComposer';
import { PostList } from '../components/PostList';
import { useCommunityFeed, useRealtimePosts } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';

export function CommunityFeedPage() {
  useRealtimePosts();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const { data: community } = useCommunityById(id);
  const { data: members = [] } = useCommunityMembers(id);
  const { data: meetings = [] } = useCommunityMeetings(id);
  const { data: events = [] } = useCommunityEvents(id);
  const { data: myCommunities = [] } = useMyCommunities();
  const { data: joinRequestStatus } = useMyJoinRequestStatus(id);
  const { data: joinRequests = [] } = useJoinRequests(id);
  const { user } = useAuth();

  const joinCommunity = useJoinCommunity();
  const leaveCommunity = useLeaveCommunity();
  const approveJoin = useApproveJoinRequest();
  const rejectJoin = useRejectJoinRequest(id);

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useCommunityFeed(id);
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  const isMember = Boolean(id && myCommunities.some((c) => c.id === id));
  const isAdmin = Boolean(user && id && members.some((m) => m.user_id === user.id && m.role === 'admin'));

  if (!id) return <p className="p-4 text-slate-700">Comunidad inválida.</p>;

  return (
    <div className="pb-24 md:pb-6">
      <CommunityHeader
        community={community}
        membersCount={members.length}
        isAdmin={isAdmin}
        onEdit={() => setIsEditOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {isEditOpen && id && isAdmin ? (
        <EditCommunityModal
          community={community}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => setIsEditOpen(false)}
        />
      ) : null}

      {isProfileOpen ? (
        <CommunityProfileModal
          community={community}
          members={members}
          isMember={isMember}
          joinRequestStatus={joinRequestStatus}
          isAdmin={isAdmin}
          joinRequests={joinRequests}
          meetings={meetings}
          events={events}
          onJoin={() => joinCommunity.mutate(id)}
          onLeave={() => leaveCommunity.mutate(id)}
          onApproveJoin={(reqId) => approveJoin.mutate(reqId)}
          onRejectJoin={(reqId) => rejectJoin.mutate(reqId)}
          onManageMeetings={() => setIsMeetingsModalOpen(true)}
          onClose={() => setIsProfileOpen(false)}
        />
      ) : null}

      <div className="mt-4 space-y-4 px-4">
      {isMember ? (
        <>
          <section>
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Compartir en esta comunidad...
            </button>
          </section>

          <ActivitiesSection
            meetings={meetings}
            events={events}
            isAdmin={isAdmin}
            onManageClick={() => setIsMeetingsModalOpen(true)}
          />
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-800">Únete a la comunidad para ver publicaciones y metas.</p>
          {joinRequestStatus === 'pending' ? (
            <p className="mt-3 text-sm font-medium text-amber-700">Solicitud enviada. Espera a que el admin te apruebe.</p>
          ) : (
            <button
              className="btn-primary mt-3"
              onClick={() => joinCommunity.mutate(id)}
              disabled={joinCommunity.isPending}
            >
              {community?.is_private ? 'Solicitar unirme' : 'Unirme a la comunidad'}
            </button>
          )}
        </div>
      )}

      {isMember ? (
        <>
          {isLoading ? <p className="text-slate-600">Cargando...</p> : null}
          <PostList posts={posts} />
          <InfiniteScrollTrigger
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
          />
        </>
      ) : null}
      </div>

      {isComposerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 md:items-center md:justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Publicar en comunidad</h2>
              <button type="button" className="btn-ghost px-2" onClick={() => setIsComposerOpen(false)}>
                Cerrar
              </button>
            </div>
            <PostComposer
              fixedVisibility="church"
              fixedPostType="reflection"
              initialCommunityId={id}
              hideMediaUrl
              submitLabel="Publicar"
              onSuccess={() => setIsComposerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {isMeetingsModalOpen && id ? (
        <CommunityActivitiesModal
          communityId={id}
          communityName={community?.name}
          meetings={meetings}
          events={events}
          isAdmin={isAdmin}
          onClose={() => setIsMeetingsModalOpen(false)}
        />
      ) : null}
    </div>
  );
}

function CommunityHeader({
  community,
  membersCount,
  isAdmin,
  onEdit,
  onOpenProfile,
}: {
  community: { id: string; name: string; description?: string | null; city: string; country: string; location?: string | null; avatar_url?: string | null; banner_url?: string | null } | null | undefined;
  membersCount: number;
  isAdmin: boolean;
  onEdit: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-b-2xl border-b border-slate-200/80 bg-white shadow-sm">
      <div
        className="relative h-28 bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-700 sm:h-32 md:h-40"
        style={community?.banner_url ? { backgroundImage: `url(${community.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {!community?.banner_url ? (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/90 via-indigo-500/90 to-indigo-700/90" />
        ) : null}
      </div>
      <div className="relative px-4 pb-4 pt-2 sm:px-4 sm:pb-4">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-3 sm:-mt-12 md:flex-nowrap">
          <div className="flex min-w-0 flex-1 items-end gap-3">
            <div
              className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-4 border-white bg-indigo-100 shadow-lg sm:h-20 sm:w-20 sm:rounded-2xl"
              style={community?.avatar_url ? { backgroundImage: `url(${community.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!community?.avatar_url ? (
                <div className="flex h-full w-full items-center justify-center text-2xl text-indigo-400 sm:text-3xl">
                  {community?.name?.charAt(0) ?? '?'}
                </div>
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-0.5">
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{community?.name ?? 'Comunidad'}</h1>
              <p className="text-xs text-slate-600 sm:text-sm">{membersCount} miembros</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 pb-0.5">
            {isAdmin ? (
              <button
                type="button"
                className="btn-secondary rounded-full px-3 py-1.5 text-xs sm:text-sm"
                onClick={onEdit}
              >
                Editar
              </button>
            ) : null}
            <button
              type="button"
              className="btn-ghost rounded-full px-3 py-1.5 text-xs sm:text-sm"
              onClick={onOpenProfile}
            >
              Info
            </button>
          </div>
        </div>
        {community?.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{community.description}</p>
        ) : null}
        <div className="mt-1 text-xs text-slate-500">
          {community?.city}, {community?.country}
          {community?.location ? ` · ${community.location}` : ''}
        </div>
      </div>
    </div>
  );
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

function formatEventDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function ActivitiesSection({
  meetings,
  events,
  isAdmin,
  onManageClick,
}: {
  meetings: { id: string; title: string; schedule?: string; type: string; slots: MeetingSlot[] }[];
  events: { id: string; title: string; event_date: string; event_time: string | null; place: string | null; description: string | null }[];
  isAdmin: boolean;
  onManageClick: () => void;
}) {
  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const meetingsList = meetings.filter((m) => !m.type || m.type === 'meeting');
  const prayersList = meetings.filter((m) => m.type === 'prayer');

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Reuniones, oraciones y eventos</h2>
        {isAdmin ? (
          <button
            type="button"
            onClick={onManageClick}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Gestionar
          </button>
        ) : null}
      </div>

      {meetingsList.length > 0 ? (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reuniones</h3>
          <ul className="space-y-2">
            {meetingsList.map((m) => (
              <MeetingOrPrayerCard
                key={m.id}
                item={m}
                label="Reunión"
                expandedId={expandedMeetingId}
                onToggle={() => setExpandedMeetingId(expandedMeetingId === m.id ? null : m.id)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {prayersList.length > 0 ? (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Oraciones</h3>
          <ul className="space-y-2">
            {prayersList.map((m) => (
              <MeetingOrPrayerCard
                key={m.id}
                item={m}
                label="Oración"
                expandedId={expandedMeetingId}
                onToggle={() => setExpandedMeetingId(expandedMeetingId === m.id ? null : m.id)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {events.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Eventos</h3>
          <ul className="space-y-2">
            {events.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                expanded={expandedEventId === e.id}
                onToggle={() => setExpandedEventId(expandedEventId === e.id ? null : e.id)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {meetings.length === 0 && events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 px-4 py-6 text-center text-sm text-slate-500">
          {isAdmin ? 'Aún no hay actividades. Haz clic en "Gestionar" para agregar.' : 'No hay reuniones, oraciones ni eventos.'}
        </p>
      ) : null}
    </section>
  );
}

function MeetingOrPrayerCard({
  item,
  label,
  expandedId,
  onToggle,
}: {
  item: { id: string; title: string; schedule?: string; slots: MeetingSlot[] };
  label: string;
  expandedId: string | null;
  onToggle: () => void;
}) {
  const scheduleStr = item.schedule ?? (item.slots?.length ? item.slots.map((s) => `${s.days.join(', ')} ${s.time}`).join(' · ') : '');
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{item.title}</p>
          <p className="text-sm text-slate-600">{scheduleStr}</p>
        </div>
        <span className={`shrink-0 text-slate-400 transition ${expandedId === item.id ? 'rotate-180' : ''}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {expandedId === item.id ? (
        <div className="mt-1 rounded-b-xl border border-t-0 border-slate-200/80 bg-slate-50/50 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">{item.title}</p>
          {item.slots?.length ? (
            <ul className="mt-2 space-y-1">
              {item.slots.map((s, i) => (
                <li key={i} className="text-sm text-slate-600">
                  {s.days.join(', ')} {s.time}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-600">{scheduleStr}</p>
          )}
        </div>
      ) : null}
    </li>
  );
}

function EventCard({
  event,
  expanded,
  onToggle,
}: {
  event: { id: string; title: string; event_date: string; event_time: string | null; place: string | null; description: string | null };
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">{event.title}</p>
          <p className="text-sm text-slate-600">{formatEventDate(event.event_date)}{event.event_time ? ` · ${event.event_time}` : ''}</p>
        </div>
        <span className={`shrink-0 text-slate-400 transition ${expanded ? 'rotate-180' : ''}`}>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {expanded ? (
        <div className="mt-1 rounded-b-xl border border-t-0 border-slate-200/80 bg-slate-50/50 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">{event.title}</p>
          <p className="mt-1 text-sm text-slate-600">{formatEventDate(event.event_date)}{event.event_time ? ` · ${event.event_time}` : ''}</p>
          {event.place ? <p className="mt-1 text-sm text-slate-600"><span className="font-medium">Lugar:</span> {event.place}</p> : null}
          {event.description ? <p className="mt-2 text-sm text-slate-600">{event.description}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

function EditCommunityModal({
  community,
  onClose,
  onSuccess,
}: {
  community: { id: string; name: string; description?: string | null; city: string; country: string; location?: string | null; avatar_url?: string | null; banner_url?: string | null } | null | undefined;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(community?.name ?? '');
  const [description, setDescription] = useState(community?.description ?? '');
  const [city, setCity] = useState(community?.city ?? '');
  const [country, setCountry] = useState(community?.country ?? '');
  const [location, setLocation] = useState(community?.location ?? '');
  const [avatarUrl, setAvatarUrl] = useState(community?.avatar_url ?? '');
  const [bannerUrl, setBannerUrl] = useState(community?.banner_url ?? '');
  const updateCommunity = useUpdateCommunity(community?.id);

  useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description ?? '');
      setCity(community.city);
      setCountry(community.country);
      setLocation(community.location ?? '');
      setAvatarUrl(community.avatar_url ?? '');
      setBannerUrl(community.banner_url ?? '');
    }
  }, [community]);

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (!community?.id) return;
      const url = await uploadCommunityAvatar(community.id, file);
      setAvatarUrl(url);
      await updateCommunity.mutateAsync({
        avatar_url: url,
      });
    },
    [community?.id, updateCommunity],
  );

  const handleBannerUpload = useCallback(
    async (file: File) => {
      if (!community?.id) return;
      const url = await uploadCommunityBanner(community.id, file);
      setBannerUrl(url);
      await updateCommunity.mutateAsync({
        banner_url: url,
      });
    },
    [community?.id, updateCommunity],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!community?.id) return;
    await updateCommunity.mutateAsync({
      name,
      description: description || undefined,
      city,
      country,
      location: location || undefined,
      avatar_url: avatarUrl || null,
      banner_url: bannerUrl || null,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 md:items-center md:justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Editar comunidad</h2>
          <button type="button" className="btn-ghost rounded-full p-2" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <ImageUpload
              currentUrl={avatarUrl}
              onFileSelect={handleAvatarUpload}
              label="Foto de perfil"
              aspect="square"
            />
            <ImageUpload
              currentUrl={bannerUrl}
              onFileSelect={handleBannerUpload}
              label="Portada / banner"
              aspect="banner"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Breve descripción de la comunidad" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Ciudad</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">País</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Ubicación / Dirección</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Opcional" className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={updateCommunity.isPending}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommunityProfileModal({
  community,
  members,
  isMember,
  joinRequestStatus,
  isAdmin,
  joinRequests,
  meetings,
  events = [],
  onJoin,
  onLeave,
  onApproveJoin,
  onRejectJoin,
  onManageMeetings,
  onClose,
}: {
  community: { id: string; name: string; description?: string | null; city: string; country: string; location?: string | null; is_private?: boolean; avatar_url?: string | null; banner_url?: string | null } | null | undefined;
  members: { id: string; user_id: string; role: string; user?: { name: string; avatar: string | null } }[];
  isMember: boolean;
  joinRequestStatus?: 'member' | 'pending' | 'none';
  isAdmin: boolean;
  joinRequests: { id: string; user?: { name: string } }[];
  meetings: { id: string; title: string; schedule?: string; type: string; slots: MeetingSlot[] }[];
  events?: { id: string; title: string; event_date: string; event_time: string | null; place: string | null; description: string | null }[];
  onJoin: () => void;
  onLeave: () => void;
  onApproveJoin: (id: string) => void;
  onRejectJoin: (id: string) => void;
  onManageMeetings: () => void;
  onClose: () => void;
}) {
  const meetingsList = meetings?.filter((m) => !m.type || m.type === 'meeting') ?? meetings ?? [];
  const prayersList = meetings?.filter((m) => m.type === 'prayer') ?? [];
  const eventsList = events ?? [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-4 md:mx-auto md:max-h-[90vh] md:max-w-xl md:rounded-2xl md:shadow-xl">
      {/* Header estilo LinkedIn - mobile-first */}
      <div className="relative shrink-0">
        <div
          className="h-20 bg-slate-200 sm:h-24 md:h-28"
          style={community?.banner_url ? { backgroundImage: `url(${community.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!community?.banner_url ? (
            <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300" />
          ) : null}
        </div>
        <div className="absolute -bottom-8 left-4 sm:-bottom-10">
          <div
            className="h-16 w-16 overflow-hidden rounded-xl border-4 border-white bg-slate-100 shadow-md sm:h-20 sm:w-20"
            style={community?.avatar_url ? { backgroundImage: `url(${community.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {!community?.avatar_url ? (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-400 sm:text-2xl">
                {community?.name?.charAt(0) ?? '?'}
              </div>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-600 shadow-sm hover:bg-white"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-12 pb-6 sm:pt-14">
        <h1 className="text-xl font-bold text-slate-900">{community?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {community?.city}, {community?.country}
          {community?.location ? ` · ${community.location}` : ''}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-600">{members.length} miembros</p>

        {community?.description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{community.description}</p>
        ) : null}

        {/* Acción principal */}
        <div className="mt-4">
          {isMember ? (
            <button type="button" className="btn-secondary w-full rounded-full" onClick={onLeave}>
              Salir de la comunidad
            </button>
          ) : joinRequestStatus === 'pending' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-center text-sm font-medium text-amber-800">
              Solicitud enviada. Espera a que el admin te apruebe.
            </div>
          ) : (
            <button type="button" className="btn-primary w-full rounded-full" onClick={onJoin}>
              {community?.is_private ? 'Solicitar unirme' : 'Unirme a la comunidad'}
            </button>
          )}
        </div>

        {/* Reuniones, oraciones, eventos */}
        {(meetingsList.length > 0 || prayersList.length > 0 || eventsList.length > 0) ? (
          <div className="mt-6 space-y-4">
            {meetingsList.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Reuniones</h3>
                <ul className="mt-2 space-y-2">
                  {meetingsList.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{m.title}</p>
                        <p className="text-sm text-slate-600">{m.schedule ?? (m.slots?.map((s) => `${s.days.join(', ')} ${s.time}`).join(' · '))}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {prayersList.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Oraciones</h3>
                <ul className="mt-2 space-y-2">
                  {prayersList.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{m.title}</p>
                        <p className="text-sm text-slate-600">{m.schedule ?? (m.slots?.map((s) => `${s.days.join(', ')} ${s.time}`).join(' · '))}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {eventsList.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Eventos</h3>
                <ul className="mt-2 space-y-2">
                  {eventsList.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{e.title}</p>
                        <p className="text-sm text-slate-600">{formatEventDate(e.event_date)}{e.event_time ? ` · ${e.event_time}` : ''}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Miembros */}
        {members.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Miembros</h3>
            <ul className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {m.user?.avatar ? (
                      <img src={m.user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">
                        {m.user?.name?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{m.user?.name ?? 'Usuario'}</span>
                  {m.role === 'admin' ? (
                    <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Admin</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Solicitudes pendientes (admin) */}
        {isAdmin && joinRequests.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">Solicitudes pendientes</h3>
            <ul className="mt-2 space-y-2">
              {joinRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{r.user?.name ?? 'Usuario'}</span>
                  <div className="flex gap-2">
                    <button className="btn-success rounded-full px-3 py-1.5 text-xs" onClick={() => onApproveJoin(r.id)}>
                      Aprobar
                    </button>
                    <button className="btn-danger rounded-full px-3 py-1.5 text-xs" onClick={() => onRejectJoin(r.id)}>
                      Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {isAdmin ? (
          <button type="button" className="btn-primary mt-4 w-full rounded-full" onClick={onManageMeetings}>
            Gestionar actividades
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CommunityActivitiesModal({
  communityId,
  meetings,
  events,
  isAdmin,
  onClose,
}: {
  communityId: string;
  communityName?: string;
  meetings: { id: string; title: string; schedule?: string; type: string; slots: MeetingSlot[] }[];
  events: { id: string; title: string; event_date: string; event_time: string | null; place: string | null; description: string | null }[];
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'meeting' | 'prayer' | 'event'>('meeting');
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-4 md:mx-auto md:max-h-[90vh] md:max-w-xl md:rounded-2xl md:shadow-xl">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">Actividades</h2>
        <button type="button" className="btn-ghost rounded-full p-2" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="flex shrink-0 border-b border-slate-200/80 p-2">
        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
          {(['meeting', 'prayer', 'event'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'meeting' ? 'Reuniones' : t === 'prayer' ? 'Oraciones' : 'Eventos'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'meeting' && (
          <MeetingPrayerTab
            communityId={communityId}
            type="meeting"
            items={meetings.filter((m) => m.type === 'meeting')}
            isAdmin={isAdmin}
          />
        )}
        {tab === 'prayer' && (
          <MeetingPrayerTab
            communityId={communityId}
            type="prayer"
            items={meetings.filter((m) => m.type === 'prayer')}
            isAdmin={isAdmin}
          />
        )}
        {tab === 'event' && (
          <EventsTab communityId={communityId} events={events} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}

function MeetingPrayerTab({
  communityId,
  type,
  items,
  isAdmin,
}: {
  communityId: string;
  type: 'meeting' | 'prayer';
  items: { id: string; title: string; schedule?: string; slots: MeetingSlot[] }[];
  isAdmin: boolean;
}) {
  const [title, setTitle] = useState('');
  const [slots, setSlots] = useState<MeetingSlot[]>([{ days: [], time: '10:00' }]);
  const createMeeting = useCreateCommunityMeeting();
  const deleteMeeting = useDeleteCommunityMeeting();

  const addSlot = () => setSlots((s) => [...s, { days: [], time: '10:00' }]);
  const removeSlot = (i: number) => setSlots((s) => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, upd: Partial<MeetingSlot>) =>
    setSlots((s) => s.map((slot, idx) => (idx === i ? { ...slot, ...upd } : slot)));
  const toggleDay = (slotIdx: number, day: string) =>
    setSlots((s) =>
      s.map((slot, i) =>
        i === slotIdx
          ? {
              ...slot,
              days: slot.days.includes(day)
                ? slot.days.filter((d) => d !== day)
                : [...slot.days, day],
            }
          : slot
      )
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validSlots = slots.filter((s) => s.days.length > 0 && s.time);
    if (!title.trim() || validSlots.length === 0) return;
    await createMeeting.mutateAsync({
      community_id: communityId,
      title: title.trim(),
      type,
      slots: validSlots,
    });
    setTitle('');
    setSlots([{ days: [], time: '10:00' }]);
  };

  const label = type === 'meeting' ? 'reunión' : 'oración';

  return (
    <>
      {isAdmin ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-200/80 bg-slate-50/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Agregar {label}</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'meeting' ? 'Ej: Culto general' : 'Ej: Oración matutina'}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">Días y horarios</label>
                <button type="button" onClick={addSlot} className="text-xs font-medium text-indigo-600">
                  + Agregar horario
                </button>
              </div>
              {slots.map((slot, i) => (
                <div key={i} className="mb-3 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex flex-wrap gap-1">
                    {DAYS.map((d) => (
                      <label key={d} className="flex cursor-pointer items-center gap-1">
                        <input
                          type="checkbox"
                          checked={slot.days.includes(d)}
                          onChange={() => toggleDay(i, d)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-xs">{d.slice(0, 2)}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={slot.time}
                      onChange={(e) => updateSlot(i, { time: e.target.value })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    {slots.length > 1 && (
                      <button type="button" onClick={() => removeSlot(i)} className="text-slate-400 hover:text-red-600">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="submit" className="btn-primary w-full rounded-full py-2.5" disabled={createMeeting.isPending}>
              Agregar {label}
            </button>
          </div>
        </form>
      ) : null}

      <h3 className="mb-2 text-sm font-semibold text-slate-900">
        {type === 'meeting' ? 'Reuniones' : 'Oraciones'} programadas
      </h3>
      {items.length === 0 ? (
        <p className="rounded-xl border border-slate-200/80 bg-slate-50/30 px-4 py-6 text-center text-sm text-slate-500">
          No hay {type === 'meeting' ? 'reuniones' : 'oraciones'}.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{m.title}</p>
                <p className="text-sm text-slate-600">
                  {m.schedule ?? (m.slots?.map((s) => `${s.days.join(', ')} ${s.time}`).join(' · '))}
                </p>
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => deleteMeeting.mutate({ meetingId: m.id, communityId })}
                  aria-label="Eliminar"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function EventsTab({
  communityId,
  events,
  isAdmin,
}: {
  communityId: string;
  events: { id: string; title: string; event_date: string; event_time: string | null; place: string | null; description: string | null }[];
  isAdmin: boolean;
}) {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const createEvent = useCreateCommunityEvent();
  const deleteEvent = useDeleteCommunityEvent();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    await createEvent.mutateAsync({
      community_id: communityId,
      title: title.trim(),
      event_date: eventDate,
      event_time: eventTime || null,
      place: place || null,
      description: description || null,
    });
    setTitle('');
    setEventDate('');
    setEventTime('');
    setPlace('');
    setDescription('');
  };

  return (
    <>
      {isAdmin ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-200/80 bg-slate-50/30 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Agregar evento</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Santa Cena, Retiro de jóvenes"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Hora</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Lugar</label>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Ej: Salón principal"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles del evento..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <button type="submit" className="btn-primary w-full rounded-full py-2.5" disabled={createEvent.isPending}>
              Agregar evento
            </button>
          </div>
        </form>
      ) : null}

      <h3 className="mb-2 text-sm font-semibold text-slate-900">Eventos</h3>
      {events.length === 0 ? (
        <p className="rounded-xl border border-slate-200/80 bg-slate-50/30 px-4 py-6 text-center text-sm text-slate-500">
          No hay eventos programados.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{e.title}</p>
                <p className="text-sm text-slate-600">
                  {formatEventDate(e.event_date)}
                  {e.event_time ? ` · ${e.event_time}` : ''}
                  {e.place ? ` · ${e.place}` : ''}
                </p>
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => deleteEvent.mutate({ eventId: e.id, communityId })}
                  aria-label="Eliminar"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
