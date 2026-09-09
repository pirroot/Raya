'use client';
import { usePathname } from 'next/navigation';
import TopHeaderMobil from '@/components/TopHeaderMobil';
import BottomNav from '@/components/BottomNav';

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAi = pathname.startsWith('/ai');

  if (isAi) {
    return <>{children}</>;
  }

  return (
    <>
      <header>
        <TopHeaderMobil />
      </header>
      <main className="min-h-screen my-5">
        {children}
        <BottomNav />
      </main>
      <footer className="py-2 font-bold max-sm:hidden">
        <p className="text-center text-sm text-foreground-muted">
          © {new Date().getFullYear()} رایا - تمامی حقوق محفوظ است
        </p>
      </footer>
    </>
  );
}
