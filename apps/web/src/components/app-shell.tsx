'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services';
import { Avatar, Spinner } from './ui';

const NAV = [
  { href: '/dashboard', label: 'Accueil', icon: HomeIcon },
  { href: '/rechercher', label: 'Rechercher', icon: SearchIcon },
  { href: '/recommandations', label: 'Mes recos', icon: HeartIcon },
  { href: '/amis', label: 'Amis', icon: UsersIcon },
  { href: '/demandes', label: 'Demandes', icon: InboxIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && !user.onboardingCompleted) router.replace('/onboarding');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-20 sm:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-sand bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/dashboard" className="text-lg font-bold text-trust-700">
            PLAL
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/profil" aria-label="Profil">
              <Avatar
                firstName={user.profile?.firstName ?? '?'}
                lastName={user.profile?.lastName}
                photoUrl={user.profile?.photoUrl}
                size={36}
              />
            </Link>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="mx-auto hidden max-w-3xl gap-1 px-5 pb-2 sm:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-sand bg-white sm:hidden">
        <div className="mx-auto flex max-w-3xl justify-around">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                  active ? 'text-trust-700' : 'text-ink/40'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (p: { className?: string }) => JSX.Element;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-trust-100 text-trust-700' : 'text-ink/60 hover:bg-sand'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    services
      .getNotifications()
      .then((items) => {
        if (active) setUnread(items.filter((n) => !n.read).length);
      })
      .catch(() => {
        /* silencieux : la cloche ne doit pas casser la nav */
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <Link href="/notifications" aria-label="Notifications" className="relative text-ink/60 hover:text-trust-700">
      <BellIcon className="h-6 w-6" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warmth-500 px-1 text-[10px] font-semibold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 21s-7-4.6-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.4 12 21 12 21z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M17 5.5a3 3 0 010 5.8M22 20c0-2.5-1.4-4.4-3.5-5.3" strokeLinecap="round" />
    </svg>
  );
}
function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 13l3-8h12l3 8v6H3v-6z" strokeLinejoin="round" />
      <path d="M3 13h5l1 2h6l1-2h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
