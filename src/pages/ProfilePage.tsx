import { Link } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ImageUpload } from '../components/ImageUpload';
import { uploadUserAvatar } from '../services/storage.service';
import { updateUserAvatar } from '../services/user.service';
import { useCurrentUserChurch } from '../hooks/useChurch';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { useUserStreak } from '../hooks/useUserStreak';
import {
  useApproveCommunityRequest,
  useCommunityRequests,
  useRejectCommunityRequest,
} from '../hooks/useCommunityRequests';
import { SavedVersesModal } from '../components/SavedVersesModal';

export function ProfilePage() {
  const { user } = useAuth();
  const { data: church } = useCurrentUserChurch();
  const { data: progress = [] } = useReadingProgress();
  const { data: streak } = useUserStreak();
  const { data: requests = [] } = useCommunityRequests();
  const approveRequest = useApproveCommunityRequest();
  const rejectRequest = useRejectCommunityRequest();
  const [isSavedVersesOpen, setIsSavedVersesOpen] = useState(false);

  const completedReads = useMemo(() => progress.filter((item) => item.completed).length, [progress]);
  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const { refreshProfile } = useAuth();

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      if (!user?.id) return;
      const url = await uploadUserAvatar(user.id, file);
      await updateUserAvatar(user.id, url);
      await refreshProfile();
    },
    [user?.id, refreshProfile],
  );

  return (
    <div className="pb-24 md:pb-6">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 md:max-w-5xl">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Perfil</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-4 md:max-w-5xl md:px-4">
      <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <ImageUpload
            currentUrl={user?.avatar}
            onFileSelect={handleAvatarUpload}
            label="Foto de perfil"
            aspect="square"
          />
          <div className="flex-1 min-w-0">
            <p className="text-slate-700">
          <span className="font-medium">Nombre:</span> {user?.name}
        </p>
        <p className="text-slate-700">
          <span className="font-medium">Correo:</span> {user?.email}
        </p>
        <p className="text-slate-700">
          <span className="font-medium">Iglesia:</span> {church?.name ?? 'Sin iglesia asignada'}
        </p>
          </div>
        </div>
      </section>
      <section
        className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
        role="button"
        tabIndex={0}
        onClick={() => setIsSavedVersesOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setIsSavedVersesOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Versículos guardados</h2>
            <p className="text-xs text-slate-600">Consulta y organiza los versículos que marcaste.</p>
          </div>
          <span className="text-indigo-600">→</span>
        </div>
      </section>

      {user?.is_platform_admin ? (
        <section className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-amber-900">Aceptar solicitudes de comunidades</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-amber-700">No hay solicitudes pendientes. También puedes gestionarlas en <Link to="/church" className="font-medium underline">Comunidad</Link>.</p>
          ) : (
            <ul className="space-y-3">
            {pendingRequests.map((r) => (
              <li key={r.id} className="rounded-lg border border-amber-200 bg-white p-3">
                <div className="font-medium text-slate-900">{r.name}</div>
                {r.description ? <p className="mt-1 text-sm text-slate-600">{r.description}</p> : null}
                <div className="mt-1 text-sm text-slate-600">
                  {r.city}, {r.country}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn-success px-3 py-1 text-sm"
                    onClick={() => approveRequest.mutate(r.id)}
                    disabled={approveRequest.isPending}
                  >
                    Aprobar
                  </button>
                  <button
                    className="btn-danger px-3 py-1 text-sm"
                    onClick={() => rejectRequest.mutate(r.id)}
                    disabled={rejectRequest.isPending}
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          )}
        </section>
      ) : null}
      <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold text-slate-900">Progreso de lectura</h2>
        <p className="text-slate-700">Registros completados: {completedReads}</p>
      </section>
      <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold text-slate-900">Racha espiritual</h2>
        <p className="text-slate-700">Racha actual: {streak?.current_streak ?? 0} días</p>
        <p className="text-slate-700">Mejor racha: {streak?.longest_streak ?? 0} días</p>
      </section>
      {isSavedVersesOpen ? <SavedVersesModal onClose={() => setIsSavedVersesOpen(false)} /> : null}
      </div>
    </div>
  );
}
