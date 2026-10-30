# Package checks in the source repository

This repository contains a reviewed source snapshot. Its Git history begins
with the initial source distribution; historical npm releases are described in
`CHANGELOG.md`, not recreated as Git tags here.

The official package remains `@getdom/studio`. This checkout has no publishing
or production deployment workflows. Its root package is private to prevent
accidental root publication.

## Validate and inspect

```sh
npm ci
npm ci --prefix packages/now
npm run build
npm --prefix packages/now test -- --run
npm run check:seo
npm run check:releases
npm run package:check
npm run package:smoke
```

`package:check` builds `dist/npm` and performs an npm packaging dry run.
`package:smoke` builds a small consumer using that generated package. Neither
command publishes a release. `package:pack` writes a local tarball to `dist`.
The package version is declared in `packages/studio/package.template.json`.

Use [the official release page](https://getdom.studio/releases) for published
release dates and notes. The local app's `/releases` page uses the bundled
historical baseline unless `RELEASES_FILE` supplies a validated public snapshot.
An optional `RELEASES_GITHUB_TOKEN` can read releases created in this source
repository; it is not required for local development.

## Secret scanning

Run [Gitleaks](https://github.com/gitleaks/gitleaks) 8.30.1 or newer against the
committed history before distributing an update:

```sh
gitleaks git . --redact --log-opts="--all"
```

The checked-in configuration retains the default rules and allows only two
literal, nonfunctional demo/test values at their exact fixture paths. It does
not exclude whole source directories. Keep real credentials in an ignored
`.env` file and review every new finding.
