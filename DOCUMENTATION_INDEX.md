<!-- PLAL v2.0 — Documentation Index & Quick Navigation -->

# 📚 PLAL v2.0 Documentation Index

**Choose your path based on your role ↓**

---

## 🎯 I want to DEPLOY PLAL to Vercel + Supabase

**→ Read**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) (10 min read)
- Step-by-step Supabase project creation
- Vercel API + Web configuration
- Environment variables mapping
- Health check verification
- Troubleshooting (5 common errors)

**Quick version (3 min)**:
1. Supabase dashboard → create project → copy DATABASE_URL + DIRECT_URL
2. Vercel → new project → root: apps/api → add env vars → deploy
3. Vercel → new project → root: apps/web → add env var → deploy
4. Test: `curl https://plal-api.vercel.app/api/health`

**Checklist**: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) — verify each step ✓

**Auto-verification**: `chmod +x verify-deployment.sh && ./verify-deployment.sh`

---

## 👨‍💼 I'm a PM/Manager and want to understand what's included

**→ Read**: [README_PRODUCTION.md](README_PRODUCTION.md) (5 min)
- v2.0 features summary (Phases 0–6 completed ✅)
- Build status dashboard
- Architecture overview
- Security checklist
- Phase 7 roadmap

---

## 🔧 I'm an Engineer and want to understand the robustness work

**→ Read**: [PHASE6_SUMMARY.md](PHASE6_SUMMARY.md) (8 min)
- Health check implementation (`GET /api/health`)
- Rate limiting configuration (Throttler)
- Test setup (Jest + @nestjs/testing)
- GitHub Actions CI/CD workflow
- Performance indexes (Prisma migrations)

**Key files to explore**:
- Health: [apps/api/src/health/health.controller.ts](apps/api/src/health/health.controller.ts)
- Tests: [apps/api/src/network/network.service.spec.ts](apps/api/src/network/network.service.spec.ts)
- CI/CD: [.github/workflows/ci.yml](.github/workflows/ci.yml)

---

## 🐛 Deployment is broken / I'm getting errors

**→ Read**: [DEPLOYMENT_GUIDE.md § 5 Troubleshooting](DEPLOYMENT_GUIDE.md#5-troubleshooting)

Common errors covered:
1. `NODE_ENV=production → pnpm skip devDependencies`
2. `Prisma query engine missing (500 FUNCTION_INVOCATION_FAILED)`
3. `BLOCKED / TEAM_ACCESS_REQUIRED` (git author email)
4. `Migrations failed on deploy`
5. `fail2ban: Connection refused` (SSH lockout)

---

## 🚀 I just deployed and want to verify it works

**→ Run**: `./verify-deployment.sh [API_URL] [WEB_URL]`

Example:
```bash
./verify-deployment.sh https://plal-api.vercel.app https://plal-web.vercel.app
```

Checks:
- ✓ API health endpoint responds
- ✓ Frontend loads (HTTP 200)
- ✓ Rate limiting is active
- ✓ v2.0 badge visible

---

## 📊 I want to understand the project structure

**→ Read**: [README.md](README.md) (existing root README) or [README_PRODUCTION.md](README_PRODUCTION.md) § Architecture

Structure:
```
PLAL/
├── apps/
│   ├── api/     → NestJS serverless (Vercel)
│   └── web/     → Next.js static (Vercel)
├── packages/
│   └── shared/  → TypeScript types
├── .github/workflows/  → CI/CD
└── docs/        → Deployment guides
```

---

## 🧪 I want to run tests locally

**→ Run**:
```bash
cd apps/api
pnpm install
pnpm test                # Run Jest unit tests
pnpm test:watch         # Watch mode
pnpm test:cov           # Coverage report
```

Tests included:
- NetworkService.spec.ts (BFS graph traversal)
- SearchService.spec.ts (depth-based filtering)
- Mock database setup in `jest.config.js`

---

## 🔐 I want to audit the security

**→ Check**: [README_PRODUCTION.md § Security Checklist](README_PRODUCTION.md#-security-checklist)

Implemented:
- [x] JWT tokens (7-day expiry)
- [x] bcrypt passwords (salt 10)
- [x] Rate limiting (Throttler)
- [x] CORS limited
- [x] Input validation (class-validator)
- [x] Parameterized queries (Prisma)

Not yet:
- [ ] OWASP Top 10 audit
- [ ] Sentry error tracking
- [ ] Penetration testing

---

## 📦 I want to update dependencies

**→ Check**: Apps have independent `package.json`:
```bash
# Update shared
cd packages/shared && pnpm up

# Update API
cd apps/api && pnpm up

# Update Web
cd apps/web && pnpm up

# Rebuild all
pnpm --filter shared build
pnpm --filter api build
pnpm --filter web build
```

**⚠️ Gotcha**: pnpm is a monorepo package manager. Prefer `pnpm up -r` from root to update all at once.

---

## 🔮 What's next? (Phase 7+)

**→ Check**: [README_PRODUCTION.md § Phase 7+ Coming Soon](README_PRODUCTION.md#phase-7--coming-soon)

Planned:
- [ ] Direct messaging
- [ ] Push notifications
- [ ] Sentry monitoring
- [ ] Vercel Analytics
- [ ] Admin dashboard
- [ ] Dark mode + i18n

---

## 📞 FAQ

**Q: How do I add a new feature?**  
A: Create a feature branch, make changes, build locally (`pnpm --filter api build`), test, create a PR. CI will run tests on GitHub Actions.

**Q: How do I debug the API?**  
A: Run locally with `pnpm --filter api run dev`, then use VS Code debugger or curl to test endpoints.

**Q: Can I deploy without Vercel?**  
A: Yes, but you'll need to adapt the build/start scripts. See [apps/api/vercel.json](apps/api/vercel.json) and [apps/api/Dockerfile](apps/api/Dockerfile) for reference.

**Q: What's the database connection strategy?**  
A: Supabase pgBouncer (pooled) for runtime, TCP (direct) for migrations. See [DEPLOYMENT_GUIDE.md § 1.2](DEPLOYMENT_GUIDE.md#12-récupérer-les-credentials).

**Q: How often should I update dependencies?**  
A: Follow semver. Critical security patches → immediately. Minor updates → monthly. Major updates → quarterly (after testing).

---

## 🗂️ File Structure

| File | Purpose | Audience |
|------|---------|----------|
| [README.md](README.md) | Project overview (existing) | Everyone |
| [README_PRODUCTION.md](README_PRODUCTION.md) | v2.0 production summary | Everyone |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | **Vercel + Supabase setup** | DevOps, Engineers |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Pre/post-deploy verification | QA, Team leads |
| [PHASE6_SUMMARY.md](PHASE6_SUMMARY.md) | Robustness implementation | Engineers |
| [verify-deployment.sh](verify-deployment.sh) | Auto-verification script | DevOps |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | GitHub Actions CI/CD | Engineers |
| [apps/api/jest.config.js](apps/api/jest.config.js) | Jest test configuration | Engineers |

---

## ⏭️ Next Steps

1. **Deploy**: Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **Verify**: Run `./verify-deployment.sh` after deploy
3. **Test**: Manual testing (register → onboarding → search)
4. **Monitor**: Check Vercel + Supabase dashboards
5. **Celebrate**: 🎉 PLAL v2.0 is live!

---

**Last updated**: 2026-08-07 | **Version**: 2.0.0 | **Status**: ✅ Production Ready
