# DOM Studio releases

The reviewed source is `CHANGELOG.md`. Git tags identify the released source;
npm contains the package; GitHub Releases contain the published announcement.
The public `/releases` page reads those announcements through a server cache.

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
- Set `RELEASES_GITHUB_TOKEN` on the website server to a fine-grained token with
  read-only Contents permission for this private repository. Keep it server-side.
  Restart the service after setting it. No write permission is needed for the feed.

The repository is private. Trusted publishing works, but npm provenance is not
available for private repositories. Never make the repository public as a release
workaround. Public notes must be reviewed for private information before publishing.

## Website history and failure recovery

The server fetches GitHub Releases at most once per minute, excludes drafts and
prereleases, exposes only title/version/publication date/body, and renders Markdown
with raw HTML disabled. It retains the last successful feed on upstream failure.
Without a token, or after a cold start during an outage, it serves the bundled
0.2.0 record verified against its existing tag and npm publication timestamp.
0.2.1 remains hidden until its GitHub Release is published. No new website deploy
is needed for subsequent notes; the initial `/releases` implementation must deploy.
Version permalinks use `/releases#v0.2.1`. This page enters the sitemap automatically.

The existing website deployment still runs on main pushes independently of npm.
Check its workflow and public page before describing a website change as live.
If npm succeeds but GitHub fails, rerun the tag workflow. If GitHub succeeds but
the website has stale notes, check the server token, connectivity and cache refresh.
Do not republish an npm version to repair a website failure.

The old 0.2.0 changelog predates its npm publication by one day; the website shows
the actual npm publication date. Earlier 0.1.x notes have not been reconstructed.
