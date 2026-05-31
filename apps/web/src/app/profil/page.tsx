'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { Avatar } from '@/components/ui';
import { ApiError } from '@/lib/api';

export default function ProfilPage() {
  return (
    <AppShell>
      <Profil />
    </AppShell>
  );
}

function Profil() {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.profile?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.profile?.lastName ?? '');
  const [city, setCity] = useState(user?.profile?.city ?? '');
  const [country, setCountry] = useState(user?.profile?.country ?? '');
  const [photoUrl, setPhotoUrl] = useState(user?.profile?.photoUrl ?? '');
  const [bio, setBio] = useState(user?.profile?.bio ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const updated = await services.updateProfile({
        firstName,
        lastName: lastName || null,
        city: city || null,
        country: country || null,
        photoUrl: photoUrl || null,
        bio: bio || null,
      });
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mon profil</h1>
        <Link href="/parametres" className="text-sm font-medium text-trust-700">
          Paramètres
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Avatar firstName={firstName || '?'} lastName={lastName} photoUrl={photoUrl} size={64} />
        <div>
          <p className="font-semibold">
            {firstName} {lastName}
          </p>
          <p className="text-sm text-ink/50">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Prénom</label>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Nom</label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Ville</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="label">Pays</label>
            <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Photo (URL)</label>
          <input className="input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[80px] resize-none"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Quelques mots sur toi…"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm font-medium text-trust-700">✓ Profil enregistré</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
