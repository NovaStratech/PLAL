'use client';

import { useState } from 'react';
import type { SearchResult } from '@plal/shared';
import { RECOMMENDATION_TYPE_LABELS } from '@plal/shared';
import { services } from '@/lib/services';
import { ApiError } from '@/lib/api';
import { Avatar, CategoryChip, DistanceBadge } from './ui';

export function SearchResultCard({ result }: { result: SearchResult }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    `Salut ${result.helper.firstName}, je cherche ${result.title.toLowerCase()}${
      result.city ? ` à ${result.city}` : ''
    }. Tu avais indiqué connaître quelqu'un de fiable. Tu peux me mettre en relation ?`,
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setError('');
    try {
      await services.createIntroduction(result.recommendationId, message);
      setSent(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Avatar
          firstName={result.helper.firstName}
          lastName={result.helper.lastName}
          photoUrl={result.helper.photoUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{result.helper.firstName}</p>
            <DistanceBadge distance={result.distance} />
          </div>
          <p className="mt-1 text-ink/80">
            <span className="font-medium">{result.title}</span>
            {result.city && <span className="text-ink/50"> · {result.city}</span>}
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
              {result.helper.firstName} décidera s&apos;il souhaite te mettre en relation.
            </p>
            <textarea
              className="input mt-4 min-h-[120px] resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
            />
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
