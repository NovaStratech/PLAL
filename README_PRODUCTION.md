# 🎯 PLAL v2.0 — Production Ready

**Le réseau de confiance humaine** | [Lancer le déploiement →](DEPLOYMENT_GUIDE.md)

---

## 📊 Status Production

| Component | Status | Build | Deploy |
|-----------|--------|-------|--------|
| **API (NestJS)** | ✅ Ready | `nest build` ✓ | Serverless on Vercel |
| **Web (Next.js)** | ✅ Ready | `next build` ✓ | Static CDN on Vercel |
| **Database (PostgreSQL)** | ✅ Configured | N/A | Supabase with pgBouncer |
| **Tests** | ✅ Scaffolded | Jest + @nestjs/testing | GitHub Actions CI |
| **Rate Limiting** | ✅ Active | Throttler | Auth (10/min), Invitations (20/min) |
| **Health Check** | ✅ Endpoint | `GET /api/health` | v2.0.0 monitoring |

---

## 🚀 Quick Deploy (10 min)

### Prerequisites
- Supabase account (free tier OK): https://supabase.com
- Vercel account (free tier OK): https://vercel.com
- Git push access to this repo

### 1. Supabase Setup (5 min)
```bash
# Create project at supabase.com/dashboard
# Copy DATABASE_URL (pooled) and DIRECT_URL (TCP)

cd apps/api
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." \
pnpm exec prisma migrate deploy
```

### 2. Vercel API (5 min)
```
1. https://vercel.com/new
2. Import this repo → root: apps/api
3. Env vars: DATABASE_URL, DIRECT_URL, JWT_SECRET, WEB_ORIGIN
4. Deploy → curl https://plal-api.vercel.app/api/health
```

### 3. Vercel Web (3 min)
```
1. https://vercel.com/new
2. Import this repo → root: apps/web
3. Env var: NEXT_PUBLIC_API_URL=https://plal-api.vercel.app
4. Deploy → visit https://plal-web.vercel.app
```

✅ **Done!** V2.0 is live.

---

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | Detailed Vercel + Supabase setup (280 lines) | DevOps / Deployment |
| **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** | Pre/post-deploy verification checklist | QA / Team |
| **[PHASE6_SUMMARY.md](PHASE6_SUMMARY.md)** | Phase 6 features (health, rate limit, tests, CI) | Engineers |
| **[verify-deployment.sh](verify-deployment.sh)** | Bash script to verify deployment URLs | DevOps |

---

## 🏗️ Architecture

### Monorepo Structure
```
PLAL/
├── apps/
│   ├── api/           → NestJS serverless (Vercel)
│   └── web/           → Next.js static + CDN (Vercel)
├── packages/
│   └── shared/        → TypeScript types & enums
├── .github/workflows/ → GitHub Actions CI
└── docs/              → Guides & checklists
```

### Tech Stack
- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL
- **Frontend**: Next.js 14 + Tailwind CSS + React 18
- **Database**: Supabase (managed PostgreSQL)
- **Hosting**: Vercel (serverless + static)
- **Auth**: JWT + bcrypt
- **Tests**: Jest 29 + NestJS Testing
- **CI/CD**: GitHub Actions

---

## 🎯 v2.0 Features

### Phase 0–5: Core Functionality ✅
- User authentication (register/login/forgot-password)
- Profile management with avatars (UploadThing)
- Multi-grade search with trust-based recommendation
- Chain-of-trust introductions (BFS graph traversal)
- Hierarchical categories with suggestions
- Friendship management with blocking
- Real-time notification badge (SSE)
- Public user profiles
- 4-step onboarding flow
- Clickable avatars + avatars links
- Friend suggestions (friends-of-friends)

### Phase 6: Robustness ✅
- **Health Check**: `GET /api/health` → status, uptime, DB, latency, version
- **Rate Limiting**: Throttler on auth (10/min) + invitations (20/min)
- **Tests**: Unit tests for NetworkService, SearchService
- **CI/CD**: GitHub Actions (lint + build + test on push)
- **Performance**: Database indexes on Notifications, Recommendations, Friendships
- **V2.0 Badge**: Visible on all pages (AppShell + landing)

### Phase 7+ : Coming Soon
- Messagerie directe entre utilisateurs
- Notifications push (web + mobile)
- Sentry error tracking
- Vercel Analytics
- Admin dashboard
- Dark mode + i18n

---

## 📦 Build & Test Locally

### Development
```bash
# Install dependencies
pnpm install

# Start dev servers
pnpm --filter shared build
pnpm --filter api run dev      # API on http://localhost:4000/api
pnpm --filter web run dev      # Web on http://localhost:3000
```

### Build for Production
```bash
pnpm --filter shared build     # TypeScript compilation
pnpm --filter api build        # NestJS build
pnpm --filter web build        # Next.js static export
```

### Run Tests
```bash
pnpm --filter api test         # Jest unit tests
pnpm --filter api test:watch   # Watch mode
pnpm --filter api test:cov     # Coverage report
```

### Linting
```bash
pnpm --filter api lint         # ESLint
pnpm --filter web lint         # Next.js ESLint
```

---

## 🔐 Security Checklist

- [x] JWT tokens with 7-day expiry
- [x] Passwords hashed with bcrypt (salt rounds: 10)
- [x] Rate limiting on sensitive endpoints (auth, invitations)
- [x] CORS limited to WEB_ORIGIN env var
- [x] Input validation with class-validator
- [x] SQL injection protection via Prisma parameterized queries
- [x] No secrets in `.env` files (use Vercel secrets)
- [ ] OWASP Top 10 audit (pending Phase 7)
- [ ] HTTPS enforced (Vercel default)

---

## 📞 Support & Troubleshooting

### Common Issues

**❌ "NODE_ENV=production → tsc: command not found"**  
→ installCommand must include `--prod=false`. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#-erreur-node_env%3Dproduction--pnpm-skip-devdependencies).

**❌ "Prisma query engine missing (500 error)"**  
→ vercel.json includes Prisma files. Already configured. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#-erreur-prisma-query-engine-introuvable).

**❌ "Git BLOCKED / TEAM_ACCESS_REQUIRED"**  
→ Git author email must match Vercel team owner. Run:
```bash
git config user.email "admin@novastratech.com"
git commit --amend --reset-author --no-edit
git push --force-with-lease
```

**❌ "Health check returns 'database: disconnected'"**  
→ DATABASE_URL or DIRECT_URL incorrect. Verify Supabase credentials.

For detailed troubleshooting, see [DEPLOYMENT_GUIDE.md § 5](DEPLOYMENT_GUIDE.md#5-troubleshooting).

---

## 🎉 You're Ready!

PLAL v2.0 is feature-complete and production-ready. Deploy to Vercel + Supabase using [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

**Questions?** Check the docs or run `./verify-deployment.sh` after deploying.

---

## 📋 Project Metadata

- **Repository**: NovaStratech/PLAL
- **Current Branch**: main
- **Version**: 2.0.0
- **Last Updated**: 2026-08-07
- **Build Status**: ✅ All projects pass
- **Deployment**: Ready for production

---

**[➡️ Start Deployment →](DEPLOYMENT_GUIDE.md)**
