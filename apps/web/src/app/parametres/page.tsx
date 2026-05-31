'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/app-shell';

export default function ParametresPage() {
  return (
    <AppShell>
      <Parametres />
    </AppShell>
  );
}

function Parametres() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Paramètres</h1>

      <div className="card space-y-1">
        <p className="label">Compte</p>
        <p className="font-medium">{user?.email}</p>
      </div>

      <div className="card space-y-3">
        <Link href="/profil" className="block font-medium text-trust-700">
          Modifier mon profil
        </Link>
        <Link href="/recommandations" className="block font-medium text-trust-700">
          Gérer mes recommandations
        </Link>
        <Link href="/amis" className="block font-medium text-trust-700">
          Gérer mon réseau
        </Link>
      </div>

      <button onClick={handleLogout} className="btn-secondary w-full text-red-600">
        Se déconnecter
      </button>

      <p className="text-center text-xs text-ink/40">PLAL — Ton réseau de confiance.</p>
    </div>
  );
}
