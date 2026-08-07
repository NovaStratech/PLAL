'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { IntroductionRequest } from '@plal/shared';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { Avatar, EmptyState } from '@/components/ui';
import { IntroTimeline } from '@/components/intro-timeline';
import { ListSkeleton } from '@/components/skeleton';
import { useAuth } from '@/lib/auth-context';

export default function DemandesPage() {
  return (
    <AppShell>
      <Demandes />
    </AppShell>
  );
}

function Demandes() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<IntroductionRequest[]>([]);
  const [sent, setSent] = useState<IntroductionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      services.getReceivedIntroductions(),
      services.getSentIntroductions(),
    ]);
    setReceived(r);
    setSent(s);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Demandes de mise en relation</h1>
        <p className="mt-1 text-ink/60">Tu décides toujours si tu transmets ou mets en relation.</p>
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
        <ReceivedList items={received} currentUserId={user?.id} onChanged={load} />
      ) : (
        <SentList items={sent} currentUserId={user?.id} />
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
  currentUserId,
  onChanged,
}: {
  items: IntroductionRequest[];
  currentUserId?: string;
  onChanged: () => void;
}) {
  if (items.length === 0) {
    return <EmptyState title="Aucune demande reçue." hint="Quand quelqu'un de ton réseau a besoin de toi, ça apparaît ici." />;
  }
  return (
    <div className="space-y-4">
      {items.map((r) => (
        <ReceivedCard key={r.id} item={r} currentUserId={currentUserId} onChanged={onChanged} />
      ))}
    </div>
  );
}

