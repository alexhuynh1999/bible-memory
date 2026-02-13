import { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

interface AppShellProps {
  onAddPress: () => void;
}

export default function AppShell({ onAddPress }: AppShellProps) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top when navigating between pages
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-parchment-50 dark:bg-warmBrown-900 font-sans">
      <main ref={mainRef} className="h-full overflow-y-auto max-w-lg mx-auto px-4 pt-3"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Outlet />
      </main>
      <BottomNav onAddPress={onAddPress} />
    </div>
  );
}
