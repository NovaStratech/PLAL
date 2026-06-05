'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NotificationType, type NotificationItem } from '@plal/shared';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { EmptyState, Spinner } from '@/components/ui';
import { CardSkeleton } from '@/components/skeleton';

export default function NotificationsPage() {
  return (
    <AppShell>
      <Notifications />
    </AppShell>
  );
}

function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  async function load() {
    const data = await services.getNotifications();
    setItems(data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function markAll() {
    setMarking(true);
    try {
      await services.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setMarking(false);
    }
  }

  async function markOne(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await services.markNotificationRead(id);
    } catch {
      // revert on failure
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-ink/60">
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tu es à jour.'}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn-ghost text-sm" onClick={markAll} disabled={marking}>
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          hint="Tu seras prévenu·e ici des demandes d'amis et des mises en relation."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationRow key={n.id} item={n} onRead={() => markOne(n.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: () => void }) {
  const { text, href } = describe(item);
  const content = (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
        item.read ? 'border-sand bg-white/50' : 'border-trust-200 bg-trust-100/40'
      }`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          item.read ? 'bg-transparent' : 'bg-trust-600'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink/80">{text}</p>
        <p className="mt-1 text-xs text-ink/40">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link href={href} onClick={onRead} className="block">
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button onClick={onRead} className="block w-full text-left">
        {content}
      </button>
    </li>
  );
}

function describe(item: NotificationItem): { text: string; href: string | null } {
  const name = (item.payload?.fromName as string) ?? 'Quelqu\u2019un';
  switch (item.type) {
    case NotificationType.FRIEND_REQUEST:
      return { text: `${name} souhaite rejoindre ton réseau.`, href: '/amis' };
    case NotificationType.FRIEND_REQUEST_ACCEPTED:
      return { text: `${name} a accepté ta demande d'ami.`, href: '/amis' };
    case NotificationType.INTRODUCTION_REQUEST:
      return { text: `${name} te demande une mise en relation.`, href: '/demandes' };
    case NotificationType.INTRODUCTION_ACCEPTED:
      return { text: `${name} a accepté ta demande de mise en relation.`, href: '/demandes' };
    case NotificationType.INTRODUCTION_DECLINED:
      return { text: `${name} a décliné ta demande de mise en relation.`, href: '/demandes' };
    case NotificationType.INVITATION_ACCEPTED:
      return { text: `${name} a rejoint PLAL grâce à ton invitation. Vous êtes désormais amis.`, href: '/amis' };
    default:
      return { text: 'Nouvelle notification.', href: null };
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
