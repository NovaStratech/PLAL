'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { Avatar, CameraIcon, CheckIcon } from '@/components/ui';
import { ApiError, getToken } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import { useToast } from '@/components/toast';

export default function ProfilPage() {
  return (
    <AppShell>
      <Profil />
    </AppShell>
  );
}

function Profil() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.profile?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.profile?.lastName ?? '');
  const [city, setCity] = useState(user?.profile?.city ?? '');
  const [country, setCountry] = useState(user?.profile?.country ?? '');
  const [photoUrl, setPhotoUrl] = useState(user?.profile?.photoUrl ?? '');
  const [bio, setBio] = useState(user?.profile?.bio ?? '');

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modified, setModified] = useState(false);

  const currentPhotoUrl = previewUrl ?? photoUrl;
  const hasPendingPhoto = previewUrl !== null && previewUrl !== photoUrl;

  const handleFieldChange = () => setModified(true);

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
      setPreviewUrl(null);
      setModified(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.');
    } finally {
      setLoading(false);
    }
  }

  const handleUploadComplete = useCallback(
    (res: { url: string }[]) => {
      const url = res?.[0]?.url;
      if (url) {
        setPhotoUrl(url);
        setPreviewUrl(null);
        setUploading(false);
        setModified(true);
        toast('Photo uploadée ! Enregistre pour confirmer.', 'success');
      }
    },
    [toast],
  );

  const handleUploadError = useCallback(
    (err: Error) => {
      setUploading(false);
      toast(err.message || "Erreur lors de l'upload.", 'error');
    },
    [toast],
  );

  // Drag & drop sur l'avatar
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setModified(true);
      toast('Image déposée ! Enregistre pour confirmer.', 'info');
    }
  }, [toast]);

  const handleAvatarClick = useCallback(() => {
    // On utilise un input file caché pour la sélection rapide depuis l'avatar
    // L'upload réel se fait via UploadButton, mais on simule un clic
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setModified(true);
      toast('Image sélectionnée ! Utilise Upload ci-dessous pour finaliser.', 'info');
    }
    // Reset pour permettre de resélectionner le même fichier
    e.target.value = '';
  }, [toast]);

  const charCount = bio.length;
  const charLimit = 280;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mon profil</h1>
          <p className="mt-1 text-sm text-ink/60">
            {modified ? 'Modifications non enregistrées' : 'À jour ✓'}
          </p>
        </div>
        <Link href="/parametres" className="text-sm font-medium text-trust-700 hover:underline">
          Paramètres
        </Link>
      </div>

      {/* Avatar section — cliquable + drag & drop */}
      <div
        className="card flex flex-col items-center gap-5 sm:flex-row"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className="relative"
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}
        >
          {uploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-ink/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}

          {avatarHover && !uploading && (
            <div
              onClick={handleAvatarClick}
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-full bg-ink/50 transition-all hover:bg-ink/60"
            >
              <CameraIcon className="h-7 w-7 text-white" />
            </div>
          )}

          <Avatar
            firstName={firstName || '?'}
            lastName={lastName}
            photoUrl={currentPhotoUrl}
            size={96}
            onClick={handleAvatarClick}
          />

          {hasPendingPhoto && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-warmth-500 text-[10px] text-white">
              !
            </span>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-xl font-semibold">
            {firstName} {lastName}
          </p>
          <p className="text-sm text-ink/50">{user?.email}</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <UploadButton
              endpoint="avatar"
              headers={{ Authorization: `Bearer ${getToken() ?? ''}` }}
              onUploadBegin={() => setUploading(true)}
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              appearance={{
                button({ ready }) {
                  return `btn-secondary !rounded-full !px-4 !py-1.5 !text-xs !font-medium${!ready ? ' !opacity-50' : ''}`;
                },
                container: 'inline-flex',
                allowedContent: 'hidden',
              }}
            />
            <span className="text-xs text-ink/40">PNG, JPG, WebP · 2 Mo max</span>
          </div>
        </div>
      </div>

      {/* Input file caché pour clic sur l'avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload progress bar */}
      {uploading && (
        <div className="overflow-hidden rounded-full bg-sand">
          <div
            className="h-2 animate-pulse rounded-full bg-trust-500 transition-all duration-500"
            style={{ width: '60%' }}
          />
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={save} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="firstName">Prénom</label>
            <input
              id="firstName"
              className="input"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); handleFieldChange(); }}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="lastName">Nom</label>
            <input
              id="lastName"
              className="input"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); handleFieldChange(); }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="city">Ville</label>
            <input
              id="city"
              className="input"
              value={city}
              onChange={(e) => { setCity(e.target.value); handleFieldChange(); }}
              placeholder="Ex. Montréal"
            />
          </div>
          <div>
            <label className="label" htmlFor="country">Pays</label>
            <input
              id="country"
              className="input"
              value={country}
              onChange={(e) => { setCountry(e.target.value); handleFieldChange(); }}
              placeholder="Canada"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label !mb-0" htmlFor="bio">Bio</label>
            <span className={`text-xs ${charCount > charLimit ? 'text-red-500' : 'text-ink/40'}`}>
              {charCount}/{charLimit}
            </span>
          </div>
          <textarea
            id="bio"
            className="input min-h-[90px] resize-none"
            value={bio}
            onChange={(e) => { setBio(e.target.value); handleFieldChange(); }}
            placeholder="Quelques mots sur toi… les gens que tu connais, ce qui te passionne."
            maxLength={charLimit}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-trust-50 px-4 py-3 text-sm font-medium text-trust-700">
            <CheckIcon className="h-4 w-4" />
            Profil enregistré
          </div>
        )}

        <button
          type="submit"
          className={`btn-primary w-full py-3 transition-all ${loading ? 'opacity-70' : ''}`}
          disabled={loading || !modified}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Enregistrement…
            </span>
          ) : (
            'Enregistrer'
          )}
        </button>
      </form>
    </div>
  );
}
