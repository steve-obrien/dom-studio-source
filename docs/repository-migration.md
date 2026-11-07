# Development repository migration

Development now belongs in `steve-obrien/dom-studio-source`, kept private initially.
The existing local `getdom.studio` project folder is the clean checkout;
`dom-studio-source` is an alias to the same folder. Both use this repository
and its `main` branch. Create new branches from that `main`.
Package releases also come from this repository. The previous repository remains
intact for rollback and still runs production site deployment. Do not continue
independent product development in both places.

## Preserved history

The migration imports the current product mainline, including development since
the initial sharing snapshot, with historical author/committer names and dates
preserved. Personal author addresses are normalized to the owner's GitHub
no-reply address. The reviewed sharing snapshot remains an ancestor. The update
can be pushed normally; it does not require replacing the existing main branch
with a force push.

Private-application paths, credential files, internal artifacts, and historical
file versions containing private-application data were removed before import.
This includes affected historical versions of shared routing, metadata, and
documentation files. Their current reviewed versions are present. Some historical
checkouts are therefore incomplete; this history is for development provenance
and comparison, not a promise that every old revision is independently runnable.
Commits made empty by the filtering were pruned. Internal agent-session links
were removed from messages. Filtered commits have new IDs.

Release markers are named `history/v0.2.0` through `history/v0.2.6`. They do not
replace published version tags or claim a new package release. Historical tags
are not triggers for publication. Official tags and GitHub Releases for 0.2.6
and earlier remain in the previous repository; preserve them and existing npm
versions.

Never merge or mirror the unfiltered original repository into this one. An old
branch can reintroduce the removed material through its ancestors, even if its
latest files look clean. Move outstanding work with reviewed patches or filter
its entire reachable history first. Re-run Gitleaks against every imported ref.

## Existing working changes

The outstanding homepage, embedded demo, and data-grid resizing changes were
transferred to this repository's `main` on 2026-11-01 after updating from origin.
The original checkout, including its uncommitted files and ignored local
configuration, is retained in a separate legacy backup. Its local agent
instructions direct future development to this checkout. Existing Codex project
and Dock Run paths continue to use `getdom.studio`, now backed by the clean
repository. Local credentials remain in ignored configuration, outside Git.

Use this repository and its `main` branch as the default for new work. Additional
changes made in the old checkout after the transfer must still be reviewed and
moved as patches; never merge its unfiltered history. Keep the original available
until the operational changeover below is verified and its deletion is explicitly
requested.

## Production and package publication

Package releases moved to this repository with 0.2.7. `.github/workflows/release.yml`
publishes `@getdom/studio` from annotated `vVERSION` tags on main through npm
trusted publishing with the `npm-release` environment; see
[releases](releases.md). The npm trusted publisher for `@getdom/studio` names
this repository, `release.yml` and `npm-release`. Do not republish an existing
version or move an old published tag.

Production site deployment remains attached to the previous repository until
its own changeover is verified:

1. Restore and review the deployment workflow in this repository and configure
	its `production` environment.
2. Configure deployment credentials and the trusted runner for this repository,
	or use an appropriate isolated runner. Repository secrets cannot be copied
	by reading their old plaintext through GitHub's API.
3. Point the production checkout at the new repository and selected reviewed
	commit. Verify migration compatibility and the built application's health
	before enabling automatic deployments here or retiring the old path.

Website release-history synchronization (`release-history.yml`) is present here
but stays off until the `RELEASE_HISTORY_SYNC` repository variable is `true`.
Enable it only after the runner and `production` secrets above are configured
and the published 0.2.x GitHub Releases have been recreated here, so the
website snapshot keeps its older entries. Then retire the previous
synchronization workflow.

The original repository should stay private. Retire its development and
operational entry points only after their replacements are verified.
