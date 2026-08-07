'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, Category } from '@plal/shared';
import { RecommendationType } from '@plal/shared';
import { useAuth } from '@/lib/auth-context';
import { services, type UserSearchResult } from '@/lib/services';
import { Avatar, Spinner } from '@/components/ui';
import { useToast } from '@/components/toast';
import { VersionBadge } from '@/components/version-badge';

export default function OnboardingPage() {
  const { user, loading, refresh, setUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user?.onboardingCompleted) router.replace('/dashboard');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl font-bold text-trust-700">PLAL</span>
          <VersionBadge />
        </div>
        {/* Progress */}
        <div className="mb-8 flex gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-trust-600' : 'bg-sand'}`}
            />
          ))}
        </div>

        {step === 1 && <StepCity onNext={() => setStep(2)} setUser={setUser} />}
        {step === 2 && <StepFriends onNext={() => setStep(3)} />}
        {step === 3 && <StepRecommendation onNext={() => setStep(4)} />}
        {step === 4 && (
          <StepInvite
            onFinish={async () => {
              await services.updateProfile({ onboardingCompleted: true });
              await refresh();
              router.push('/dashboard');
            }}
          />
        )}
      </div>
    </main>
  );
}

function StepCity({ onNext, setUser }: { onNext: () => void; setUser: (u: AuthUser) => void }) {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.profile?.city ?? '');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const updated = await services.updateProfile({ city });
      setUser(updated);
      onNext();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dans quelle ville es-tu principalement actif ?</h1>
      <p className="mt-2 text-ink/60">Ça nous aide à rendre tes recommandations plus locales.</p>
      <input
        className="input mt-6"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Ex. Montréal"
        autoFocus
      />
      <div className="mt-6 flex justify-between">
        <button onClick={onNext} className="btn-ghost">
          Passer
        </button>
        <button onClick={save} className="btn-primary" disabled={loading || !city.trim()}>
          Continuer
        </button>
      </div>
    </div>
  );
}

function StepFriends({ onNext }: { onNext: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    services.getFriendSuggestions().then(setSuggestions);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await services.searchUsers(query));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function add(userId: string) {
    await services.sendFriendRequest(userId);
    setSent((s) => new Set(s).add(userId));
  }

  function UserRow({ r }: { r: UserSearchResult }) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3">
        <Avatar firstName={r.firstName} lastName={r.lastName} photoUrl={r.photoUrl} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {r.firstName} {r.lastName ?? ''}
          </p>
          {r.mutualFriends ? (
            <p className="text-xs text-ink/50">{r.mutualFriends} ami{r.mutualFriends > 1 ? 's' : ''} en commun</p>
          ) : r.city ? (
            <p className="text-xs text-ink/50">{r.city}</p>
          ) : null}
        </div>
        {r.relation === 'friend' ? (
          <span className="chip bg-trust-100 text-trust-700">Ami</span>
        ) : r.relation === 'pending' || sent.has(r.userId) ? (
          <span className="chip bg-sand text-ink/50">Envoyé</span>
        ) : (
          <button onClick={() => add(r.userId)} className="btn-secondary px-3 py-1.5 text-xs">
            Ajouter
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Ajoute quelques personnes que tu connais.</h1>
      <p className="mt-2 text-ink/60">Ton réseau est la base de tout. Invite tes proches.</p>
      <input
        className="input mt-6"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par prénom ou email"
        autoFocus
      />

      <div className="mt-4 space-y-2">
        {searching && <p className="text-sm text-ink/40">Recherche…</p>}
        {results.map((r) => (
          <UserRow key={r.userId} r={r} />
        ))}
        {query.trim().length < 2 && suggestions.length > 0 && (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink/50">
              Suggestions
            </p>
            {suggestions.map((r) => (
              <UserRow key={r.userId} r={r} />
            ))}
          </>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onNext} className="btn-ghost">
          Passer
        </button>
        <button onClick={onNext} className="btn-primary">
          Continuer
        </button>
      </div>
    </div>
  );
}

function StepRecommendation({ onNext }: { onNext: () => void }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    services.getCategories().then((c) => {
      setCategories(c);
    });
  }, []);

  async function next() {
    setLoading(true);
    try {
      if (categoryId && title.trim()) {
        await services.createRecommendation({
          categoryId,
          title,
          city: user?.profile?.city ?? undefined,
          type: RecommendationType.PERSON,
        });
      }
      onNext();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dans quels domaines connais-tu quelqu&apos;un de fiable ?</h1>
      <p className="mt-2 text-ink/60">Déclare une première recommandation (facultatif).</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label">Domaine</label>
          <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Choisir un domaine…</option>
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
          />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onNext} className="btn-ghost">
          Passer
        </button>
        <button onClick={next} className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Continuer'}
        </button>
      </div>
    </div>
  );
}

function StepInvite({ onFinish }: { onFinish: () => void }) {
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const toast = useToast();

  async function generate() {
    setLoading(true);
    try {
      const invitation = await services.createInvitation();
      setLink(invitation.url);
      setCopied(false);
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite() {
    if (!email.trim()) return;
    setEmailLoading(true);
    try {
      await services.createInvitation(email.trim());
      setSentEmail(true);
      setEmail('');
      toast('Invitation envoyée !', 'success');
    } catch {
      toast('Impossible d\'envoyer l\'invitation.', 'error');
    } finally {
      setEmailLoading(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast('Lien copié !', 'success');
    } catch {
      toast('Impossible de copier le lien.', 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Invite tes proches.</h1>
      <p className="mt-2 text-ink/60">Plus ton réseau est riche, plus PLAL devient utile.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label">Envoyer une invitation par email</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
            <button
              onClick={sendInvite}
              disabled={emailLoading || !email.trim()}
              className="btn-secondary"
            >
              {emailLoading ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
          {sentEmail && (
            <p className="mt-2 text-sm text-trust-700">✓ Invitation envoyée.</p>
          )}
        </div>

        <div className="relative py-2 text-center text-xs text-ink/40">— ou —</div>

        <div>
          <label className="label">Partager ton lien d&apos;invitation</label>
          {!link ? (
            <button onClick={generate} disabled={loading} className="btn-secondary w-full">
              {loading ? 'Génération…' : 'Générer un lien'}
            </button>
          ) : (
            <div className="flex gap-2">
              <input className="input flex-1 text-ink/60" value={link} readOnly />
              <button onClick={copyLink} className="btn-secondary">
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onFinish} className="btn-primary">
          Terminer
        </button>
      </div>
    </div>
  );
}
