'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services';
import { ApiError, setToken } from '@/lib/api';
import { VersionBadge } from '@/components/version-badge';

export default function ConfirmEmailChangePage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailChangeForm />
    </Suspense>
  );
}

function ConfirmEmailChangeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const token = searchParams.get('token') ?? '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Lien de confirmation invalide.');
      setLoading(false);
      return;
    }

    services
      .confirmEmailChange(token)
      .then((res) => {
        setToken(res.accessToken);
        setUser(res.user);
        router.push(res.user.onboardingCompleted ? '/dashboard' : '/onboarding');
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Confirmation impossible.');
        setLoading(false);
      });
  }, [token, router, setUser]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Link href="/" className="text-2xl font-bold text-trust-700">
            PLAL
          </Link>
          <VersionBadge />
        </div>
        <div className="card">
          <h1 className="text-xl font-semibold">Confirmation d&apos;email</h1>

          {loading ? (
            <p className="mt-4 text-sm text-ink/60">Confirmation en cours…</p>
          ) : error ? (
            <>
              <p className="mt-4 text-sm text-red-600">{error}</p>
              <Link href="/parametres" className="mt-4 inline-block text-sm font-semibold text-trust-700">
                Retour aux paramètres
              </Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-trust-700">Email confirmé avec succès.</p>
          )}
        </div>
      </div>
    </main>
  );
}
