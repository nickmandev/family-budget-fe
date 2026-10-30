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

Production builds call `https://budget-api.nickmandev.com/api/v1` directly (see
`src/environments/environment.prod.ts`). The frontend is hosted on Cloudflare
Pages and calls the Hetzner-hosted Go API cross-origin; no Pages reverse proxy
for `/api/v1` is used. Configure the API's CORS allow-list for the deployed
Pages origin (`https://<pages-domain>`) and any custom frontend domain. Allow
the request headers `Authorization`, `Content-Type`, `Idempotency-Key`, and
`X-Request-ID`. The API should return `X-Request-ID` on responses and expose it
through CORS (for example, with `Access-Control-Expose-Headers: X-Request-ID`)
when the frontend needs to read it. Ensure CORS preflight `OPTIONS` requests
are handled for the mutation endpoints and their allowed methods and headers.

The production API URL is compiled into the Angular build. Do not put secrets
in frontend environment files.

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
