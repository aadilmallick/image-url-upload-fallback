# Vercel development and deployment guide

This guide covers local development, Preview deployments, Production releases, and the external services used by Image URL Fallback. Never commit `.env.local`, `.vercel/`, database URLs, provider credentials, or API keys.

## 1. Prerequisites

- Node.js 20 or newer and pnpm.
- A Vercel account with access to the existing project.
- Clerk Billing enabled with the user plan slug `image_url_fallback_pro`.
- A Neon Postgres database, Redis instance, and Inngest application.
- At least one managed image provider connected through the product UI before performing an upload.

Install the CLI locally (already a project dev dependency) or globally:

```powershell
pnpm exec vercel --version
# Optional global install
npm install --global vercel
```

Authenticate once per workstation:

```powershell
pnpm exec vercel login
pnpm exec vercel whoami
```

## 2. Link this directory to the existing Vercel project

From the repository root:

```powershell
pnpm exec vercel link
```

Choose the correct team and the existing project when prompted. This creates `.vercel/project.json`, which contains project metadata but no application secrets. Keep `.vercel/` Git-ignored.

Useful checks:

```powershell
pnpm exec vercel project inspect
pnpm exec vercel open
```

For a non-interactive CI environment, authenticate with a Vercel token and pass the team/project identifiers rather than relying on prompts. Do not place the token in source control.

## 3. Environment variables

Configure these in **Vercel Project → Settings → Environment Variables**. Add production credentials to Production; use distinct preview/development credentials where possible.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | The canonical public URL; use `https://your-domain` in Production. |
| `DATABASE_URL` | Yes | Neon pooled Postgres connection string with TLS. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Safe to expose to the browser. |
| `CLERK_SECRET_KEY` | Yes | Server-only. Mark sensitive. |
| `CREDENTIAL_ENCRYPTION_KEY` | Yes | Base64-encoded 32-byte key used to encrypt per-account provider credentials. Mark sensitive; rotate deliberately. |
| `INNGEST_EVENT_KEY` | Yes | Server-only event publishing key. |
| `INNGEST_SIGNING_KEY` | Yes | Server-only signing key for the Inngest serve route. |
| `REDIS_URL` | Production | Shared Redis URL for rate limits, health cache, and circuit breaking. Mark sensitive. |
| `CLOUDINARY_URL` | Optional | Only for local connection testing; production users configure their own encrypted provider connections through the app. |

The application reads all configuration through `src/core/config.ts`; do not add scattered `process.env` reads.

List configured variable names without exposing values:

```powershell
pnpm exec vercel env ls
pnpm exec vercel env ls production
pnpm exec vercel env ls preview
```

Add or update a variable interactively:

```powershell
pnpm exec vercel env add REDIS_URL production --sensitive
pnpm exec vercel env add REDIS_URL preview --sensitive
```

After changing Vercel variables, create a new deployment; existing deployments retain their prior values.

## 4. Local development

### Standard Next.js development

Use the existing `.env.local` for local credentials:

```powershell
pnpm dev
```

### Vercel-aware local development

Pull project metadata and Development variables into Vercel's local state:

```powershell
pnpm exec vercel pull --environment=development
pnpm exec vercel dev --port 3000
```

`vercel dev` is useful for testing Vercel-specific behavior. For day-to-day Next.js work, `pnpm dev` is typically faster.

To pull a named environment into a file, use:

```powershell
pnpm exec vercel env pull .env.local --environment=development
pnpm exec vercel env pull .env.preview.local --environment=preview
```

Avoid overwriting a working `.env.local` unless the cloud copy is authoritative. `vercel env run` is a useful alternative when secrets should not be written locally:

```powershell
pnpm exec vercel env run -- pnpm dev
pnpm exec vercel env run --environment=production -- pnpm build
```

## 5. Pre-deployment checks

