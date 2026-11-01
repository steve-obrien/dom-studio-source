# Development repository migration

Development now belongs in `steve-obrien/dom-studio-source`, kept private initially.
The existing local `getdom.studio` project folder is the clean checkout;
`dom-studio-source` is an alias to the same folder. Both use this repository
and its `main` branch. Create new branches from that `main`.
The previous repository remains intact for rollback and its existing operational
configuration. Do not continue independent product development in both places.

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
are not triggers for publication. Preserve official tags and existing npm
versions in the original release system.

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

Moving development does not move GitHub repository settings or external service
bindings. At migration time, deployment, release-history synchronization, and
npm publication are still attached to the previous operational repository.
No site deployment or npm publication is performed by this migration.

Complete the operational changeover as a separate verified step:

1. Restore and review the required deployment and release workflows in this
	repository. Configure its `production` and `npm-release` environments.
2. Configure deployment credentials and the trusted runner for this repository,
	or use an appropriate isolated runner. Repository secrets cannot be copied
	by reading their old plaintext through GitHub's API.
3. Point the production checkout at the new repository and selected reviewed
	commit. Verify migration compatibility and the built application's health
	before enabling automatic deployments here or retiring the old path.
4. Update the npm trusted publisher to this repository's reviewed release
	workflow and environment before the next new package version. Do not
	republish an existing version or move an old published tag.
5. Retain the existing published release-note snapshot and update its source
	for future releases before retiring the previous synchronization workflow.

The original repository should stay private. Retire its development and
operational entry points only after their replacements are verified.
