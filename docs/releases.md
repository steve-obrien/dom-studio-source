# DOM Studio releases

Releases of `@getdom/studio` come from this repository, `steve-obrien/dom-studio-source`.
`CHANGELOG.md` is the reviewed source of release notes. Annotated `vVERSION` tags
identify the released source; npm contains the package; GitHub Releases in this
repository contain the published announcement.

Historical release markers use `history/vVERSION`. They navigate sanitized source
and never publish packages. Tags and GitHub Releases for 0.2.6 and earlier remain
in the previous repository. Preserve existing published tags and npm versions:
never move a release tag or republish a version.

The repository root package is private to prevent accidental root publication.
Do not run `npm publish` from the repository root.

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

## Prepare

Review `git log --format=fuller PREVIOUS_TAG..HEAD` and the full diff. Write
customer-facing notes for the intended changes, including dependency and
migration requirements. Add a section `## VERSION - YYYY-MM-DD` to
`CHANGELOG.md`, then run:

```sh
npm run release:prepare -- VERSION
```

`-- patch` accepts the suggested candidate (an already prepared unpublished
version, otherwise the next patch). Preparation checks synchronized main,
registry state, changelog, tests, builds and package contents, and writes the
version into `packages/studio/package.template.json`. It never commits, pushes,
tags or publishes.

## Publish

After reviewing and committing the intended files, push main and an annotated
tag at that commit, only when publication is intended:

```sh
git push origin main
git tag -a vVERSION -m "DOM Studio VERSION"
git push origin vVERSION
```

The `Publish DOM Studio` workflow (`.github/workflows/release.yml`) verifies the
annotated tag is on main and matches the package version, builds and tests the
package, publishes the tarball with npm trusted publishing, verifies its
registry integrity, then creates the GitHub Release from that version's
changelog section. Reruns (`workflow_dispatch` with the existing tag) resume an
interrupted publish only when the existing npm tarball has the identical
integrity hash, and preserve existing GitHub Release notes.

## One-time configuration

- In the npm package settings for `@getdom/studio`, the GitHub trusted publisher
  is owner `steve-obrien`, repository `dom-studio-source`, workflow
  `release.yml`, environment `npm-release`, allowing direct `npm publish`.
- The GitHub environment `npm-release` exists in this repository. Add release
  approval or tag protection rules there as desired.
- npm trusted publishing requires a GitHub-hosted runner; the workflow uses
  Ubuntu and Node 24. The repository is private, so npm provenance is not
  available. Never make the repository public as a release workaround.

## Website release history

`.github/workflows/release-history.yml` exports stable, published GitHub
Releases from this repository and atomically replaces
`$APP_DIR/shared/release-history.json` on the production server. It runs on the
self-hosted `dom-studio` runner with the `production` environment's VM secrets.

The sync stays off until the `RELEASE_HISTORY_SYNC` repository variable is set
to `true`. Before enabling it, register the runner for this repository,
configure the `production` environment secrets, and recreate the published
0.2.x GitHub Releases here. The export reads only this repository's releases,
so enabling it earlier would drop older entries from the website snapshot.
Until then the website keeps serving its last good snapshot.

`RELEASES_FILE` optionally overrides the snapshot path. The local app's
`/releases` page uses the bundled historical baseline unless `RELEASES_FILE`
supplies a validated public snapshot. An optional `RELEASES_GITHUB_TOKEN` can
read releases from this repository directly; it is not required for local
development.

## Secret scanning

Run [Gitleaks](https://github.com/gitleaks/gitleaks) 8.30.1 or newer against the
committed history before tagging a release:

```sh
gitleaks git . --redact --log-opts="--all"
```

The checked-in configuration retains the default rules and allows only two
literal, nonfunctional demo/test values at their exact fixture paths. It does
not exclude whole source directories. Keep real credentials in an ignored
`.env` file and review every new finding.
