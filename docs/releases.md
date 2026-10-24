# DOM Studio releases

The reviewed source is `CHANGELOG.md`. Git tags identify the released source;
npm contains the package; GitHub Releases contain the published announcement.
The public `/releases` page reads a synchronized snapshot of those announcements
through a server cache. GitHub Releases remain the source of truth.

## Prepare

Review `git log --format=fuller PREVIOUS_TAG..HEAD` and the full working-tree diff.
Write customer-facing notes for the intended changes, including dependency and
migration requirements. Keep unrelated work outside the release commit. Add a
section `## VERSION - YYYY-MM-DD` to `CHANGELOG.md` and run:

```sh
npm run release:prepare -- 0.2.1
```

`npm run release:prepare` prompts for a version. `-- patch` accepts the suggested
candidate (an already prepared unpublished version, otherwise the next patch).
Preparation checks synchronized main, registry state, changelog, tests, builds,
and package contents. Registry failures stop preparation. It leaves the version
change for review even if validation fails; it never publishes or auto-commits.
The `npm run release` alias does the same preparation. Do not run `npm publish`
from the repository root.

After reviewing and committing the intended files, push main and an annotated
tag at that commit. Example, only when publication is intended:

```sh
git push origin main
git tag -a v0.2.1 -m "DOM Studio 0.2.1"
git push origin v0.2.1
```

The tag workflow validates the source, builds and tests the package, publishes
the tarball, verifies its registry integrity, then creates the GitHub Release
using that version's changelog section. Reruns can resume after an interrupted
publish only when the existing npm tarball has the identical integrity hash.
They preserve existing GitHub Release notes. Never move a release tag.

## One-time configuration

- In npm package settings configure a GitHub trusted publisher for owner
  `steve-obrien`, repository `dom.studio`, workflow `release.yml`, environment
  `npm-release`, allowing direct `npm publish`.
- Create the GitHub environment `npm-release`; apply the desired release approval
  and tag protection rules. The workflow uses a GitHub-hosted runner and Node 24.
- The release-history workflow uses the existing `production` environment and VM
  deployment secrets. Its temporary GitHub token reads published releases; no
  GitHub credential needs to be installed on the website server.

Website deployment and release-history sync run on the dedicated `worker-dom-studio`
runner. npm publishing stays on GitHub-hosted Ubuntu because npm trusted publishing
does not support self-hosted runners. See [worker operations](github-actions.md)
for labels, service commands, and recovery.

The repository is private. Trusted publishing works, but npm provenance is not
available for private repositories. Never make the repository public as a release
workaround. Public notes must be reviewed for private information before publishing.

## Website history and failure recovery

After a successful `Publish DOM Studio` workflow, `release-history.yml` fetches
all GitHub Releases and exports only stable, published title/version/date/body
records. Drafts, prereleases, private repository metadata and credentials are
excluded. Human release publication, editing, deletion and unpublication also
trigger synchronization; manual dispatch backfills or retries the same snapshot.
The completion trigger is intentional: release events created with GitHub's
workflow token do not trigger another workflow.

The sync uploads to a temporary file, then atomically replaces
`$APP_DIR/shared/release-history.json`. Deployments symlink that shared file into
each release directory, so notes survive app deployments and rollbacks. The server
reloads it at most once per minute, validates the complete snapshot before replacing
its cache, and retains the last good history on failure. Markdown disables raw HTML.
A new release needs neither a website rebuild nor a server restart.

`RELEASES_FILE` optionally overrides the snapshot path. If the file is absent,
`RELEASES_GITHUB_TOKEN` still supports the legacy direct GitHub integration; without
either source the server uses the verified bundled 0.2.0 baseline. A malformed
snapshot does not replace good cached notes. Version permalinks use
`/releases#v0.2.4`; the release page is included in the sitemap.

The existing website deployment still runs on main pushes independently of npm.
Check its workflow and public page before describing a website change as live.
If npm succeeds but GitHub fails, rerun the tag workflow. If GitHub succeeds but
the website has stale notes, inspect the `Sync published release history` workflow,
retry it with manual dispatch, then check the shared snapshot, deployment symlink
and one-minute cache refresh.
Do not republish an npm version to repair a website failure.

If the workflow itself needs repair, commit the workflow fix to main and use
its manual dispatch with `release_tag` set to the existing annotated tag. It
checks out and validates that original source, without moving the tag. The
workflow explicitly refreshes the tag object because checkout can otherwise
replace an annotated tag with its peeled commit in the runner's local clone.
Recovery uses the publishing driver from the workflow commit, while all package
contents, notes, builds and tests still come from the unchanged release tag.

The old 0.2.0 changelog predates its npm publication by one day; the website shows
the actual npm publication date. Earlier 0.1.x notes have not been reconstructed.
