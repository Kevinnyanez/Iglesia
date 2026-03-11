import { Link } from 'react-router-dom';
import { useMemo, useState, type FormEvent } from 'react';
import type { GoalType } from '../types/models';
import { useCreateGoal, useDeleteGoal, useGoalProgress, useMarkGoalProgress, useUserGoals } from '../hooks/useGoals';
import { useMyCommunities } from '../hooks/useCommunity';
import { PostComposer } from '../components/PostComposer';

const TARGET_DAYS_OPTIONS = [3, 5, 7, 10, 14, 21, 30];
const TARGET_MINUTES_OPTIONS = [5, 10, 15, 20, 30];

export function GoalsPage() {
  const [type, setType] = useState<GoalType>('prayer');
  const [targetMinutes, setTargetMinutes] = useState(15);
  const [targetDays, setTargetDays] = useState(7);
  const [shareGoal, setShareGoal] = useState<{ id: string; title: string; type: GoalType } | null>(null);
  const [isShareComposerOpen, setIsShareComposerOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [goalToShare, setGoalToShare] = useState<{ id: string; title: string; type: GoalType } | null>(null);
  const createGoal = useCreateGoal();
  const markGoalProgress = useMarkGoalProgress();
  const deleteGoal = useDeleteGoal();
  const { data: goals = [] } = useUserGoals();
  const { data: communities = [] } = useMyCommunities();
  const today = new Date().toISOString().slice(0, 10);

  const onCreateGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const activity = type === 'prayer' ? 'Oración' : 'Lectura bíblica';
    const title = `${activity} ${targetMinutes} min durante ${targetDays} días`;
    await createGoal.mutateAsync({
      title,
      type,
      target_minutes: targetMinutes,
      target_days: targetDays,
    });
    setTargetMinutes(15);
    setTargetDays(7);
  };

  const prayerGoals = useMemo(() => goals.filter((goal) => goal.type === 'prayer'), [goals]);
  const bibleGoals = useMemo(() => goals.filter((goal) => goal.type === 'bible'), [goals]);

  const handleDayCompleted = async (
    goal: { id: string; title: string; type: GoalType; target_minutes: number; target_days: number },
    onFullyCompleted: () => void
  ) => {
    await markGoalProgress.mutateAsync({
      goal_id: goal.id,
      date: today,
      completed: true,
    });
    onFullyCompleted();
  };

  return (
    <div className="pb-24 md:pb-6">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 md:max-w-5xl">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Metas</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-4 md:max-w-5xl md:px-4">
        {/* Crear meta - card estilo feed */}
        <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Nueva meta espiritual</h2>
          <p className="mb-4 text-sm text-slate-600">
            Define cuántos minutos por día y durante cuántos días. Marca cada día completado y al terminar el último, ¡la meta se registrará como lograda!
          </p>
          <form onSubmit={onCreateGoal} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">Tipo de meta</label>
              <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    type === 'prayer' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setType('prayer')}
                >
                  Orar
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    type === 'bible' ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setType('bible')}
                >
                  Leer Biblia
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Minutos por día</label>
                <select
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number(e.target.value))}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  {TARGET_MINUTES_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Días</label>
                <select
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  {TARGET_DAYS_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} días
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full rounded-full py-2.5">
                  Crear meta
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Metas de oración</h2>
          {prayerGoals.length === 0 ? <p className="text-sm text-slate-500">Aún no tienes metas de oración.</p> : null}
          <ul className="space-y-3">
            {prayerGoals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                today={today}
                onDayCompleted={handleDayCompleted}
                onFullyCompleted={() => setShareGoal({ id: goal.id, title: goal.title, type: goal.type })}
                onDelete={() => {
                  if (window.confirm('¿Eliminar esta meta?')) {
                    void deleteGoal.mutateAsync(goal.id);
                  }
                }}
                onShare={() => {
                  setGoalToShare({ id: goal.id, title: goal.title, type: goal.type });
                  setSelectedCommunityId(communities[0]?.id ?? '');
                }}
              />
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Metas de lectura bíblica</h2>
          {bibleGoals.length === 0 ? <p className="text-sm text-slate-500">Aún no tienes metas de lectura bíblica.</p> : null}
          <ul className="space-y-3">
            {bibleGoals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                today={today}
                onDayCompleted={handleDayCompleted}
                onFullyCompleted={() => setShareGoal({ id: goal.id, title: goal.title, type: goal.type })}
                onDelete={() => {
                  if (window.confirm('¿Eliminar esta meta?')) {
                    void deleteGoal.mutateAsync(goal.id);
                  }
                }}
                onShare={() => {
                  setGoalToShare({ id: goal.id, title: goal.title, type: goal.type });
                  setSelectedCommunityId(communities[0]?.id ?? '');
                }}
              />
            ))}
          </ul>
        </div>
      </section>

        {shareGoal && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">¡Meta completada!</h2>
                <button type="button" className="btn-ghost px-2" onClick={() => setShareGoal(null)}>
                  Cerrar
                </button>
              </div>
              <p className="text-sm text-slate-700">Completaste: <span className="font-semibold">{shareGoal.title}</span></p>
              {communities.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-600">Comparte este logro con la comunidad.</p>
                  <select
                    className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={selectedCommunityId}
                    onChange={(event) => setSelectedCommunityId(event.target.value)}
                  >
                    <option value="">Selecciona comunidad</option>
                    {communities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-primary w-full rounded-full py-2.5"
                    onClick={() => {
                      if (!selectedCommunityId) return;
                      setIsShareComposerOpen(true);
                    }}
                    disabled={!selectedCommunityId}
                  >
                    Compartir en comunidad
                  </button>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Aún no perteneces a una comunidad.{' '}
                  <Link to="/church" className="font-semibold underline">
                    Únete a una
                  </Link>{' '}
                  para compartir tus logros.
                </div>
              )}
            </div>
          </div>
        )}

        {isShareComposerOpen && shareGoal && (
        <ShareGoalModal
          goal={shareGoal}
          selectedCommunityId={selectedCommunityId}
          communities={communities}
          onCommunityChange={setSelectedCommunityId}
          onClose={() => {
            setIsShareComposerOpen(false);
            setShareGoal(null);
          }}
          onSuccess={() => {
            setIsShareComposerOpen(false);
            setShareGoal(null);
          }}
          isCompleted
        />
        )}

        {goalToShare && (
        <ShareGoalModal
          goal={goalToShare}
          selectedCommunityId={selectedCommunityId}
          communities={communities}
          onCommunityChange={setSelectedCommunityId}
          onClose={() => setGoalToShare(null)}
          onSuccess={() => setGoalToShare(null)}
        />
        )}
      </div>
    </div>
  );
}

