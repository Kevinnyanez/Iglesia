import { useMemo } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCurrentUserChurch } from '../hooks/useChurch';

export function FloatingCreateButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams<{ id?: string }>();
  const { data: currentChurch } = useCurrentUserChurch();

  const createUrl = useMemo(() => {
    if (location.pathname.startsWith('/global')) {
      return '/create?visibility=global';
    }
    if (location.pathname === '/' && searchParams.get('feed') === 'global') {
      return '/create?visibility=global';
    }
    if (location.pathname === '/' && searchParams.get('feed') === 'community' && currentChurch?.id) {
      return `/create?visibility=church&communityId=${encodeURIComponent(currentChurch.id)}`;
    }
    if (location.pathname.startsWith('/community/') && params.id) {
      return `/create?visibility=church&communityId=${encodeURIComponent(params.id)}`;
    }
    if (location.pathname.startsWith('/church') && currentChurch?.id) {
      return `/create?visibility=church&communityId=${encodeURIComponent(currentChurch.id)}`;
    }
    return '/create?visibility=global';
  }, [currentChurch?.id, location.pathname, params.id, searchParams]);

  if (location.pathname === '/create') return null;

  return (
    <button
      onClick={() => navigate(createUrl)}
      className="fixed bottom-20 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-slate-900 text-3xl text-white shadow-xl md:bottom-6 md:right-6"
      aria-label="Crear publicación"
    >
      +
    </button>
  );
}
