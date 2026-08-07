'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SearchResult } from '@plal/shared';
import { RECOMMENDATION_TYPE_LABELS } from '@plal/shared';
import { services } from '@/lib/services';
import { ApiError } from '@/lib/api';
import { Avatar, CategoryChip, DistanceBadge } from './ui';

function formatTrustLabel(result: SearchResult): string {
  const category = result.category.name.toLowerCase();
  if (result.depth === 1) {
    return `Ton ami ${result.helper.firstName} connaît un${category.endsWith('e') ? 'e' : ''} ${category}`;
  }
  const chain = result.pathProfiles.map((p) => p.firstName).join(' → ');
  return `Ton réseau : ${chain} connaît un${category.endsWith('e') ? 'e' : ''} ${category}`;
}

export function SearchResultCard({ result }: { result: SearchResult }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    `Salut ${result.helper.firstName}, je cherche ${result.title.toLowerCase()}${
      result.city ? ` à ${result.city}` : ''
    }. Tu avais indiqué connaître quelqu'un de fiable. Tu peux me mettre en relation ?`,
  );
  const [responseType, setResponseType] = useState<'phone' | 'email' | 'social' | ''>('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setError('');
    try {
      await services.createIntroduction(
        result.recommendationId,
        message,
        responseType || undefined,
        result.depth > 1 ? result.pathProfiles[0]?.userId : undefined,
      );
      setSent(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  }

  const trustLabel = formatTrustLabel(result);

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Link href={`/utilisateur/${result.helper.userId}`}>
          <Avatar
            firstName={result.helper.firstName}
            lastName={result.helper.lastName}
            photoUrl={result.helper.photoUrl}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-trust-700">{trustLabel}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/utilisateur/${result.helper.userId}`} className="font-semibold hover:text-trust-700">
              {result.helper.firstName}
            </Link>
            <DistanceBadge distance={result.distance} />
          </div>
          <p className="mt-1 text-ink/80">
            <span className="font-medium">{result.title}</span>
            {result.city && <span className="text-ink/50"> · {result.city}</span>}
            {result.distanceKm != null && (
              <span className="text-trust-700"> · à {result.distanceKm} km</span>
            )}
          </p>
          {result.description && (
            <p className="mt-1 text-sm text-ink/60">{result.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <CategoryChip name={result.category.name} />
            <span className="chip bg-sand text-ink/60">
              {RECOMMENDATION_TYPE_LABELS[result.type]}
            </span>
          </div>
          {result.depth > 1 && result.pathProfiles.length > 0 && (
            <p className="mt-2 text-xs text-ink/50">
              Chaîne de confiance ({result.depth} sauts) :{' '}
              {result.pathProfiles.map((p) => p.firstName).join(' → ')}
            </p>
          )}
        </div>
      </div>

      {sent ? (
        <p className="mt-4 rounded-xl bg-trust-50 px-4 py-2.5 text-sm font-medium text-trust-700">
          ✓ Demande envoyée à {result.helper.firstName}
        </p>
      ) : (
        <button onClick={() => setOpen(true)} className="btn-primary mt-4 w-full">
          Demander une mise en relation
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-soft sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              Demander une mise en relation à {result.helper.firstName}
            </h3>
            <p className="mt-1 text-sm text-ink/60">
              {trustLabel}. Choisis comment tu souhaites être recontacté.
            </p>
            <textarea
              className="input mt-4 min-h-[100px] resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
            <div className="mt-3">
              <label className="label" htmlFor={`response-type-${result.recommendationId}`}>
                Mode de réponse souhaité
              </label>
              <select
                id={`response-type-${result.recommendationId}`}
                className="input"
                value={responseType}
                onChange={(e) => setResponseType(e.target.value as 'phone' | 'email' | 'social' | '')}
              >
                <option value="">Laisse choisir mon contact</option>
                <option value="phone">Par téléphone</option>
                <option value="email">Par email</option>
                <option value="social">Sur les réseaux sociaux</option>
              </select>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setOpen(false)} className="btn-secondary flex-1">
                Annuler
              </button>
              <button onClick={send} className="btn-primary flex-1" disabled={loading || !message.trim()}>
                {loading ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
