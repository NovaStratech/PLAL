'use client';

import { useEffect, useState } from 'react';
import type { Friendship } from '@plal/shared';
import { services, type UserSearchResult } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { Avatar, EmptyState, Spinner } from '@/components/ui';

export default function AmisPage() {
  return (
    <AppShell>
      <Amis />
    </AppShell>
  );
}

function Amis() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [incoming, setIncoming] = useState<Friendship[]>([]);
  const [outgoing, setOutgoing] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [f, i, o] = await Promise.all([
      services.getFriends(),
      services.getIncomingRequests(),
      services.getOutgoingRequests(),
    ]);
    setFriends(f);
    setIncoming(i);
    setOutgoing(o);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function respond(id: string, action: 'accept' | 'reject') {
    await services.respondFriendRequest(id, action);
    load();
  }

  async function remove(id: string) {
    await services.removeFriend(id);
    load();
  }

  if (loading) return <AppShellSpinner />;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold">Mon réseau</h1>
        <p className="mt-1 text-ink/60">Plus ton réseau est riche, plus tu trouves la bonne personne.</p>
      </div>

      <AddFriends onChanged={load} />

      <InviteFriends />

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Demandes reçues ({incoming.length})</h2>
          <div className="space-y-2">
            {incoming.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3">
                <Avatar firstName={f.friend.firstName} lastName={f.friend.lastName} photoUrl={f.friend.photoUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {f.friend.firstName} {f.friend.lastName ?? ''}
                  </p>
                  {f.friend.city && <p className="text-xs text-ink/50">{f.friend.city}</p>}
                </div>
                <button onClick={() => respond(f.id, 'accept')} className="btn-primary px-3 py-1.5 text-xs">
                  Accepter
                </button>
                <button onClick={() => respond(f.id, 'reject')} className="btn-ghost px-2 py-1.5 text-xs">
                  Refuser
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Mes amis ({friends.length})</h2>
        {friends.length === 0 ? (
          <EmptyState title="Tu n'as pas encore d'amis ici." hint="Recherche tes proches ci-dessus pour les ajouter." />
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3">
                <Avatar firstName={f.friend.firstName} lastName={f.friend.lastName} photoUrl={f.friend.photoUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {f.friend.firstName} {f.friend.lastName ?? ''}
                  </p>
                  {f.friend.city && <p className="text-xs text-ink/50">{f.friend.city}</p>}
                </div>
                <button onClick={() => remove(f.id)} className="text-sm text-ink/40 hover:text-red-600">
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Demandes envoyées ({outgoing.length})</h2>
          <div className="space-y-2">
            {outgoing.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3 opacity-70">
                <Avatar firstName={f.friend.firstName} lastName={f.friend.lastName} photoUrl={f.friend.photoUrl} size={40} />
                <p className="flex-1 truncate font-medium">
                  {f.friend.firstName} {f.friend.lastName ?? ''}
                </p>
                <span className="chip bg-sand text-ink/50">En attente</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AddFriends({ onChanged }: { onChanged: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);

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
    onChanged();
  }

  return (
    <div className="card">
      <label className="label">Ajouter des amis</label>
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par prénom ou email"
      />
      {searching && <p className="mt-2 text-sm text-ink/40">Recherche…</p>}
      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((r) => (
            <div key={r.userId} className="flex items-center gap-3">
              <Avatar firstName={r.firstName} lastName={r.lastName} photoUrl={r.photoUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.firstName} {r.lastName ?? ''}
                </p>
                {r.city && <p className="text-xs text-ink/50">{r.city}</p>}
              </div>
              {r.relation === 'self' ? (
                <span className="chip bg-sand text-ink/50">Toi</span>
              ) : r.relation === 'friend' ? (
                <span className="chip bg-trust-100 text-trust-700">Ami</span>
              ) : r.relation === 'pending' || sent.has(r.userId) ? (
                <span className="chip bg-sand text-ink/50">Envoyé</span>
              ) : (
                <button onClick={() => add(r.userId)} className="btn-secondary px-3 py-1.5 text-xs">
                  Ajouter
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InviteFriends() {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  async function share() {
    if (!link) return;
    const shareData = {
      title: 'Rejoins-moi sur PLAL',
      text: 'Rejoins mon réseau de confiance sur PLAL.',
      url: link,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // l'utilisateur a annulé le partage : on retombe sur la copie.
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="card">
      <label className="label">Inviter un ami qui n&apos;est pas encore sur PLAL</label>
      <p className="text-sm text-ink/60">
        Génère un lien personnel : ton ami devient automatiquement ton ami à son inscription.
      </p>
      {!link ? (
        <button onClick={generate} disabled={loading} className="btn-secondary mt-3 px-4 py-2 text-sm">
          {loading ? 'Génération…' : 'Générer un lien d’invitation'}
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input className="input flex-1" value={link} readOnly onFocus={(e) => e.target.select()} />
            <button onClick={share} className="btn-primary whitespace-nowrap px-3 py-2 text-xs">
              {copied ? 'Copié !' : 'Partager'}
            </button>
          </div>
          <button onClick={generate} disabled={loading} className="text-xs text-ink/40 hover:text-trust-700">
            Générer un nouveau lien
          </button>
        </div>
      )}
    </div>
  );
}

function AppShellSpinner() {
  return <Spinner />;
}