function ShareGoalModal({
  goal,
  selectedCommunityId,
  communities,
  onCommunityChange,
  onClose,
  onSuccess,
  isCompleted = false,
}: {
  goal: { id: string; title: string; type: GoalType };
  selectedCommunityId: string;
  communities: { id: string; name: string }[];
  onCommunityChange: (id: string) => void;
  onClose: () => void;
  onSuccess: () => void;
  isCompleted?: boolean;
}) {
  const content = isCompleted
    ? `Completé mi meta de ${goal.type === 'prayer' ? 'oración' : 'lectura bíblica'}: ${goal.title}`
    : `Mi meta: ${goal.title}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Compartir con comunidad</h2>
          <button type="button" className="btn-ghost px-2" onClick={onClose}>
            Cerrar
          </button>
        </div>
        {communities.length > 0 ? (
          <>
            <select
              className="mb-3 w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedCommunityId}
              onChange={(e) => onCommunityChange(e.target.value)}
            >
              <option value="">Selecciona comunidad</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <PostComposer
              fixedVisibility="church"
              fixedPostType="testimony"
              initialCommunityId={selectedCommunityId}
              initialContent={content}
              hideVerseReference
              hideMediaUrl
              hideAdvancedOptions
              submitLabel="Compartir"
              onSuccess={onSuccess}
            />
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Únete a una comunidad para compartir. <Link to="/church" className="font-semibold underline">Ir a comunidades</Link>
          </p>
        )}
      </div>
    </div>
  );
}

interface GoalItemProps {
  goal: {
    id: string;
    title: string;
    type: GoalType;
    target_minutes: number;
    target_days: number;
  };
  today: string;
  onDayCompleted: (
    goal: { id: string; title: string; type: GoalType; target_minutes: number; target_days: number },
    onFullyCompleted: () => void
  ) => Promise<void>;
  onFullyCompleted: () => void;
  onDelete: () => void;
  onShare: () => void;
}

function GoalItem({ goal, today, onDayCompleted, onFullyCompleted, onDelete, onShare }: GoalItemProps) {
  const { data: progress = [] } = useGoalProgress(goal.id);
  const targetDays = goal.target_days ?? 7;
  const completedEntries = progress.filter((e) => e.completed).sort((a, b) => a.date.localeCompare(b.date));
  const completedCount = completedEntries.length;
  const isFullyCompleted = completedCount >= targetDays;
  const nextDayIndex = completedCount;
  const hasCompletedToday = completedEntries.some((e) => e.date === today);

  const handleCompleteNextDay = () => {
    if (hasCompletedToday) return;
    void onDayCompleted(goal, () => {
      if (completedCount + 1 >= targetDays) {
        onFullyCompleted();
      }
    });
  };

  return (
    <li className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{goal.title}</h3>
          <p className="mt-0.5 text-sm text-slate-600">
            {goal.type === 'prayer' ? 'Oración' : 'Lectura bíblica'} · {(goal.target_minutes ?? 0) > 0 ? `${goal.target_minutes} min/día · ` : ''}{completedCount}/{targetDays} días completados
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="btn-ghost rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[var(--primary)]"
            onClick={onShare}
            title="Compartir con comunidad"
            aria-label="Compartir"
          >
            ↗
          </button>
          <button
            type="button"
            className="btn-ghost rounded-full p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            onClick={onDelete}
            title="Eliminar meta"
            aria-label="Eliminar"
          >
            🗑
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: targetDays }, (_, i) => {
          const isDone = i < completedCount;
          const isNext = i === nextDayIndex;
          const canTap = isNext && !hasCompletedToday && !isFullyCompleted && nextDayIndex < targetDays;
          return (
            <button
              key={i}
              type="button"
              onClick={canTap ? handleCompleteNextDay : undefined}
              disabled={!canTap}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                isDone
                  ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                  : canTap
                    ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)] hover:bg-blue-100'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
              title={isDone ? `Día ${i + 1} completado` : canTap ? `Completar día ${i + 1}` : `Día ${i + 1}`}
            >
              {isDone ? '✓' : i + 1}
            </button>
          );
        })}
      </div>
      {!isFullyCompleted && nextDayIndex < targetDays && (
        <button
          type="button"
          onClick={handleCompleteNextDay}
          disabled={hasCompletedToday}
          className="btn-primary mt-3 w-full rounded-full py-2.5"
        >
          {hasCompletedToday ? 'Completado hoy' : `Completar día ${nextDayIndex + 1}`}
        </button>
      )}
      {isFullyCompleted && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ¡Meta lograda!
        </div>
      )}
    </li>
  );
}
