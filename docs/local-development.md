# Local development

Use Node.js 22.12 or newer and npm. Node.js 24 LTS is the recommended environment.
The application uses the committed lockfile; install with `npm ci`.

```sh
npm ci
cp .env.example .env
npm run dev
```

Visit `http://localhost:8100`. Environment credentials are blank in the example;
the component catalogue and most in-memory demos can be explored without them.
Block-demo data is sample data and may reset when the server restarts.

## Optional services

Account and database-backed blog features use MySQL. To work on those features,
create a dedicated local database, set the `DB_*` variables in your ignored
`.env`, and run `npm run db:migrate`. Supply your own local authentication
settings when testing account flows. Do not import a production database.

Billing and email flows require separately configured provider test accounts.
AI generation requires a separately configured provider. These integrations are
optional for reading the source, building the package, and viewing component
documentation. Credentials are not included in the repository.

The documentation app includes the website's runtime and public marketing pages
as examples. It is a local development environment, not a turnkey configuration
for hosting the official DOM Studio service. Configure and review external
services before deploying a derivative application under your licence.

## Validation

```sh
npm run build
npm run check:seo
npm run check:releases
npm run check:form-definition
npm ci --prefix packages/now
npm --prefix packages/now test -- --run
npm run package:check
npm run package:smoke
```

`npm run preview` serves a production build on port 8102.
`npm run dev:screenshot` starts an isolated development target on port 8110.
Use your own named browser testing session and close it when finished.

The local release page can use its bundled baseline without GitHub credentials.
Live account, billing, email, and AI integration tests are separate from the
local build and unit checks.
