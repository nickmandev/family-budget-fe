# Deployment

The Angular production build is written to `dist/family-budget-fe/browser`.
The Pages configuration in `wrangler.toml` points to that directory and the
`public/_redirects` file is copied into the build output by Angular's asset
configuration.

## Build and deploy

```sh
npm ci
npm run build
npm run deploy
```

`npm run deploy` runs `wrangler pages deploy dist/family-budget-fe/browser`.
Wrangler uses the project name from `wrangler.toml`; it can also be deployed
directly with:

```sh
npx wrangler pages deploy dist/family-budget-fe/browser --project-name=family-budget-fe
```

The `/* /index.html 200` redirect serves the Angular app for client-side routes,
so deep links such as `/transactions` continue to load after refresh.

## API configuration

Production builds use the relative API base URL `/api/v1` (see
`src/environments/environment.prod.ts`). Configure a reverse proxy at the
Pages domain to route `/api/v1/*` to the Go API, or change the production API
URL to the API's HTTPS origin and enable CORS on the Go API. If using a
cross-origin API, its CORS allow-list must include the exact deployed Pages
origin and any custom domain (for example, `https://family-budget-fe.pages.dev`
and `https://budget.example.com`). The API must allow the frontend's required
methods and headers, including `Authorization`, `Content-Type`, `Idempotency-Key`
and `X-Request-ID`, and support credentials only if the API's auth setup
requires them.

The production API URL is compiled into the Angular build. Set the desired
`apiBaseUrl` in `src/environments/environment.prod.ts` before building when the
API is hosted on a separate origin; do not put secrets in frontend environment
files.

## Custom domain

In the Cloudflare dashboard, open **Workers & Pages → family-budget-fe → Custom
domains**, add the domain, and follow Cloudflare's DNS/TLS instructions. The
domain must be on the Cloudflare account. Add the final custom origin to the
Go API CORS allow-list if the frontend calls that API cross-origin.

## GitHub Actions

The optional workflow at `.github/workflows/deploy.yml` builds, lints, and tests
on pushes. On `main` it additionally deploys the production build to Cloudflare
Pages. Configure these repository **Actions secrets**; they are intentionally
not stored in this repository:

- `CLOUDFLARE_API_TOKEN`: an API token with Cloudflare Pages edit/deploy access.
- `CLOUDFLARE_ACCOUNT_ID`: the account ID hosting the Pages project.
