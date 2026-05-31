# PLAL — Le réseau de confiance humaine

> « Quelqu'un dans mon réseau connaît probablement la bonne personne. »

PLAL digitalise le bouche-à-oreille. Ce n'est **pas** un annuaire ni une marketplace :
chaque recherche te ramène toujours à une seule question — **« Qui dans mon réseau peut m'aider ? »**

Tu cherches un bon ostéo, un garagiste fiable, une nounou de confiance ? Plutôt que de lire
des avis anonymes, PLAL cherche parmi **tes amis et leurs amis** la personne qui connaît
déjà quelqu'un de fiable, et te propose une **mise en relation**.

## Le scénario de référence

1. Alex crée un compte.
2. Alex ajoute Marc et Sophie comme amis.
3. Marc déclare : « je connais un bon ostéo à Montréal ».
4. Sophie déclare : « je connais un garagiste ».
5. Alex cherche « ostéo » → voit que **Marc** peut l'aider.
6. Alex demande une mise en relation → Marc la reçoit et peut accepter / répondre.

## Stack technique

- **Monorepo** : pnpm workspaces
- **Backend** : NestJS 10 + Prisma 5 + PostgreSQL 16 + JWT (passport-jwt)
- **Frontend** : Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Partagé** : `packages/shared` (types & enums, compilé en CommonJS)

```
apps/
  api/   → NestJS API (port 4000, préfixe /api)
  web/   → Next.js (port 3000)
packages/
  shared/ → types & enums partagés
```

## Prérequis

- Node.js ≥ 18
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- PostgreSQL 16 — via Homebrew **ou** Docker

## Installation

```bash
# 1. Dépendances
pnpm install

# 2. Base de données
# Option A — Docker
pnpm db:up
# Option B — Homebrew
brew install postgresql@16 && brew services start postgresql@16
createuser -s plal 2>/dev/null; psql postgres -c "ALTER USER plal PASSWORD 'plal';"
createdb -O plal plal

# 3. Variables d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Migrations + données de démo
pnpm api:migrate     # prisma migrate dev
pnpm api:seed        # 10 utilisateurs, recommandations, amitiés
```

## Lancer en développement

```bash
# Terminal 1 — API
pnpm api:dev          # http://localhost:4000/api

# Terminal 2 — Web
pnpm web:dev          # http://localhost:3000
```

## Comptes de démonstration

Tous les comptes utilisent le mot de passe **`password123`**.

| Email             | Personne | Rôle dans le scénario          |
| ----------------- | -------- | ------------------------------ |
| `alex@plal.test`  | Alex     | Cherche de l'aide              |
| `marc@plal.test`  | Marc     | Recommande un ostéo (Montréal) |
| `sophie@plal.test`| Sophie   | Recommande un garagiste        |
| `lea@plal.test`   | Léa      | Recommande une nounou          |
| `thomas@plal.test`| Thomas   | Ami de Marc                    |
| `nadia@plal.test` | Nadia    | Reco visible amis seulement    |

> Connecte-toi avec **Alex**, cherche « ostéo », et demande une mise en relation à Marc.

## Comment fonctionne la recherche

Le cœur du produit est un **graphe relationnel** :

- **Niveau 1** — tes amis directs (amitié acceptée).
- **Niveau 2** — les amis de tes amis.
- Une recommandation d'un ami direct est toujours visible.
- Une recommandation d'un ami d'ami n'est visible que si sa visibilité est
  `friends_of_friends` (sinon « amis seulement »).
- Les résultats d'amis directs sont affichés en premier.

Les coordonnées de la personne recommandée ne sont **jamais** exposées :
seule la mise en relation, validée par le recommandeur, permet le contact.

## Scripts utiles (racine)

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | API + Web en parallèle               |
| `pnpm db:up`       | PostgreSQL via Docker                |
| `pnpm api:migrate` | Migrations Prisma                    |
| `pnpm api:seed`    | Données de démonstration             |
| `pnpm api:dev`     | API en mode watch                    |
| `pnpm web:dev`     | Web en mode dev                      |
| `pnpm build`       | Build de tous les packages           |

## Notes

- L'authentification Google OAuth est prévue mais volontairement laissée en stub pour le MVP.
- L'interface est en français, pensée mobile-first.
