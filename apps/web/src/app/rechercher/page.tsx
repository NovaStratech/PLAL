'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Category, SearchResult } from '@plal/shared';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { SearchResultCard } from '@/components/search-result-card';
import { EmptyState, Spinner } from '@/components/ui';

export default function RecherchePage() {
  return (
    <AppShell>
      <Suspense fallback={<Spinner />}>
        <Recherche />
      </Suspense>
    </AppShell>
  );
}

function Recherche() {
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitted, setSubmitted] = useState<{ q: string; city: string; categoryId: string } | null>(
    initial ? { q: initial, city: '', categoryId: '' } : null,
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    services.getCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!submitted) return;
    const hasCriteria = submitted.q.trim() || submitted.city.trim() || submitted.categoryId;
    if (!hasCriteria) return;
    setLoading(true);
    setSearched(true);
    services
      .search(submitted.q.trim(), submitted.city.trim() || undefined, submitted.categoryId || undefined)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [submitted]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted({ q: query, city, categoryId });
  }

  const directCount = results.filter((r) => r.distance === 'direct').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rechercher dans ton réseau</h1>
        <p className="mt-1 text-ink/60">Tes amis et leurs amis. Pas un annuaire public.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex. ostéo, garagiste, plombier…"
            autoFocus
          />
          <button type="submit" className="btn-primary">
            Chercher
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ville (optionnel)"
          />
          <select
            className="input flex-1"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </form>

      {loading && <Spinner />}

      {!loading && searched && results.length > 0 && (
        <>
          <p className="text-sm text-ink/60">
            <strong className="text-ink">{results.length}</strong> personne
            {results.length > 1 ? 's' : ''} dans ton réseau {results.length > 1 ? 'peuvent' : 'peut'}{' '}
            t&apos;aider
            {directCount > 0 && ` · ${directCount} ami${directCount > 1 ? 's' : ''} direct${directCount > 1 ? 's' : ''}`}
          </p>
          <div className="space-y-3">
            {results.map((r) => (
              <SearchResultCard key={r.recommendationId} result={r} />
            ))}
          </div>
        </>
      )}

      {!loading && searched && results.length === 0 && (
        <EmptyState
          title="Personne dans ton réseau pour cette recherche."
          hint="Élargis ton réseau en ajoutant plus d'amis, ou réessaie avec d'autres mots."
        />
      )}
    </div>
  );
}
