'use client';

import { useEffect, useState } from 'react';
import type { IntroductionRequest } from '@plal/shared';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { Avatar, EmptyState, Spinner } from '@/components/ui';
import { CardSkeleton, ListSkeleton } from '@/components/skeleton';

export default function DemandesPage() {
  return (
    <AppShell>
      <Demandes />
    </AppShell>
  );
}

function Demandes() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<IntroductionRequest[]>([]);
  const [sent, setSent] = useState<IntroductionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [r, s] = await Promise.all([
      services.getReceivedIntroductions(),
      services.getSentIntroductions(),
    ]);
    setReceived(r);
    setSent(s);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Demandes de mise en relation</h1>
        <p className="mt-1 text-ink/60">Tu décides toujours si tu mets en relation.</p>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === 'received'} onClick={() => setTab('received')}>
          Reçues ({received.filter((r) => r.status === 'pending').length})
        </TabButton>
        <TabButton active={tab === 'sent'} onClick={() => setTab('sent')}>
          Envoyées ({sent.length})
        </TabButton>
      </div>

      {loading ? (
        <ListSkeleton count={3} />
      ) : tab === 'received' ? (
        <ReceivedList items={received} onChanged={load} />
      ) : (
        <SentList items={sent} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        active ? 'bg-trust-700 text-white' : 'bg-sand text-ink/60'
      }`}
    >
      {children}
    </button>
  );
}

function ReceivedList({
  items,
  onChanged,
}: {
  items: IntroductionRequest[];
  onChanged: () => void;
}) {
  if (items.length === 0) {
    return <EmptyState title="Aucune demande reçue." hint="Quand quelqu'un de ton réseau a besoin de toi, ça apparaît ici." />;
  }
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <ReceivedCard key={r.id} item={r} onChanged={onChanged} />
      ))}
    </div>
  );
}

function ReceivedCard({ item, onChanged }: { item: IntroductionRequest; onChanged: () => void }) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = item.status === 'pending';

  async function respond(action: 'accept' | 'decline') {
    setLoading(true);
    try {
      await services.respondIntroduction(item.id, action, response || undefined);
      onChanged();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Avatar firstName={item.requester.firstName} lastName={item.requester.lastName} photoUrl={item.requester.photoUrl} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.requester.firstName}</p>
          <p className="text-sm text-ink/60">
            cherche <strong className="text-ink">{item.recommendation.title}</strong>
            {item.recommendation.city && ` à ${item.recommendation.city}`}
          </p>
          <p className="mt-2 rounded-xl bg-sand/60 px-3 py-2 text-sm">{item.message}</p>
        </div>
      </div>

      {pending ? (
        <div className="mt-4 space-y-3">
          <textarea
            className="input min-h-[60px] resize-none"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Message (ex. les coordonnées, ou « je te présente par email »)"
          />
          <div className="flex gap-3">
            <button onClick={() => respond('decline')} className="btn-secondary flex-1" disabled={loading}>
              Décliner
            </button>
            <button onClick={() => respond('accept')} className="btn-primary flex-1" disabled={loading}>
              Mettre en relation
            </button>
          </div>
        </div>
      ) : (
        <p
          className={`mt-3 chip ${
            item.status === 'accepted'
              ? 'bg-trust-100 text-trust-700'
              : 'bg-sand text-ink/50'
          }`}
        >
          {item.status === 'accepted' ? 'Mise en relation acceptée' : 'Déclinée'}
        </p>
      )}
    </div>
  );
}

function SentList({ items }: { items: IntroductionRequest[] }) {
  if (items.length === 0) {
    return <EmptyState title="Tu n'as pas encore demandé de mise en relation." hint="Cherche dans ton réseau et demande à être mis en relation." />;
  }
  return (
    <div className="space-y-3">
      {items.map((r) => (
        <div key={r.id} className="card">
          <div className="flex items-start gap-3">
            <Avatar firstName={r.recommender.firstName} lastName={r.recommender.lastName} photoUrl={r.recommender.photoUrl} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink/60">
                Demande à <strong className="text-ink">{r.recommender.firstName}</strong> pour{' '}
                <strong className="text-ink">{r.recommendation.title}</strong>
              </p>
              <span
                className={`mt-2 chip ${
                  r.status === 'accepted'
                    ? 'bg-trust-100 text-trust-700'
                    : r.status === 'declined'
                      ? 'bg-sand text-ink/50'
                      : 'bg-warmth-400/20 text-warmth-600'
                }`}
              >
                {r.status === 'accepted' ? 'Acceptée' : r.status === 'declined' ? 'Déclinée' : 'En attente'}
              </span>
              {r.responseMessage && (
                <p className="mt-2 rounded-xl bg-trust-50 px-3 py-2 text-sm text-trust-700">
                  {r.recommender.firstName} : {r.responseMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
