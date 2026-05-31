'use client';

import { useEffect, useState } from 'react';
import type { Category, Recommendation } from '@plal/shared';
import {
  RecommendationType,
  RecommendationVisibility,
  RECOMMENDATION_TYPE_LABELS,
} from '@plal/shared';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { CategoryChip, EmptyState, Spinner } from '@/components/ui';
import { ApiError } from '@/lib/api';

export default function RecommandationsPage() {
  return (
    <AppShell>
      <Recommandations />
    </AppShell>
  );
}

function Recommandations() {
  const [recos, setRecos] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setRecos(await services.getMyRecommendations());
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mes recommandations</h1>
          <p className="mt-1 text-ink/60">Les personnes de confiance que tu connais.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          {showForm ? 'Fermer' : '+ Déclarer'}
        </button>
      </div>

      {showForm && (
        <RecoForm
          onCreated={async () => {
            await load();
            setShowForm(false);
          }}
        />
      )}

      {loading ? (
        <Spinner />
      ) : recos.length === 0 ? (
        <EmptyState
          title="Tu n'as pas encore déclaré de recommandation."
          hint="« Je connais quelqu'un de fiable dans ce domaine. » Commence ici."
        />
      ) : (
        <div className="space-y-3">
          {recos.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.title}</p>
                  {r.description && <p className="mt-1 text-sm text-ink/60">{r.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <CategoryChip name={r.category.name} />
                    <span className="chip bg-sand text-ink/60">
                      {RECOMMENDATION_TYPE_LABELS[r.type]}
                    </span>
                    {r.city && <span className="chip bg-sand text-ink/60">{r.city}</span>}
                    {r.visibility === RecommendationVisibility.FRIENDS && (
                      <span className="chip bg-warmth-400/20 text-warmth-600">Amis seulement</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await services.deleteRecommendation(r.id);
                    load();
                  }}
                  className="text-sm text-ink/40 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecoForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState(user?.profile?.city ?? '');
  const [type, setType] = useState<RecommendationType>(RecommendationType.PERSON);
  const [visibility, setVisibility] = useState<RecommendationVisibility>(
    RecommendationVisibility.FRIENDS_OF_FRIENDS,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    services.getCategories().then(setCategories);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await services.createRecommendation({
        categoryId,
        title,
        description: description || undefined,
        city: city || undefined,
        type,
        visibility,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <p className="font-medium">Tu connais quelqu&apos;un de fiable dans quel domaine ?</p>
      <div>
        <label className="label">Domaine</label>
        <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          <option value="">Choisir…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Tu connais…</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. un bon ostéo"
          required
        />
      </div>
      <div>
        <label className="label">Précisions (facultatif)</label>
        <textarea
          className="input min-h-[70px] resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Pourquoi tu le recommandes…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Ville</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as RecommendationType)}
          >
            {Object.values(RecommendationType).map((t) => (
              <option key={t} value={t}>
                {RECOMMENDATION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Qui peut la voir ?</label>
        <select
          className="input"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as RecommendationVisibility)}
        >
          <option value={RecommendationVisibility.FRIENDS_OF_FRIENDS}>Mes amis et leurs amis</option>
          <option value={RecommendationVisibility.FRIENDS}>Mes amis seulement</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Enregistrement…' : 'Déclarer la recommandation'}
      </button>
    </form>
  );
}
