# 🚀 Guide Déploiement PLAL v2.0 — Vercel + Supabase

**Status**: Production-ready | 2026-08-07

---

## Table des matières
1. [Supabase — Configuration Database](#1-supabase--configuration-database)
2. [Vercel — Configuration Projects](#2-vercel--configuration-projects)
3. [Variables d'Environnement](#3-variables-denvironnement)
4. [Déploiement et Vérification](#4-déploiement-et-vérification)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Supabase — Configuration Database

### 1.1 Créer un projet Supabase
1. Aller à https://supabase.com/dashboard
2. Cliquer **New Project**
3. Nom: `plal-production` | Région: **Pick closest to users** (Europe si basé EU)
4. Générer un mot de passe fort (30+ chars)
5. Cliquer **Create new project** (attendre ~2 min)

### 1.2 Récupérer les credentials
1. Dans le dashboard Supabase, aller à **Settings → Database**
2. Copier les URLs de connexion :
   - **Connection string (pgBouncer)** — pooled connection (runtime) → `DATABASE_URL`
   - **Connection string (TCP)** — direct connection (migrations) → `DIRECT_URL`

**Format exemple** :
```
DATABASE_URL=postgresql://postgres.xxxxxx:[password]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
DIRECT_URL=postgresql://postgres.xxxxxx:[password]@aws-0-xxx.pooler.supabase.com:5432/postgres?schema=public
```

### 1.3 Appliquer les migrations
```bash
# Depuis la racine du repo
cd /Volumes/T7/Repository/PLAL/apps/api

# Générer le Prisma Client
pnpm exec prisma generate

# Appliquer les migrations à Supabase
DATABASE_URL="<votre_DATABASE_URL>" \
DIRECT_URL="<votre_DIRECT_URL>" \
pnpm exec prisma migrate deploy
```

✅ Si succès: les 3 migrations (init, invitations_geo, phase1-6) sont appliquées.

---

## 2. Vercel — Configuration Projects

### 2.1 API (Serverless Function)

#### a) Créer le projet
1. https://vercel.com/dashboard
2. **Add New → Project**
3. **Import Git Repository** → sélectionner `PLAL`
4. Cliquer **Import**

#### b) Configuration du projet
- **Project Name**: `plal-api`
- **Framework Preset**: **Other** (NestJS)
- **Root Directory**: `apps/api`
- Cliquer **Continue**

#### c) Variables d'environnement (Settings → Environment Variables)
```
DATABASE_URL = <votre_DATABASE_URL_Supabase>
DIRECT_URL = <votre_DIRECT_URL_Supabase>
JWT_SECRET = <générer_une_clé_aléatoire_40+_chars>
JWT_EXPIRES_IN = 7d
PORT = 4000
WEB_ORIGIN = https://plal-web.vercel.app
NODE_ENV = production
```

**⚠️ IMPORTANT**: N'ajouter `NODE_ENV=production` QUE après que `pnpm install --prod=false` soit dans l'installCommand.

#### d) Build & Deploy Settings
- **Framework**: None (custom)
- **Build Command**: (laisser par défaut)
- **Output Directory**: `.next` (Vercel détecte automatiquement)
- **Install Command**: Garder celui du `apps/api/vercel.json`

Cliquer **Deploy** → attendre la build (3-5 min)

### 2.2 Web (Next.js Static)

#### a) Créer le projet
1. **Add New → Project**
2. **Import Git Repository** → `PLAL`
3. **Project Name**: `plal-web`
4. **Framework Preset**: **Next.js**
5. **Root Directory**: `apps/web`

#### b) Variables d'environnement (Settings → Environment Variables)
```
NEXT_PUBLIC_API_URL = https://plal-api.vercel.app
```

#### c) Build Settings
- **Framework**: Next.js (auto-détecté)
- **Build Command**: (laisser default)
- **Install Command**: Garder celui du `apps/web/vercel.json`

Cliquer **Deploy**

---

## 3. Variables d'Environnement

### Vercel API Project (apps/api)
| Variable | Valeur | Source |
|----------|--------|--------|
| `DATABASE_URL` | `postgresql://postgres...@...pooler.supabase.com:6543/...` | Supabase Settings |
| `DIRECT_URL` | `postgresql://postgres...@...supabase.com:5432/...` | Supabase Settings |
| `JWT_SECRET` | (40+ chars random) | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `7d` | Hardcoded |
| `WEB_ORIGIN` | `https://plal-web.vercel.app` | Votre URL web |
| `NODE_ENV` | `production` | Hardcoded |
| `PORT` | `4000` | Hardcoded |

### Vercel Web Project (apps/web)
| Variable | Valeur | Source |
|----------|--------|--------|
| `NEXT_PUBLIC_API_URL` | `https://plal-api.vercel.app` | Votre URL API |

### .env.local (Local Development)
```bash
# apps/api/.env.local
DATABASE_URL="postgresql://plal:plal@localhost:5432/plal?schema=public"
DIRECT_URL="postgresql://plal:plal@localhost:5432/plal?schema=public"
JWT_SECRET="dev-secret-not-for-production"
JWT_EXPIRES_IN="7d"
WEB_ORIGIN="http://localhost:3000"
NODE_ENV="development"
```

---

## 4. Déploiement et Vérification

### 4.1 Build Local Avant Push
```bash
cd /Volumes/T7/Repository/PLAL

# Shared
pnpm --filter shared build

# API
pnpm --filter api lint
pnpm --filter api build

# Web
pnpm --filter web lint
pnpm --filter web build
```

Tous les builds doivent passer ✅.

### 4.2 Git Push
```bash
git add .
git commit -m "Phase 6: robustness, health check, rate limiting, tests, CI/CD"
git push origin main
```

**⚠️ Git Author Email**: Doit être l'email du propriétaire du team Vercel!  
Voir `.env > user.email` ou:
```bash
git config user.email "admin@novastratech.com"
```

### 4.3 Monitoring Déploiement Vercel
1. Aller à https://vercel.com/dashboard
2. **plal-api** → **Deployments** → voir build en cours
3. Attendre "✅ Production" (vert)
4. Tester: `curl https://plal-api.vercel.app/api/health`

**Réponse attendue**:
```json
{
  "status": "ok",
  "uptime": 12.34,
  "database": "connected",
  "latencyMs": 45,
  "version": "2.0.0"
}
```

### 4.4 Tester Frontend
1. Aller à https://plal-web.vercel.app
2. Vérifier que V2.0 badge s'affiche
3. Essayer register → onboarding → login

---

## 5. Troubleshooting

### ❌ Erreur: `NODE_ENV=production → pnpm skip devDependencies`
**Symptôme**: `tsc: command not found` dans build

**Cause**: `NODE_ENV=production` force `pnpm install --prod` (no devDeps)

**Solution**:
- `apps/api/vercel.json` doit avoir: `"installCommand": "... pnpm install --no-frozen-lockfile --prod=false"`
- Vérifier que `NODE_ENV` n'est PAS défini avant la build (mettre dans env vars APRÈS success)

### ❌ Erreur: `Prisma query engine introuvable (500 FUNCTION_INVOCATION_FAILED)`
**Cause**: Query engine `.so` file est dans le store pnpm racine, pas dans `node_modules/.prisma`

**Solution**: `vercel.json` inclure:
```json
"functions": {
  "api/index.ts": {
    "includeFiles": "../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**",
    "maxDuration": 30
  }
}
```

### ❌ Erreur: `BLOCKED / TEAM_ACCESS_REQUIRED`
**Cause**: Commit author email ≠ membre du team Vercel

**Solution**:
```bash
git config user.email "admin@novastratech.com"
git commit --amend --reset-author --no-edit
git push --force-with-lease
```

### ❌ Erreur: `Migrations failed on deploy`
**Cause**: `DIRECT_URL` mal configurée ou DB offline

**Solution**:
1. Vérifier Supabase est actif (Settings → Database)
2. Vérifier credentials `DIRECT_URL` copiées exactement (pas de typo)
3. Tester localement d'abord

### ❌ Erreur: `fail2ban: Connection refused on port`
**Cause**: Votre IP est ban temporaire sur SSH

**Solution**:
- Attendre 10 min (bantime par défaut)
- OU utiliser relay IP: `sshpass -p 'PW' ssh -o ProxyCommand="..." root@RELAY_IP`
- OU débannir directement: `sudo fail2ban-client set sshd unbanip <your.ip>`

---

## 📋 Checklist Déploiement

- [ ] Supabase project créé + credentials extraites
- [ ] Migrations appliquées: `prisma migrate deploy`
- [ ] Vercel API project configuré (rootDirectory: `apps/api`)
- [ ] Vercel Web project configuré (rootDirectory: `apps/web`)
- [ ] Variables d'environnement définies (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Build local passe: `pnpm --filter shared build && pnpm --filter api build && pnpm --filter web build`
- [ ] Git author email correct: `git config user.email`
- [ ] Push vers main
- [ ] Vercel deployments complètent ✅
- [ ] Health check répond: `curl https://plal-api.vercel.app/api/health`
- [ ] Frontend charge: https://plal-web.vercel.app
- [ ] V2.0 badge visible sur la page

---

## 🎯 URLs Producrion

Once deployed:
- **API**: https://plal-api.vercel.app (Serverless NestJS)
- **Web**: https://plal-web.vercel.app (Static Next.js + Vercel Edge Middleware)
- **Database**: Supabase PostgreSQL avec pgBouncer

---

## 📞 Support

Pour plus d'infos:
- Vercel Docs: https://vercel.com/docs/frameworks/nextjs
- Supabase Docs: https://supabase.com/docs
- Prisma + Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
