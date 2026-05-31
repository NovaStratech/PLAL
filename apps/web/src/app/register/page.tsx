'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inscription impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-trust-700">
          PLAL
        </Link>
        <div className="card">
          <h1 className="text-xl font-semibold">Crée ton réseau de confiance</h1>
          <p className="mt-1 text-sm text-ink/60">Quelques secondes suffisent pour commencer.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="firstName">
                Prénom
              </label>
              <input
                id="firstName"
                className="input"
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                placeholder="Alex"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="toi@exemple.com"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="8 caractères minimum"
                minLength={8}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink/60">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-semibold text-trust-700">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
