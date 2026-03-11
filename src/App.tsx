import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './layouts/AppLayout';
import { initPushNotifications } from './pwa/notifications';

const HomeFeedPage = lazy(() => import('./pages/HomeFeedPage').then((module) => ({ default: module.HomeFeedPage })));
const ForYouPage = lazy(() => import('./pages/ForYouPage').then((module) => ({ default: module.ForYouPage })));
const BiblePage = lazy(() => import('./pages/BiblePage').then((module) => ({ default: module.BiblePage })));
const ChurchFeedPage = lazy(() => import('./pages/ChurchFeedPage').then((module) => ({ default: module.ChurchFeedPage })));
const CommunityFeedPage = lazy(() =>
  import('./pages/CommunityFeedPage').then((module) => ({ default: module.CommunityFeedPage })),
);
const GlobalFeedPage = lazy(() => import('./pages/GlobalFeedPage').then((module) => ({ default: module.GlobalFeedPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((module) => ({ default: module.GoalsPage })));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage').then((module) => ({ default: module.CreatePostPage })));
const ChatsPage = lazy(() => import('./pages/ChatsPage').then((module) => ({ default: module.ChatsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    void initPushNotifications({
      userId: user.id,
      churchId: user.church_id,
    }).catch((error) => {
      console.warn('Push notifications init failed.', error);
    });
  }, [user?.church_id, user?.id]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<div className="p-4">Cargando...</div>}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<div className="p-4">Cargando...</div>}>
            <RegisterPage />
          </Suspense>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <HomeFeedPage />
              </Suspense>
            }
          />
          <Route
            path="/home"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <HomeFeedPage />
              </Suspense>
            }
          />
          <Route
            path="/for-you"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <ForYouPage />
              </Suspense>
            }
          />
          <Route
            path="/bible"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <BiblePage />
              </Suspense>
            }
          />
          <Route
            path="/church"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <ChurchFeedPage />
              </Suspense>
            }
          />
          <Route
            path="/community/:id"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <CommunityFeedPage />
              </Suspense>
            }
          />
          <Route
            path="/global"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <GlobalFeedPage />
              </Suspense>
            }
          />
          <Route
            path="/goals"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <GoalsPage />
              </Suspense>
            }
          />
          <Route
            path="/create"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <CreatePostPage />
              </Suspense>
            }
          />
          <Route
            path="/chats"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <ChatsPage />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<div className="p-4">Cargando...</div>}>
                <ProfilePage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