Run these before every Preview or Production deployment:

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
pnpm exec vercel pull --environment=preview
pnpm exec vercel build
```

`vercel build` catches deployment-environment incompatibilities before upload. Sharp runs server-side in this project; keep compression code out of Client Components and verify its native package is installed in production dependencies.

Also verify:

- `NEXT_PUBLIC_APP_URL` matches the target environment.
- Neon, Redis, Clerk, and Inngest variables are present in the target environment.
- `.env.local` and `.vercel/` are ignored by Git.
- Database migrations are generated and applied intentionally before code requiring them is deployed.

## 6. Preview deployments

Create a Preview deployment from the current working directory:

```powershell
pnpm exec vercel deploy
```

The command prints the Preview URL. Test it before production:

```powershell
pnpm exec vercel curl / --deployment <preview-url>
pnpm exec vercel logs --deployment <preview-url> --level error
```

When Git integration is enabled, pushes to non-production branches create Preview deployments automatically. Use branch-specific Preview variables for isolated test services when needed.

## 7. Production deployment

Only deploy after Preview validation and an explicit release decision:

```powershell
pnpm exec vercel deploy --prod
```

Validate the live deployment:

```powershell
pnpm exec vercel curl / --deployment <production-url>
pnpm exec vercel logs --environment production --level error --since 10m
```

For a custom domain:

```powershell
pnpm exec vercel domains add example.com <project-name>
pnpm exec vercel domains inspect example.com
```

Update `NEXT_PUBLIC_APP_URL` to the canonical HTTPS domain, redeploy, and configure that domain in Clerk's allowed origins/redirect URLs.

## 8. Rollback and recovery

Do not redeploy blindly when a Production release fails.

1. Inspect deployment logs and Vercel function errors.
2. Confirm the correct environment variables are present for Production.
3. Roll back by promoting a known-good deployment:

```powershell
pnpm exec vercel ls
pnpm exec vercel promote <known-good-deployment-url>
```

4. If only configuration changed, correct the environment variable and deploy again.
5. If a migration caused the issue, use a forward-only repair migration; do not drop production tables or run destructive resets.

## 9. Service-specific configuration

### Neon Postgres

- Use Neon's pooled/serverless connection string in `DATABASE_URL`.
- Keep `sslmode=require`.
- Apply Drizzle migrations deliberately:

```powershell
node .\node_modules\drizzle-kit\bin.cjs generate
node .\node_modules\drizzle-kit\bin.cjs migrate
```

- Prefer a separate Neon branch/database for Preview if test data must not mix with Production.
- Monitor connection, query, and storage limits in Neon.

### Redis

`REDIS_URL` enables cross-instance state for health checks, circuit breaking, and free-tier rate limiting. All keys are automatically namespaced with `image-url-fallback-app:`.

Test the endpoint locally without exposing its URL:

```powershell
node -e "process.loadEnvFile('.env.local'); const Redis=require('ioredis'); const client=new Redis(process.env.REDIS_URL); client.ping().then(console.log).finally(()=>client.quit())"
```

If Redis is unavailable, the app uses a short-lived in-memory fallback. That preserves availability but is not shared across Vercel instances, so configure Redis for production.

### Inngest

The app exposes its serve handler at `/api/inngest`. Inngest uses it to discover and invoke the repair workflow.

1. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to all required Vercel environments.
2. Deploy a Preview or Production build.
3. In Inngest, add/sync the function URL: `https://<deployment-domain>/api/inngest`.
4. Confirm `repair-degraded-image` appears in the Inngest dashboard.
5. Trigger a deliberately degraded upload in Preview and inspect retries/history.

For longer-running functions, configure the Inngest/Vercel runtime limits deliberately. Do not rely on a standard request handler for durable repair work.

### Clerk and Billing

- Add the Production domain and Preview patterns in Clerk.
- Configure the Production and Preview Clerk keys separately if using separate Clerk instances.
- Enable Billing for users and publish `image_url_fallback_pro`.
- Confirm the pricing page renders plans and that the server-side entitlement check recognizes the plan.
- Test a free account's quota/rate-limit path and a Pro account's unrestricted upload path.

### Image providers and compression

- Provider credentials are user-scoped, encrypted in Neon, and configured through the dashboard API; do not make a shared provider secret a required Vercel variable.
- Confirm every configured storage provider permits the public delivery URL strategy used by its adapter.
- Compression uses Sharp in server-side code. Test a WebP and AVIF upload on Preview before enabling it for production traffic.

## 10. Production verification checklist

- [ ] Homepage, Clerk sign-in, dashboard, and pricing page load.
- [ ] A user can connect a provider and reorder the fallback chain.
- [ ] File upload, clipboard image upload, URL import, and CSV import work.
- [ ] A shortlink returns a redirect to a healthy replica.
- [ ] A source URL creates a LinkProvider replica when configured first.
- [ ] Compression rules produce the expected WebP/AVIF output.
- [ ] Redis-backed health cache and rate limits operate across requests.
- [ ] A failed provider replica produces an Inngest repair run and image history event.
- [ ] Free-tier limits and `image_url_fallback_pro` entitlement behave correctly.
- [ ] Preview and Production use the intended Neon/Redis/Clerk/Inngest environments.

## Official references

- [Vercel CLI deployment workflow](https://vercel.com/docs/projects/deploy-from-cli)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel `env` command](https://vercel.com/docs/cli/env)
- [Inngest Next.js quick start](https://www.inngest.com/docs/getting-started/nextjs-quick-start)
- [Serving Inngest functions over HTTP](https://www.inngest.com/docs/learn/serving-inngest-functions)
