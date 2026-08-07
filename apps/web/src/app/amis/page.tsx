'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Friendship } from '@plal/shared';
import { services, type UserSearchResult } from '@/lib/services';
export type { UserSearchResult };
import { AppShell } from '@/components/app-shell';
import { Avatar, EmptyState } from '@/components/ui';
import { ListSkeleton } from '@/components/skeleton';
import { useToast } from '@/components/toast';
import { ApiError } from '@/lib/api';

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
  const [blocked, setBlocked] = useState<Friendship[]>([]);
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    const [f, i, o, b, s] = await Promise.all([
      services.getFriends(),
      services.getIncomingRequests(),
      services.getOutgoingRequests(),
      services.getBlockedFriends(),
      services.getFriendSuggestions(),
    ]);
    setFriends(f);
    setIncoming(i);
    setOutgoing(o);
    setBlocked(b);
    setSuggestions(s);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function respond(id: string, action: 'accept' | 'reject') {
    try {
      await services.respondFriendRequest(id, action);
      toast(action === 'accept' ? 'Ami ajouté !' : 'Demande refusée.', 'success');
      load();
    } catch {
      toast('Erreur lors de la réponse.', 'error');
    }
  }

  async function block(friendUserId: string) {
    try {
      await services.blockFriend(friendUserId);
      toast('Ami bloqué.', 'info');
      load();
    } catch {
      toast('Erreur lors du blocage.', 'error');
    }
  }

  async function unblock(friendUserId: string) {
    try {
      await services.unblockFriend(friendUserId);
      toast('Ami débloqué.', 'success');
      load();
    } catch {
      toast('Erreur lors du déblocage.', 'error');
    }
  }

  if (loading) return <ListSkeleton count={4} />;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold">Mon réseau</h1>
        <p className="mt-1 text-ink/60">Plus ton réseau est riche, plus tu trouves la bonne personne.</p>
      </div>

      <AddFriends onChanged={load} />

      <InviteFriends />

      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Suggestions d&apos;amis ({suggestions.length})</h2>
          <p className="mb-2 text-sm text-ink/60">Des gens que tu pourrais connaître via ton réseau.</p>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.userId} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3">
                <Link href={`/utilisateur/${s.userId}`}>
                  <Avatar firstName={s.firstName} lastName={s.lastName} photoUrl={s.photoUrl} size={40} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/utilisateur/${s.userId}`} className="truncate font-medium hover:text-trust-700">
                    {s.firstName} {s.lastName ?? ''}
                  </Link>
                  {s.mutualFriends ? (
                    <p className="text-xs text-ink/50">{s.mutualFriends} ami{s.mutualFriends > 1 ? 's' : ''} en commun</p>
                  ) : s.city ? (
                    <p className="text-xs text-ink/50">{s.city}</p>
                  ) : null}
                </div>
                <AddFriendButton userId={s.userId} onChanged={load} />
              </div>
            ))}
          </div>
        </section>
      )}

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Demandes reçues ({incoming.length})</h2>
          <div className="space-y-2">
            {incoming.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3">
                <Link href={`/utilisateur/${f.friend.userId}`}>
                  <Avatar firstName={f.friend.firstName} lastName={f.friend.lastName} photoUrl={f.friend.photoUrl} size={40} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/utilisateur/${f.friend.userId}`} className="truncate font-medium hover:text-trust-700">
                    {f.friend.firstName} {f.friend.lastName ?? ''}
                  </Link>
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
                <Link href={`/utilisateur/${f.friend.userId}`}>
                  <Avatar firstName={f.friend.firstName} lastName={f.friend.lastName} photoUrl={f.friend.photoUrl} size={40} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/utilisateur/${f.friend.userId}`} className="truncate font-medium hover:text-trust-700">
                    {f.friend.firstName} {f.friend.lastName ?? ''}
                  </Link>
                  {f.friend.city && <p className="text-xs text-ink/50">{f.friend.city}</p>}
                </div>
                <button onClick={() => block(f.friend.userId)} className="text-sm text-ink/40 hover:text-red-600">
                  Bloquer
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {blocked.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Bloqués ({blocked.length})</h2>
          <div className="space-y-2">
            {blocked.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3 opacity-60">
                <Link href={`/utilisateur/${f.friend.userId}`}>
                  <Avatar firstName={f.friend.firstName} lastName={f.friend.lastName} photoUrl={f.friend.photoUrl} size={40} />
                </Link>
                <Link href={`/utilisateur/${f.friend.userId}`} className="flex-1 truncate font-medium hover:text-trust-700">
                  {f.friend.firstName} {f.friend.lastName ?? ''}
                </Link>
                <button onClick={() => unblock(f.friend.userId)} className="text-sm text-ink/60 hover:text-trust-700">
                  Débloquer
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Demandes envoyées ({outgoing.length})</h2>
          <div className="space-y-2">
            {outgoing.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3 opacity-70">
                <Link href={`/utilisateur/${f.friend.userId}`}>
                  <Avatar firstName={f.friend.firstName} lastName={f.friend.lastName} photoUrl={f.friend.photoUrl} size={40} />
                </Link>
                <Link href={`/utilisateur/${f.friend.userId}`} className="flex-1 truncate font-medium hover:text-trust-700">
                  {f.friend.firstName} {f.friend.lastName ?? ''}
                </Link>
                <span className="chip bg-sand text-ink/50">En attente</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AddFriendButton({ userId, onChanged }: { userId: string; onChanged: () => void }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function add() {
    setLoading(true);
    try {
      await services.sendFriendRequest(userId);
      setSent(true);
      toast('Demande d\'ami envoyée !', 'success');
      onChanged();
    } catch {
      toast('Impossible d\'envoyer la demande.', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <span className="chip bg-sand text-ink/50">Envoyé</span>;
  }

  return (
    <button onClick={add} disabled={loading} className="btn-secondary px-3 py-1.5 text-xs">
      {loading ? 'Envoi…' : 'Ajouter'}
    </button>
  );
}

function AddFriends({ onChanged }: { onChanged: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const toast = useToast();

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
    try {
      await services.sendFriendRequest(userId);
      setSent((s) => new Set(s).add(userId));
      toast('Demande d\'ami envoyée !', 'success');
      onChanged();
    } catch {
      toast('Impossible d\'envoyer la demande.', 'error');
    }
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
              <Link href={`/utilisateur/${r.userId}`}>
                <Avatar firstName={r.firstName} lastName={r.lastName} photoUrl={r.photoUrl} size={36} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/utilisateur/${r.userId}`} className="truncate font-medium hover:text-trust-700">
                  {r.firstName} {r.lastName ?? ''}
                </Link>
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
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
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

  async function generateWithEmail() {
    if (!email.trim()) return;
    setEmailLoading(true);
    setEmailError("");
    try {
      await services.createInvitation(email.trim());
      setSentEmail(true);
      setEmail("");
      toast("Invitation envoyee !", "success");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Envoi impossible.";
      setEmailError(msg);
      toast(msg, "error");
    } finally {
      setEmailLoading(false);
    }
  }

  async function share() {
    if (!link) return;
    const shareData = {
      title: "Rejoins-moi sur PLAL",
      text: "Rejoins mon reseau de confiance sur PLAL.",
      url: link,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fallback
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Lien copie !", "success");
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="card space-y-4">
      <label className="label">Inviter un ami qui n&apos;est pas encore sur PLAL</label>
      <p className="text-sm text-ink/60">
        Ton ami devient automatiquement ton ami a son inscription.
      </p>

      {/* Invitation par email */}
      {!sentEmail ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email de ton ami"
            />
            <button
              onClick={generateWithEmail}
              className="btn-primary whitespace-nowrap px-4 py-2 text-sm"
              disabled={emailLoading || !email.trim()}
            >
              {emailLoading ? "Envoi..." : "Inviter"}
            </button>
          </div>
          {emailError && <p className="text-sm text-red-600">{emailError}</p>}
        </div>
      ) : (
        <div className="rounded-xl bg-trust-50 px-4 py-3 text-sm text-trust-700">
          Invitation envoyee !
        </div>
      )}

      {/* Separateur */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sand" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-ink/40">ou</span>
        </div>
      </div>

      {/* Lien d'invitation */}
      {!link ? (
        <button onClick={generate} disabled={loading} className="btn-secondary w-full px-4 py-2 text-sm">
          {loading ? "Generation..." : "Generer un lien d'invitation"}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input className="input flex-1" value={link} readOnly onFocus={(e) => e.target.select()} />
            <button onClick={share} className="btn-primary whitespace-nowrap px-3 py-2 text-xs">
              {copied ? "Copie !" : "Copier"}
            </button>
          </div>
          <button onClick={generate} disabled={loading} className="text-xs text-ink/40 hover:text-trust-700">
            Generer un nouveau lien
          </button>
        </div>
      )}
    </div>
  )
}


