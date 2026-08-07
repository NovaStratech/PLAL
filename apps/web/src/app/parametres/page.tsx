'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { services } from '@/lib/services';
import { AppShell } from '@/components/app-shell';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/toast';

export default function ParametresPage() {
  return (
    <AppShell>
      <Parametres />
    </AppShell>
  );
}

function Parametres() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Paramètres</h1>

      <div className="card space-y-1">
        <p className="label">Compte</p>
        <p className="font-medium">{user?.email}</p>
      </div>

      <div className="card space-y-3">
        <Link href="/profil" className="block font-medium text-trust-700">
          Modifier mon profil
        </Link>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="block font-medium text-trust-700"
        >
          Changer mon mot de passe
        </button>
        <button
          onClick={() => setShowEmailModal(true)}
          className="block font-medium text-trust-700"
        >
          Modifier mon adresse email
        </button>
      </div>

      <button onClick={handleLogout} className="btn-secondary w-full text-red-600">
        Se déconnecter
      </button>

      <p className="text-center text-xs text-ink/40">PLAL — Ton réseau de confiance.</p>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={user?.email ?? ''}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => {
            toast('Un email de confirmation t\'a été envoyé.', 'info');
            setShowEmailModal(false);
          }}
        />
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl border border-sand bg-cream p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      await services.changePassword(currentPassword, newPassword);
      toast('Mot de passe mis à jour.', 'success');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec de la mise à jour.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Changer mon mot de passe" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="currentPassword">Mot de passe actuel</label>
          <input
            id="currentPassword"
            type="password"
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="newPassword">Nouveau mot de passe</label>
          <input
            id="newPassword"
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">Confirmer le nouveau</label>
          <input
            id="confirmPassword"
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </Modal>
  );
}

function ChangeEmailModal({
  currentEmail,
  onClose,
  onSuccess,
}: {
  currentEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setError('Cette adresse est identique à l\'actuelle.');
      return;
    }
    setLoading(true);
    try {
      await services.requestEmailChange(newEmail);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec de la demande.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Modifier mon adresse email" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="newEmail">Nouvelle adresse email</label>
          <input
            id="newEmail"
            type="email"
            className="input"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={currentEmail}
            required
          />
        </div>
        <p className="text-xs text-ink/50">
          Un lien de confirmation sera envoyé à la nouvelle adresse.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer le lien de confirmation'}
        </button>
      </form>
    </Modal>
  );
}
