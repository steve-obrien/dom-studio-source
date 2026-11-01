# Package checks in the source repository

This is the development repository with reviewed historical commits. Historical
release markers use `history/vVERSION`; they navigate sanitized source and do
not publish packages. Existing official version tags and release records remain
unchanged in the previous operational repository. Published changes are also
described in `CHANGELOG.md`.

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

## Preparing future releases

`npm run release:prepare -- VERSION` validates a future package candidate locally.
It never commits, pushes, tags, or publishes. Choose a version above the currently
published npm version and write reviewed notes before running it. Publication
from this repository requires the separate setup in
[repository migration](repository-migration.md); no deployment or publishing
workflow is enabled by this history import.

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
