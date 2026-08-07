<!-- PLAL v2.0 Production Checklist -->
# 🎯 PLAL v2.0 — Production Deployment Checklist

**Build Status**: ✅ All projects pass (shared + api + web)  
**Date**: 2026-08-07  
**Version**: 2.0.0 (V2.0 badge visible on all pages)

---

## Pre-Deployment Verification

- [x] Shared package builds: `pnpm --filter shared build`
- [x] API builds: `pnpm --filter api build` + `npm run lint`
- [x] Web builds: `pnpm --filter web build` + `npm run lint`
- [x] Health Check endpoint created: `GET /api/health`
- [x] Rate limiting configured: Throttler on auth + invitations
- [x] Tests scaffolded: Jest + @nestjs/testing
- [x] CI/CD configured: GitHub Actions `.github/workflows/ci.yml`
- [x] Performance indexes created: Prisma migration
- [x] V2.0 badge deployed: header on all pages

---

## Deployment Steps

### Step 1: Supabase Setup (5 min)
```bash
1. Create project at https://supabase.com/dashboard
2. Copy DATABASE_URL (pgBouncer) and DIRECT_URL (TCP)
3. Apply migrations locally:
   cd apps/api
   DATABASE_URL="<paste_here>" DIRECT_URL="<paste_here>" pnpm exec prisma migrate deploy
```

### Step 2: Vercel API Deployment (10 min)
```bash
1. Create new project: https://vercel.com/new
   - Import PLAL repo
   - Project name: plal-api
   - Root directory: apps/api
   - Framework: None (custom NestJS)

2. Add Environment Variables:
   - DATABASE_URL = (from Supabase)
   - DIRECT_URL = (from Supabase)
   - JWT_SECRET = (generate: openssl rand -base64 32)
   - JWT_EXPIRES_IN = 7d
   - WEB_ORIGIN = https://plal-web.vercel.app
   - (DO NOT set NODE_ENV yet; wait for successful build)

3. Click Deploy

4. After 5-10 min, verify:
   curl https://plal-api.vercel.app/api/health
   # Should return: {"status":"ok","version":"2.0.0",...}
```

### Step 3: Vercel Web Deployment (10 min)
```bash
1. Create new project: https://vercel.com/new
   - Import PLAL repo (same)
   - Project name: plal-web
   - Root directory: apps/web
   - Framework: Next.js (auto-detected)

2. Add Environment Variables:
   - NEXT_PUBLIC_API_URL = https://plal-api.vercel.app

3. Click Deploy

4. After 3-5 min, verify:
   https://plal-web.vercel.app
   - V2.0 badge should be visible in header
   - Page should load, no errors
```

### Step 4: Enable NODE_ENV=production (optional, after API works)
```bash
1. Go to Vercel dashboard → plal-api → Settings → Environment Variables
2. Add: NODE_ENV = production
3. Redeploy: plal-api → Deployments → Redeploy
4. Wait 5 min, verify health check still works
```

---

## Post-Deployment Verification

- [ ] Health check responds: `curl https://plal-api.vercel.app/api/health`
- [ ] Frontend loads: `https://plal-web.vercel.app`
- [ ] V2.0 badge visible in header
- [ ] Can register new account
- [ ] Can complete onboarding (4 steps)
- [ ] Can search for users
- [ ] Can add friends
- [ ] Can create recommendations
- [ ] Rate limiting working: spam auth endpoint → 429 after 10 attempts

---

## Important Notes

### 🚨 Common Pitfalls
1. **NODE_ENV=production before build** → breaks pnpm (skip devDeps)
   - Solution: installCommand must have `--prod=false`

2. **Prisma query engine missing** → 500 error
   - Already fixed: vercel.json includes `includeFiles: "@prisma+client*"`

3. **Git author email** → BLOCKED/TEAM_ACCESS_REQUIRED
   - Solution: `git config user.email "admin@novastratech.com"` before push

4. **Migrations fail** → Check DIRECT_URL format (TCP, port 5432)

### ⚡ Performance Notes
- Web: ~94 KB First Load JS (19 static pages)
- API: Serverless with 30s timeout, 512 MB RAM
- Database: Supabase pgBouncer + connection pooling
- Rate limiting: Default 60 req/min, auth 10/min

### 🔐 Security
- JWT tokens: 7 days expiry
- Password: bcrypt with salt rounds
- Rate limiting: Protects auth endpoints
- CORS: Limited to WEB_ORIGIN
- Throttler: Global + per-endpoint limits

---

## Monitoring URLs

Once deployed:
- **API Dashboard**: https://vercel.com/dashboard → plal-api
- **Web Dashboard**: https://vercel.com/dashboard → plal-web
- **Supabase Dashboard**: https://supabase.com/dashboard → plal-production
- **API Health**: https://plal-api.vercel.app/api/health
- **Frontend**: https://plal-web.vercel.app

---

## Rollback (if needed)
```bash
# Vercel auto-keeps previous deployments
1. Go to Vercel dashboard → project → Deployments
2. Click the previous (green) deployment
3. Click three dots → "Promote to Production"
# Done! Previous version is now live (30 sec)
```

---

## Next Steps (Phase 7)

- [ ] Set up Sentry for error tracking
- [ ] Enable Vercel Analytics
- [ ] Configure Supabase backups
- [ ] Add E2E tests (Playwright)
- [ ] Implement messaging feature
- [ ] Add push notifications
- [ ] Create admin dashboard

---

**Deployment initiated**: 2026-08-07  
**Status**: Ready for production ✅  
**Questions?** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting.
