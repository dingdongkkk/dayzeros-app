'use client';

import { usePathname } from 'next/navigation';
import { DayzerosProvider, useDayzeros } from '@/context/DayzerosContext';
import { BackgroundScene } from '@/components/BackgroundScene';
import { Fireflies } from '@/components/Fireflies';
import { LandingNavbar } from '@/components/LandingNavbar';
import { AppNavbar } from '@/components/AppNavbar';
import { Toast } from '@/components/Toast';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp =
    pathname.startsWith('/app') ||
    pathname.startsWith('/focus') ||
    pathname.startsWith('/planner') ||
    pathname.startsWith('/stats');
  const isScrollable = pathname.startsWith('/stats');
  const { mounted, scene, days, toastMessage, toastVisible } = useDayzeros();

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#12132a]" />;
  }

  return (
    <main
      className={`relative w-full ${
        isScrollable ? 'h-screen overflow-y-auto' : 'min-h-screen overflow-hidden'
      }`}
    >
      {/* Background artwork and ambient lighting */}
      <BackgroundScene scene={scene} currentView={isApp ? 'focus' : 'landing'} />

      {/* One firefly per session banked this week — the streak, as light */}
      {!isApp && <Fireflies days={days} />}

      {/* Distinct navbar: LandingNavbar for landing page (/), AppNavbar for app (/app) */}
      {isApp ? <AppNavbar /> : <LandingNavbar />}

      {/* Main view content */}
      {children}

      {/* Toast notifications */}
      <Toast message={toastMessage} visible={toastVisible} />
    </main>
  );
}

export function DayzerosLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DayzerosProvider>
      <AppShell>{children}</AppShell>
    </DayzerosProvider>
  );
}
