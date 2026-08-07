# PLAL v2.0 — Résumé à partager

**PLAL** = **P**remier **L**ien **A**uthentique & **L**ocal  
Un réseau de confiance humain, propre, sans algorithme opaque.

---

## 🎯 L'idée

PLAL reconnecte les gens via les gens qu'on connaît déjà.  
Tu cherches quelqu'un de confiance dans un domaine ? Ton réseau te recommande quelqu'un à qui tu es relié par 1, 2, 3 ou 4 degrés de séparation.

---

## ✨ Ce qui est développé et fonctionne

### 🔐 Compte & profil
- Inscription / connexion sécurisées (JWT)
- Profil avec photo, bio, ville, téléphone
- Upload de photo de profil (CDN)
- Modification du profil et mot de passe

### 🔍 Recherche multi-niveaux
- Recherche de profils par ville, catégorie, distance
- Filtrage par degré de confiance : 1er, 2e, 3e, 4e cercle
- Tri par nombre d'amis en commun
- Géocodage mondial (Nominatim)

### 🤝 Amis & réseau
- Demander quelqu'un en ami
- Accepter / refuser
- Bloquer / débloquer un utilisateur
- Suggestions d'amis (amis d'amis)
- Affichage des amis en commun

### 📨 Demandes d'introduction
- Demander une introduction à quelqu'un via sa chaîne de confiance
- Suivi de la demande étape par étape
- Timeline des introductions
- Notifications en temps réel

### 🔔 Notifications
- Badge de notifications en direct (SSE)
- Compteur de non lues
- Notifications pour amis, introductions, invitations

### 📁 Recommandations
- Publier une recommandation dans une catégorie
- Catégories hiérarchiques (parent/enfant)
- Recommandations liées à une ville

### 📧 Invitations
- Générer un lien d'invitation
- Inviter par email
- Lien d'invitation avec prévisualisation du profil

### 🚀 Onboarding 4 étapes
1. Ville
2. Suggestions d'amis
3. Première recommandation (optionnel)
4. Invitation à partager

---

## 🛠️ Robustesse (Phase 6)

- ✅ Endpoint de santé `/api/health`
- ✅ Limitation de requêtes (rate limiting) sur l'authentification
- ✅ Tests unitaires
- ✅ CI/CD GitHub Actions
- ✅ Indexes de performance base de données
- ✅ Version 2.0 visible sur toutes les pages

---

## 🌐 En ligne maintenant

- **Site** : https://plal-web.vercel.app
- **API** : https://plal.vercel.app
- **Base de données** : Supabase PostgreSQL
- **Hébergement** : Vercel

---

## 📱 Comment l'utiliser

1. Va sur https://plal-web.vercel.app
2. Crée un compte
3. Complète l'onboarding
4. Cherche des profils ou ajoute des amis
5. Demande une introduction si besoin

---

## 🔒 Sécurité

- Mots de passe hashés (bcrypt)
- Tokens JWT avec expiration
- Limitation des tentatives de connexion
- Requêtes Prisma sécurisées (injections SQL impossible)
- CORS restreint au domaine autorisé

---

## 🚀 Prochainement (Phase 7)

- Messagerie directe entre utilisateurs
- Notifications push
- Suivi des erreurs (Sentry)
- Dashboard admin
- Mode sombre

---

*PLAL v2.0 — Déployé le 7 août 2026*
