'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Category, SearchResult } from '@plal/shared';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { SearchResultCard } from '@/components/search-result-card';
import { EmptyState, Spinner } from '@/components/ui';
import { CardSkeleton } from '@/components/skeleton';

export default function RecherchePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="space-y-3 pt-6"><CardSkeleton /><CardSkeleton /></div>}>
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
  const [radiusKm, setRadiusKm] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitted, setSubmitted] = useState<{
    q: string;
    city: string;
    categoryId: string;
    radiusKm: number;
  } | null>(initial ? { q: initial, city: '', categoryId: '', radiusKm: 0 } : null);
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
      .search(
        submitted.q.trim(),
        submitted.city.trim() || undefined,
        submitted.categoryId || undefined,
        submitted.radiusKm || undefined,
      )
      .then(setResults)
      .finally(() => setLoading(false));
  }, [submitted]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted({ q: query, city, categoryId, radiusKm });
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
        <div>
          <label className="label" htmlFor="radius">
            Distance — autour de ma ville
          </label>
          <select
            id="radius"
            className="input"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            <option value={0}>Partout dans mon réseau</option>
            <option value={5}>À moins de 5 km</option>
            <option value={10}>À moins de 10 km</option>
            <option value={25}>À moins de 25 km</option>
            <option value={50}>À moins de 50 km</option>
            <option value={100}>À moins de 100 km</option>
          </select>
          <p className="mt-1 text-xs text-ink/40">
            Renseigne ta ville dans ton profil pour activer le filtre par distance.
          </p>
        </div>
      </form>

      {loading && <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>}

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
