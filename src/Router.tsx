import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { GlobalCommandPalette } from '@/components/modals/GlobalCommandPalette';
import { WelcomeModal } from '@/components/modals/WelcomeModal';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCloudSimulation } from '@/hooks/useCloudSimulation';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Infrastructure = lazy(() => import('./pages/Infrastructure').then((m) => ({ default: m.Infrastructure })));
const Predictions = lazy(() => import('./pages/Predictions').then((m) => ({ default: m.Predictions })));
const Alerts = lazy(() => import('./pages/Alerts').then((m) => ({ default: m.Alerts })));
const Incidents = lazy(() => import('./pages/Incidents').then((m) => ({ default: m.Incidents })));
const AiChat = lazy(() => import('./pages/AiChat').then((m) => ({ default: m.AiChat })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

function AppLayout() {
  useKeyboardShortcuts();
  // Start simulation globally so it runs on all pages
  useCloudSimulation();

  return (
    <>
      <Sidebar />
      <TopBar />
      <GlobalCommandPalette />
      <WelcomeModal />
      <Suspense fallback={<div className="ml-[64px] pt-[52px]"><PageSkeleton /></div>}>
        <Outlet />
      </Suspense>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex" style={{ background: '#050913', borderTop: '1px solid #1a2540' }}>
        {[
          { path: '/', label: 'Home', emoji: '🏠' },
          { path: '/infrastructure', label: 'Infra', emoji: '🗺️' },
          { path: '/predictions', label: 'AI', emoji: '🤖' },
          { path: '/alerts', label: 'Alerts', emoji: '🔔' },
          { path: '/settings', label: 'Config', emoji: '⚙️' },
        ].map((item) => (
          <a
            key={item.path}
            href={item.path}
            className="flex-1 flex flex-col items-center py-2 text-[10px] gap-1 text-[#4a5a8a] hover:text-[#6366f1] transition-colors"
          >
            <span className="text-lg">{item.emoji}</span>
            {item.label}
          </a>
        ))}
      </nav>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'infrastructure', element: <Infrastructure /> },
      { path: 'predictions', element: <Predictions /> },
      { path: 'alerts', element: <Alerts /> },
      { path: 'incidents', element: <Incidents /> },
      { path: 'ai-chat', element: <AiChat /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