function SentList({
  items,
  currentUserId,
}: {
  items: IntroductionRequest[];
  currentUserId?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title="Tu n'as pas encore demandé de mise en relation." hint="Cherche dans ton réseau et demande à être mis en relation." />;
  }
  return (
    <div className="space-y-4">
      {items.map((r) => (
        <SentCard key={r.id} item={r} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

function responseTypeLabel(type: IntroductionRequest['responseType']) {
  if (!type) return null;
  return { phone: 'téléphone', email: 'email', social: 'réseau social' }[type];
}

function statusChip(intro: IntroductionRequest) {
  const labels: Record<IntroductionRequest['status'], string> = {
    pending: 'En attente',
    accepted: 'Acceptée',
    declined: 'Déclinée',
  };
  const classes: Record<IntroductionRequest['status'], string> = {
    pending: 'bg-warmth-400/20 text-warmth-600',
    accepted: 'bg-trust-100 text-trust-700',
    declined: 'bg-sand text-ink/50',
  };
  return <span className={`chip ${classes[intro.status]}`}>{labels[intro.status]}</span>;
}

function ReceivedCard({
  item,
  currentUserId,
  onChanged,
}: {
  item: IntroductionRequest;
  currentUserId?: string;
  onChanged: () => void;
}) {
  const [response, setResponse] = useState('');
  const [responseType, setResponseType] = useState<IntroductionRequest['responseType']>(
    item.responseType ?? null,
  );
  const [responseValue, setResponseValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pending = item.status === 'pending';
  const isLastStep = item.currentStep ? item.currentStep.order >= item.steps.length : true;
  const requestedType = item.responseType ? responseTypeLabel(item.responseType) : null;

  async function respond(action: 'accept' | 'decline') {
    setLoading(true);
    try {
      await services.respondIntroduction(
        item.id,
        action,
        response || undefined,
        action === 'accept' && isLastStep ? responseType ?? undefined : undefined,
        action === 'accept' && isLastStep ? responseValue || undefined : undefined,
      );
      onChanged();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Link href={`/utilisateur/${item.requester.userId}`}>
          <Avatar firstName={item.requester.firstName} lastName={item.requester.lastName} photoUrl={item.requester.photoUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/utilisateur/${item.requester.userId}`} className="font-semibold hover:text-trust-700">
            {item.requester.firstName}
          </Link>
          <p className="text-sm text-ink/60">
            cherche <strong className="text-ink">{item.recommendation.title}</strong>
            {item.recommendation.city && ` à ${item.recommendation.city}`}
          </p>
          {requestedType && (
            <p className="mt-1 text-xs text-trust-700">
              Mode de réponse souhaité : {requestedType}
            </p>
          )}
          <p className="mt-2 rounded-xl bg-sand/60 px-3 py-2 text-sm">{item.message}</p>
        </div>
      </div>

      {pending ? (
        <div className="mt-4 space-y-3">
          <textarea
            className="input min-h-[60px] resize-none"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={
              isLastStep
                ? 'Message de mise en relation (ex. les coordonnées)'
                : 'Message de transmission (optionnel)'
            }
          />
          {isLastStep && (
            <div className="space-y-2">
              <label className="label" htmlFor={`resp-type-${item.id}`}>
                Type de réponse contrôlée
              </label>
              <select
                id={`resp-type-${item.id}`}
                className="input"
                value={responseType ?? ''}
                onChange={(e) => setResponseType((e.target.value || null) as IntroductionRequest['responseType'])}
              >
                <option value="">Choisir</option>
                <option value="phone">Téléphone</option>
                <option value="email">Email</option>
                <option value="social">Réseau social</option>
              </select>
              <input
                className="input"
                value={responseValue}
                onChange={(e) => setResponseValue(e.target.value)}
                placeholder={
                  responseType === 'phone'
                    ? 'Numéro de téléphone'
                    : responseType === 'email'
                      ? 'Adresse email'
                      : responseType === 'social'
                        ? 'Lien ou pseudo'
                        : 'Coordonnées'
                }
              />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => respond('decline')} className="btn-secondary flex-1" disabled={loading}>
              Décliner
            </button>
            <button onClick={() => respond('accept')} className="btn-primary flex-1" disabled={loading}>
              {isLastStep ? 'Mettre en relation' : 'Transmettre à mon ami'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          {statusChip(item)}
          {item.responseMessage && (
            <span className="text-xs text-ink/50">« {item.responseMessage} »</span>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 text-xs font-medium text-ink/50 hover:text-trust-700"
      >
        {expanded ? 'Masquer' : 'Voir'} la chaîne de confiance
      </button>

      {expanded && <IntroTimeline intro={item} currentUserId={currentUserId} />}
    </div>
  );
}

function SentCard({ item, currentUserId }: { item: IntroductionRequest; currentUserId?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Link href={`/utilisateur/${item.recommendation.helper.userId}`}>
          <Avatar firstName={item.recommendation.helper.firstName} lastName={item.recommendation.helper.lastName} photoUrl={item.recommendation.helper.photoUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink/60">
            Demande à <strong className="text-ink">{item.recommendation.helper.firstName}</strong> pour{' '}
            <strong className="text-ink">{item.recommendation.title}</strong>
            {item.recommendation.city && ` à ${item.recommendation.city}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {statusChip(item)}
            {item.responseType && (
              <span className="chip bg-sand text-ink/60 text-xs">
                Réponse {responseTypeLabel(item.responseType)}
              </span>
            )}
          </div>
          {item.responseValue && (
            <p className="mt-2 rounded-xl bg-trust-50 px-3 py-2 text-sm text-trust-700">
              {item.recommendation.helper.firstName} t&apos;a transmis : {item.responseValue}
            </p>
          )}
          {item.responseMessage && !item.responseValue && (
            <p className="mt-2 rounded-xl bg-trust-50 px-3 py-2 text-sm text-trust-700">
              {item.recommendation.helper.firstName} : {item.responseMessage}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 text-xs font-medium text-ink/50 hover:text-trust-700"
      >
        {expanded ? 'Masquer' : 'Voir'} la chaîne de confiance
      </button>

      {expanded && <IntroTimeline intro={item} currentUserId={currentUserId} />}
    </div>
  );
}
