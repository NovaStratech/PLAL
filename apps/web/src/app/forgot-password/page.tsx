'use client';

import { useState } from 'react';
import Link from 'next/link';
import { services } from '@/lib/services';
import { ApiError } from '@/lib/api';
import { VersionBadge } from '@/components/version-badge';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await services.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec de l\'envoi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Link href="/" className="text-2xl font-bold text-trust-700">
            PLAL
          </Link>
          <VersionBadge />
        </div>
        <div className="card">
          <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-ink/60">
            Saisis ton email pour recevoir un lien de réinitialisation.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl border border-trust-100 bg-trust-100/40 px-4 py-3 text-sm text-trust-700">
              Si un compte existe avec cette adresse, tu vas recevoir un email avec les instructions.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toi@exemple.com"
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-ink/60">
          <Link href="/login" className="font-semibold text-trust-700">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
