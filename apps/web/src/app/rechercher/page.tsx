'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Category, SearchResult } from '@plal/shared';
import { services } from '@/lib/services';
import { ApiError } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { SearchResultCard } from '@/components/search-result-card';
import { EmptyState } from '@/components/ui';
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
  const [maxDepth, setMaxDepth] = useState(2);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [submitted, setSubmitted] = useState<{
    q: string;
    city: string;
    categoryId: string;
    radiusKm: number;
    maxDepth: number;
    origin: { latitude: number; longitude: number } | null;
  } | null>(
    initial
      ? { q: initial, city: '', categoryId: '', radiusKm: 0, maxDepth: 2, origin: null }
      : null,
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
      .search(
        submitted.q.trim(),
        submitted.city.trim() || undefined,
        submitted.categoryId || undefined,
        submitted.radiusKm || undefined,
        submitted.maxDepth,
        submitted.origin,
      )
      .then(setResults)
      .finally(() => setLoading(false));
  }, [submitted]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let origin: { latitude: number; longitude: number } | null = null;
    const cityTrimmed = city.trim();
    if (cityTrimmed) {
      try {
        const point = await services.geocodeCity(cityTrimmed);
        if (point.latitude != null && point.longitude != null) {
          origin = { latitude: point.latitude, longitude: point.longitude };
        }
      } catch {
        // Silencieux : le filtre texte sur la ville fonctionne quand même.
      }
    }
    setSubmitted({ q: query, city, categoryId, radiusKm, maxDepth, origin });
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
            {flattenCategories(categories).map((c) => (
              <option key={c.id} value={c.id}>
                {c.prefix}{c.name}
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
        <div>
          <label className="label" htmlFor="depth">
            Étendue du réseau de confiance
          </label>
          <select
            id="depth"
            className="input"
            value={maxDepth}
            onChange={(e) => setMaxDepth(Number(e.target.value))}
          >
            <option value={1}>Mes amis directs</option>
            <option value={2}>Amis d&apos;amis</option>
            <option value={3}>Réseau élargi (3 sauts)</option>
            <option value={4}>Réseau élargi (4 sauts)</option>
          </select>
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

      {!loading && (
        <button
          onClick={() => setSuggestOpen(true)}
          className="text-sm text-trust-700 underline underline-offset-4"
        >
          Tu ne trouves pas la bonne catégorie ? Suggère-la.
        </button>
      )}

      {suggestOpen && (
        <CategorySuggestionModal onClose={() => setSuggestOpen(false)} />
      )}
    </div>
  );
}

function flattenCategories(categories: Category[], prefix = ''): Array<Category & { prefix: string }> {
  return categories.flatMap((c) => [
    { ...c, prefix },
    ...(c.children ? flattenCategories(c.children, `${prefix}— `) : []),
  ]);
}

function CategorySuggestionModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await services.suggestCategory(name.trim(), description.trim());
      setDone(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-soft sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Suggérer une catégorie</h3>
        <p className="mt-1 text-sm text-ink/60">
          Ta suggestion sera relue avant d&apos;être ajoutée.
        </p>
        {done ? (
          <p className="mt-4 rounded-xl bg-trust-50 px-4 py-3 text-sm font-medium text-trust-700">
            {done}
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la catégorie"
              maxLength={60}
              required
            />
            <textarea
              className="input min-h-[80px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pourquoi cette catégorie ? (optionnel)"
              maxLength={500}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Annuler
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={loading || !name.trim()}>
                {loading ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
