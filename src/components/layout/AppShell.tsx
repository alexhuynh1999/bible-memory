import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

interface AppShellProps {
  onAddPress: () => void;
}

export default function AppShell({ onAddPress }: AppShellProps) {
  return (
    <div className="h-[100dvh] overflow-hidden bg-parchment-50 dark:bg-warmBrown-900 font-sans">
      <main className="h-full overflow-y-auto max-w-lg mx-auto pb-20 px-4 pt-3">
        <Outlet />
      </main>
      <BottomNav onAddPress={onAddPress} />
    </div>
  );
}
