'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Friendship, IntroductionRequest, Recommendation } from '@plal/shared';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { EmptyState, Spinner } from '@/components/ui';

export default function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [incoming, setIncoming] = useState<Friendship[]>([]);
  const [recos, setRecos] = useState<Recommendation[]>([]);
  const [received, setReceived] = useState<IntroductionRequest[]>([]);

  useEffect(() => {
    Promise.all([
      services.getFriends(),
      services.getIncomingRequests(),
      services.getMyRecommendations(),
      services.getReceivedIntroductions(),
    ])
      .then(([f, i, r, rec]) => {
        setFriends(f);
        setIncoming(i);
        setRecos(r);
        setReceived(rec.filter((x) => x.status === 'pending'));
      })
      .finally(() => setLoading(false));
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/rechercher?q=${encodeURIComponent(query.trim())}`);
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold">
          Bonjour {user?.profile?.firstName} 👋
        </h1>
        <p className="mt-1 text-ink/60">Qui dans ton réseau peut t&apos;aider aujourd&apos;hui ?</p>
      </div>

      {/* Central search */}
      <form onSubmit={submitSearch} className="card bg-trust-700">
        <label className="text-sm font-medium text-trust-50">
          De quoi as-tu besoin ?
        </label>
        <div className="mt-3 flex gap-2">
          <input
            className="input flex-1 border-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex. un bon ostéo, un garagiste fiable…"
          />
          <button type="submit" className="rounded-xl bg-white px-5 font-semibold text-trust-700">
            Chercher
          </button>
        </div>
        <p className="mt-2 text-xs text-trust-100/80">
          On cherche parmi tes amis et leurs amis.
        </p>
      </form>

      {/* Demandes reçues */}
      {received.length > 0 && (
        <Section title={`Demandes de mise en relation (${received.length})`} href="/demandes">
          {received.slice(0, 3).map((r) => (
            <Link
              key={r.id}
              href="/demandes"
              className="flex items-center justify-between rounded-xl border border-warmth-400/30 bg-warmth-400/10 p-3"
            >
              <span className="text-sm">
                <strong>{r.requester.firstName}</strong> cherche {r.recommendation.title}
              </span>
              <span className="chip bg-warmth-400/30 text-warmth-600">À répondre</span>
            </Link>
          ))}
        </Section>
      )}

      {/* Demandes d'amis */}
      {incoming.length > 0 && (
        <Section title={`Demandes d'amis (${incoming.length})`} href="/amis">
          {incoming.slice(0, 3).map((f) => (
            <Link key={f.id} href="/amis" className="rounded-xl border border-sand bg-white p-3 text-sm">
              <strong>{f.friend.firstName}</strong> souhaite t&apos;ajouter
            </Link>
          ))}
        </Section>
      )}

      {/* Quick stats / nudges */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Tes amis" value={friends.length} href="/amis" cta="Ajouter des amis" />
        <StatCard
          label="Tes recommandations"
          value={recos.length}
          href="/recommandations"
          cta="Déclarer une reco"
        />
      </div>

      {recos.length === 0 && (
        <EmptyState
          title="Tu ne connais personne de fiable ? Impossible 😄"
          hint="Déclare au moins une recommandation pour aider ton réseau."
        />
      )}
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-medium text-trust-700">
          Voir tout
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  href,
  cta,
}: {
  label: string;
  value: number;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="card flex flex-col justify-between">
      <div>
        <p className="text-3xl font-bold text-trust-700">{value}</p>
        <p className="text-sm text-ink/60">{label}</p>
      </div>
      <p className="mt-3 text-sm font-medium text-trust-700">{cta} →</p>
    </Link>
  );
}
