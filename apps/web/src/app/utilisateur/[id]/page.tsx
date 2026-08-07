'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { RECOMMENDATION_TYPE_LABELS } from '@plal/shared';
import { services, type PublicUserProfile } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { Avatar, EmptyState, Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { ApiError } from '@/lib/api';

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    if (id === user?.id) {
      router.replace('/profil');
      return;
    }
    services
      .getPublicProfile(id)
      .then(setProfile)
      .catch((err) => {
        toast(err instanceof ApiError ? err.message : 'Profil introuvable.', 'error');
      })
      .finally(() => setLoading(false));
  }, [id, user?.id, router, toast]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <EmptyState title="Profil introuvable." hint="Cet utilisateur n'existe pas ou n'est pas accessible." />
      </AppShell>
    );
  }

  const p = profile.profile;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="card flex items-start gap-4">
          <Avatar firstName={p.firstName} lastName={p.lastName} photoUrl={p.photoUrl} size={80} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold">
              {p.firstName} {p.lastName ?? ''}
            </h1>
            {p.city && <p className="text-ink/60">{p.city}</p>}
            {p.bio && <p className="mt-2 text-sm text-ink/80">{p.bio}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RelationBadge relation={profile.relation} />
              {profile.mutualFriendsCount > 0 && (
                <span className="chip bg-sand text-ink/60">
                  {profile.mutualFriendsCount} ami{profile.mutualFriendsCount > 1 ? 's' : ''} en commun
                </span>
              )}
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-3 font-semibold">Recommandations publiques</h2>
          {profile.recommendations.length === 0 ? (
            <EmptyState
              title="Aucune recommandation publique."
              hint="Les recommandations de cet ami apparaîtront ici quand il en aura déclaré."
            />
          ) : (
            <div className="space-y-3">
              {profile.recommendations.map((r) => (
                <div key={r.id} className="card">
                  <p className="font-semibold">{r.title}</p>
                  {r.description && <p className="mt-1 text-sm text-ink/60">{r.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip bg-sand text-ink/70">{r.category.name}</span>
                    <span className="chip bg-sand text-ink/60">{RECOMMENDATION_TYPE_LABELS[r.type]}</span>
                    {r.city && <span className="chip bg-sand text-ink/60">{r.city}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function RelationBadge({ relation }: { relation: PublicUserProfile['relation'] }) {
  const classes: Record<PublicUserProfile['relation'], string> = {
    self: 'bg-trust-100 text-trust-700',
    friend: 'bg-trust-100 text-trust-700',
    pending: 'bg-warmth-400/20 text-warmth-600',
    none: 'bg-sand text-ink/60',
  };
  const labels: Record<PublicUserProfile['relation'], string> = {
    self: 'Toi',
    friend: 'Ami',
    pending: 'En attente',
    none: 'Pas encore ami',
  };
  return <span className={`chip ${classes[relation]}`}>{labels[relation]}</span>;
}
