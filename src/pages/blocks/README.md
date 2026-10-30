# Block Discovery And Authoring Guide

Blocks are copyable product surfaces. A good block should feel like a real screen from a real app, not a loose component demo. It should show how DOM Studio primitives compose into a complete workflow with realistic data, clear states, and enough interaction that a team can judge whether the pattern belongs in their product.

## What Good Blocks Do

- Start with the user job: make the workflow obvious from the first screen.
- Use realistic product density: dashboards, admin tools, editors, queues, and workspaces should feel useful to repeat users, not like marketing pages.
- Compose existing DOM Studio components first. Reach for headless-backed components such as drawers, dialogs, tabs, menus, popovers, command palettes, splitters, forms, and tree views before inventing local behavior.
- Keep examples runnable and copyable. The `examples/*.vue` file should own the demo state and interaction so copying the file still works.
- Include meaningful interactions: selection, filtering, editing, opening overlays, changing tabs, applying actions, or updating local state.
- Show important states directly in the UI: loading, empty, active, selected, warning, success, review, disabled, and destructive states when they matter.
- Use local helper components only when they make the block easier to copy or understand. Put them in `components/` and document them with code blocks.
- Avoid global CSS changes. Prefer scoped styles, utility classes, component props, and local CSS variables.
- Keep content domain-specific. Labels, row data, timestamps, statuses, and helper copy should sound like the product area the block represents.

## Documentation Expectations

Each block page should usually include:

- A `DocPage` with a concise tagline and useful tag.
- A primary `DocSection` containing an `Example` wired to the raw source with `?raw`.
- An `Integration` section explaining where the block fits and what to replace.
- A `Data` section showing the recommended payload shape.
- A `Customization` section calling out practical extension points.
- A `Local components` section when the block has helper SFCs in `components/`.

Always pass the raw example source into `Example`:

```vue
<script setup>
import Example from '../../../../_layout/docs/Example.vue';
import MyBlock from './examples/MyBlock.vue';
import MyBlockSrc from './examples/MyBlock.vue?raw';
</script>

<template>
	<Example
		:source="MyBlockSrc"
		filename="MyBlock.vue"
		description="Use this for..."
	>
		<MyBlock />
	</Example>
</template>
```

The shared `Example` renderer scans that source for DOM Studio `Dom*` components and automatically lists internal links to their documentation. Keep DOM Studio component imports explicit in the example file so the generated "Built with" list is accurate. If a helper component hides important dependencies, document that helper in the `Local components` section.

## File Shape

Blocks are auto-discovered anywhere below `src/pages/blocks` using the folder path that ends with `Index.vue`.

Required:

```text
src/pages/blocks/{category-path}/{block-slug}/Index.vue
```

`{category-path}` may contain one or more nested folders such as `operations/sales` or `content-management/navigation`.

The display name is always derived from `{block-slug}`. Do not declare a separate name.

Examples are auto-discovered from:

```text
src/pages/blocks/{category-path}/{block-slug}/examples/*.vue
```

`blockRegistry.js` counts those example files automatically for block index metadata. Example files are optional, but when present they should stay runnable and focused on one product scenario each.

Optional metadata lives in `src/pages/blocks/{category-path}/{block-slug}/block.meta.js` and must default-export an object:

```js
export default {
	category: 'App Shells',
	categoryDescription: 'Optional override for the category summary shown in the block index.',
	categoryOrder: 10,
	order: 10,
	tag: 'New',
	summary: 'A short plain-language description of the block.',
	icon: 'M4 5h16v14H4V5Zm5 0v14M12 9h5M12 13h4',
};
```

`categoryDescription` is optional only when the block uses one of the built-in top-level categories already described in `blockRegistry.js`: `App Shells`, `Account Settings`, `Communication`, `Conversion`, `Data Capture`, `Monetization`, `Operations`, or `Work Management`. Custom categories should set `categoryDescription` explicitly so the block index does not fall back to generic copy.

If `block.meta.js` is omitted, the block is still discovered with fallback values. The category path still comes from the folder structure first, so a block in `src/pages/blocks/operations/bulk-actions` still appears under `Operations`. `Uncategorised` is only used when no category folder can be derived:

- `category`: `Uncategorised`
- `categoryPath`: derived from the folder path before the block slug, otherwise `['Uncategorised']`
- `categoryDescription`: `Auto-discovered block family.`
- `categoryOrder`: `1000`
- `summary`: `Auto-discovered {block name} block.`
- `icon`: the default block icon
- `tag`: empty
- `order`: `1000`
- `exampleCount`: derived from `examples/*.vue`

## Generation Instructions

- Create `src/pages/blocks/{category-path}/{block-slug}/Index.vue`.
- Put runnable examples in `src/pages/blocks/{category-path}/{block-slug}/examples/*.vue`.
- Add `block.meta.js` next to `Index.vue` only when you need to override the fallback metadata.
- Add `categoryDescription` only when the default category copy needs a more specific explanation for that block family.
- Use the folder slug as the only source of the block name.
- Declare `icon` as SVG path data for a `24x24` viewBox, drawn with strokes, no fill, and no outer `<svg>` wrapper.
- Keep the icon visually simple enough to render at `16px`.
- Use an existing category when it fits, or introduce a new stable category with `categoryOrder`.
- Keep `summary` to one sentence.
- Use tabs for indentation in Vue, JavaScript, and CSS.
- Prefer existing exported components from `@getdom/studio/vue` over bespoke controls.
- Make the primary example interactive before adding extra explanatory sections.
- Verify the block route and preview route after changes.

## Block Notes And Future Recommendations

This section is intentionally curated rather than exhaustive. Use `src/pages/blocks/*/block.meta.js` and `blockRegistry.js` as the source of truth for the current block catalog; add notes here only when a block needs extra implementation context or concrete follow-on component ideas.

### Document Signing

`src/pages/blocks/document-signing` adds a copy/paste document signing packet builder for preparing contracts, agreements, consent forms, offer letters, and compliance documents. It is intended for HR onboarding, sales contract workflows, legal operations, marketplaces, fintech applications, and internal tools where users need to choose documents, manage signers, place required fields, configure delivery rules, satisfy send checks, and preserve an audit history.

Recommended future components:

- PDF page renderer: display real page thumbnails, zoom states, page navigation, and provider-backed page dimensions for accurate field placement.
- Drag field handles: move, resize, duplicate, and align signature fields while preserving page-relative coordinates.
- Signer row primitive: standardize signer identity, status, required role, signing order, delegation, and reminder controls across document workflows.
- Signature provider adapter: normalize DocuSign, Dropbox Sign, PandaDoc, Adobe Acrobat Sign, and custom signing services into one packet state model.

### Campaign Composer

`src/pages/blocks/campaign-composer` adds a copy/paste lifecycle marketing workspace for drafting and scheduling campaign messages. It is intended for SaaS growth tools, customer messaging products, ecommerce back offices, creator platforms, and internal marketing consoles where teams need to choose an audience, edit message content, preview channels, satisfy consent and frequency checks, and queue a send from one screen.

Recommended future components:

- Audience rule builder: standardize segment, exclusion, suppression, and frequency-cap controls across campaigns, notifications, experiments, and automations.
- Template token picker: expose approved personalization variables, fallback text, sample customer data, and invalid-token warnings in a reusable popover.
- Channel preview renderer: render email, push, SMS, and in-app previews with dark mode, locale fallback, truncation, and device-specific constraints.
- Send job monitor: show queued, sending, paused, throttled, failed, retried, and completed campaign jobs with cancellation and rollback guidance.

### Workflow Automation

`src/pages/blocks/workflow-automation` adds a copy/paste workflow automation builder for composing product rules. It is intended for SaaS admin consoles, CRM workflows, support operations, lifecycle marketing, billing operations, and internal tools where teams need to choose triggers, add conditions, sequence actions, test sample records, and review safety checks before publishing an automation.

Recommended future components:

- Event schema browser: expose typed trigger payloads, supported operators, sample events, and deprecation warnings from a central event catalog.
- Reusable condition row: standardize field, operator, value, validation, and remove behavior across filters, segments, automations, and alerting tools.
- Action connector picker: provide provider-specific configuration for email, Slack, CRM, ticketing, webhooks, billing, and internal task systems.
- Execution timeline: show queued, skipped, throttled, failed, retried, and completed automation runs with payload inspection and replay controls.

### Identity Verification

`src/pages/blocks/compliance/identity-verification` adds a complete, API-backed KYC and identity verification section. It is intended for fintech onboarding, marketplaces, age-gated apps, healthcare portals, creator payouts, and compliance-heavy products where teams need resumable profile collection, provider evidence capture, consent, server-owned screening, support handoff, and receipt-backed submission before account activation.

Recommended future components:

- Provider session adapter: normalize Stripe Identity, Persona, Onfido, Veriff, Alloy, Middesk, or custom provider states into one packet shape.
- Camera capture step: provide mobile document framing, glare guidance, retake handling, and liveness capture states.
- Rejection reason templates: help reviewers send clear, localized retry instructions for expired IDs, blurry uploads, address mismatches, and unsupported countries.
- Re-verification scheduler: trigger renewal when documents expire, risk policy changes, payouts increase, or regulatory rules require refresh checks.

### Localization Review Workbench

`src/pages/blocks/content-management/localization/localization-review-workbench` adds a complete, API-backed translation review section. It is intended for SaaS admin tools, content platforms, ecommerce back offices, developer portals, and release consoles where reviewers need source context, editable locale strings, translation memory, server-owned quality checks, glossary handoff, approval gates, and receipt-backed bundle publishing.

Recommended future components:

- Translation provider adapter: normalize Lokalise, Phrase, Crowdin, Transifex, GitHub, or an internal catalogue behind the demonstrated release and segment routes.
- Screenshot context panel: connect a string key to the exact product frame and breakpoint where its translation appears.
- Plural-form editor: provide locale-aware plural categories, placeholder protection, and per-form approval state.
- Reviewer comment thread: attach versioned discussion, mentions, and resolution evidence to a translation segment without mixing comments into the translated copy.

### Media Asset Picker

`src/pages/blocks/content-management/media/media-asset-picker` adds a complete, API-backed media selection and publishing section. It is intended for CMS products, marketing builders, ecommerce admin, product editors, and digital asset workflows where teams need server-filtered discovery, upload recovery, accessibility and license review, archiving, and receipt-backed insertion without leaving the editor.

Recommended future components:

- Direct-upload session adapter: issue signed provider uploads, track multipart progress, and hand completed file references into the demonstrated ingestion contract.
- Processing job timeline: expose malware scan, duplicate detection, metadata extraction, thumbnail generation, transcription, and retry states from background workers.
- Focal-point editor: store responsive crop intent for CDN transformations without destructively editing the source asset.
- Asset version comparison: replace a file while preserving its stable id, placements, metadata history, and rollback choices.

### App Navigation Builder

`src/pages/blocks/content-management/navigation/app-navigation-builder` adds a complete, API-backed navigation operations section. It is intended for SaaS admin, CMS tooling, app builders, customer portals, and internal platforms where teams need to edit nested destinations, preview role visibility, check application routes and feature flags, and publish a versioned menu without editing source code.

Recommended future components:

- Route-registry adapter: discover destinations, route parameters, owners, deprecations, and redirect targets directly from the application router.
- Scheduled navigation release: approve and publish a menu version at a future time with cancellation, rollback, and deployment status.
- Localization editor: manage translated menu labels with source-locale fallbacks, truncation warnings, and locale-specific preview personas.
- Version comparison: show hierarchy and metadata diffs between the active menu and a proposed draft before publication.

### Appointment Booking

`src/pages/blocks/conversion/appointment-booking` adds a complete API-backed scheduling journey for embedded sales, onboarding, services, clinic, and customer-success experiences. It combines rolling future availability, timezone-aware slots, optimistic contention checks, expiring holds, attendee details, confirmation proof, and cancellation in one responsive section.

Recommended future components:

- Calendar-provider adapter: connect Google Calendar, Microsoft Graph, Cal.com, or application-owned availability without changing the demonstrated client contract.
- Reminder policy editor: configure email, SMS, and in-app reminders with locale, consent, and delivery-state handling.
- Reschedule flow: reuse the booking management receipt to hold a replacement slot before releasing the original appointment.
- Booking management link: issue scoped, expiring attendee tokens for cancellation, rescheduling, guest updates, and joining instructions.

### Login Gateway

`src/pages/blocks/conversion/login` adds a complete API-backed authentication gateway for SaaS products, internal platforms, customer portals, and multi-workspace applications. It combines password and passwordless entry, second-factor verification, failed-attempt recovery, remembered-session policy, workspace authorization, signed handoff proof, reloadable session reads, and explicit revocation in one responsive section.

Recommended future components:

- Identity-provider adapter: normalize Auth0, Clerk, WorkOS, Cognito, OIDC, SAML, and application-owned authentication behind the demonstrated session and challenge contracts.
- Passkey enrolment: add WebAuthn registration, device naming, backup eligibility, and recoverable passkey errors without replacing the existing verification state model.
- Trusted-device manager: show remembered browsers, expiry, last activity, risk state, and remote revocation from the same session service.
- Organization discovery: resolve verified email domains into SSO, invite, or account-creation routes before accepting a password.

### Workspace Onboarding

`src/pages/blocks/conversion/onboarding` adds a complete API-backed activation section for SaaS products, collaboration tools, internal platforms, and multi-workspace applications. It resumes at the first incomplete task and combines revisioned workspace identity, rich role, region, team-size, and source selection, prioritized outcomes, provider connection, scoped teammate invitations, readiness calculation, immutable launch proof, reload persistence, and a useful post-launch handoff in one responsive section.

Recommended future components:

- Provider OAuth adapter: exchange the demonstrated source decision for real Linear, Notion, Jira, or application-owned authorization without changing the session contract.
- Background import monitor: expose queued, running, partial, failed, and completed import batches with retry and item-level failure evidence.
- Domain verification: verify workspace ownership before accepting vanity URLs, SSO discovery, or organization-wide invitation policies.
- Onboarding experiment adapter: vary task ordering and defaults while preserving server-owned completion and comparable activation analytics.

### Product Tour Builder

`src/pages/blocks/conversion/product-tours/product-tour-builder` adds a complete API-backed authoring section for onboarding platforms, feature-adoption products, growth consoles, and application-owned education tooling. It combines an interactive product canvas, registered target selection, visual tooltip placement, responsive step and inspector modes, revisioned draft mutations, server-calculated reach, short-lived preview sessions, exact-revision launch checks, and signed scheduling proof in one viewport-owned workspace.

Recommended future components:

- Selector-health crawler: verify registered targets against production and deploy-preview routes, capture screenshots, and flag device-specific drift before authors can publish.
- Tour runtime adapter: render the same placement, trigger, eligibility, progress, dismissal, and completion contracts inside the host application.
- Localization workbench: manage translated step copy, expansion warnings, locale fallbacks, and per-language review state without forking the tour sequence.
- Experiment analytics: connect exposure, holdout, completion, activation, and downstream conversion metrics to the immutable release reference returned by publication.

### Customer Data Import

`src/pages/blocks/data-capture/data-import` adds a complete API-backed customer-import section for CRM migrations, admin tools, billing platforms, marketplaces, and customer operations products. It combines rich target-to-source field mapping, responsive record review, server-owned readiness checks, optimistic revisions, downloadable blocked-row receipts, acknowledgement-gated job creation, deterministic worker progress, reload persistence, and an immutable completion proof in one viewport-owned workspace.

Recommended future components:

- Upload parser adapter: connect object storage, virus scanning, delimiter detection, encoding recovery, and schema inference without changing the demonstrated session contract.
- Saved mapping library: persist organization-owned presets, confidence, author, source system, and field-schema version for recurring imports.
- Import job worker: replace manual deterministic batches with queue-driven progress, item-level retries, cancellation, and dead-letter recovery.
- Error correction workbench: edit blocked cells inline, revalidate only changed rows, and merge the corrected subset into the original immutable source artifact.

### Form Operations

`src/pages/blocks/data-capture/forms` adds a complete API-backed form operations section for SaaS products, research tooling, customer-intake workflows, internal platforms, and embedded lead capture. It combines revisioned form settings, authoritative publication checks, acknowledgement-gated publishing, a working public response path, server validation and spam policy, immutable submission proof, response triage, reload persistence, and responsive Compose, Live form, and Responses views in one viewport-owned workspace.

Recommended future components:

- Field schema editor: add, remove, reorder, and configure conditional fields while preserving stable field ids and published-version compatibility.
- Embed and delivery adapter: generate signed embed configuration, webhook destinations, retry state, and provider-specific delivery logs from the demonstrated publication contract.
- Draft-resume token service: replace the documented draft seam with signed, expiring respondent sessions and cross-device recovery.

### Agent Run Trace

`src/pages/blocks/developer-experience/ai-agents/agent-run-trace` adds a complete API-backed trace investigation section for agent builders, AI operations consoles, evaluation products, and internal developer platforms. It combines a dense recent-run queue, nested trace waterfall, rich environment and span filtering, payload-free list reads, lazy redacted payload access, investigation ownership, optimistic revisions, server-validated replay and eval actions, immutable export evidence, reload persistence, and focused Runs, Trace, and Inspector layouts.

Recommended future components:

- Trace ingestion adapter: normalize OpenTelemetry, LangSmith, Phoenix, Braintrust, or application-owned spans into the demonstrated parent-linked run contract.
- Live run stream: append queued and running spans through server events while preserving stable selection, scroll position, and terminal-state evidence.
- Trace comparison: align two run revisions by span identity and expose prompt, model, latency, cost, tool result, and evaluation differences.
- Evaluation runner: replace the demo eval receipt with versioned datasets, graders, batch progress, regression thresholds, and links back to source traces.
- Response export job: create filtered CSV or JSON exports with background progress, audit evidence, retention rules, and expiring download receipts.

### Bulk Actions

`src/pages/blocks/bulk-actions` adds a copy/paste operations console for reviewing and executing sensitive batch changes. It is intended for admin tables, customer operations workspaces, billing operations, moderation queues, lifecycle automation, and data governance tools where operators need to select records, preview impact, satisfy policy checks, capture an audit reason, and queue work safely.

Recommended future components:

- Selection toolbar: provide reusable select all, clear, selected count, and filtered-segment controls for data tables.
- Bulk job progress timeline: show queued, approved, running, partial failure, retry, cancelled, and completed states.
- Approval routing panel: assign finance, legal, support, or operations reviewers based on action type and record risk.
- Rollback preview: show what can be undone, what requires a compensating action, and which records are irreversible.

### Usage Limits

`src/pages/blocks/usage-limits` adds a copy/paste monetization and revenue-operations workspace for managing metered product quotas. It is intended for SaaS settings, billing admin, customer success, and internal entitlement tools where teams configure hard limits, soft-limit alerts, overage behavior, customer exceptions, approvals, and audit history.

Recommended future components:

- Meter trend chart: show projected usage, expected reset usage, and likely overage before publishing a limit change.
- Entitlement diff preview: compare active plan limits with drafted overrides and customer exceptions.
- Approval routing panel: assign revenue, finance, or customer success reviewers when a limit exceeds a recommended cap.
- Usage alert recipient picker: manage per-workspace alert recipients, channels, and escalation rules.

### Data Retention

`src/pages/blocks/data-retention` adds a copy/paste compliance workspace for data lifecycle policies. It is intended for admin areas where teams configure retention windows, archive timing, anonymization, legal holds, deletion previews, approval checks, and audit history before publishing a policy version.

Recommended future components:

- Policy diff viewer: compare the active retention policy with the proposed policy before publication.
- Approval routing panel: assign legal, security, and data-owner reviewers with due dates and blocking states.
- Deletion job monitor: show queued, running, completed, skipped, and failed lifecycle jobs after a policy goes live.
- Hold scope picker: select records, accounts, regions, or cases protected by legal and investigation holds.

### Report Builder

`src/pages/blocks/report-builder` adds a copy/paste analytics workspace for building reusable reports from approved metrics. It is intended for SaaS dashboards, customer success tools, ecommerce reporting, marketing operations, and internal business intelligence where users need to choose datasets, metrics, date ranges, breakdowns, previews, recipients, cadence, and export format without writing SQL.

Recommended future components:

- Filter rule builder: create nested include/exclude rules for dimensions, cohorts, accounts, products, and event properties.
- Chart configuration editor: tune visualization type, axes, labels, colors, goal lines, and empty-state handling.
- Export job monitor: show queued, running, completed, failed, and retried scheduled exports with downloadable artifacts.
- Dashboard pinning picker: let users add a saved report to a dashboard, homepage, or team workspace with layout controls.

### Incident Response

`src/pages/blocks/incident-response` adds a copy/paste incident command center for production operations. It is intended for SaaS admin consoles, reliability tools, infrastructure products, customer support operations, and status-page workflows where teams need to coordinate severity, owners, affected services, customer impact, comms, mitigation tasks, and audit history during an active incident.

Recommended future components:

- Status-page channel picker: choose which components, customer cohorts, and public/private channels receive each update.
- PagerDuty/Opsgenie sync panel: show responders, escalation policy, handoff state, and acknowledgement timing from incident tooling.
- Postmortem draft generator: turn timeline events, tasks, impact windows, and follow-ups into a structured review document.
- SLA impact calculator: estimate affected accounts, contractual impact, downtime minutes, and customer-facing credit exposure.

### Status Page

`src/pages/blocks/status-page` adds a copy/paste customer-facing status center for reliability transparency. It is intended for SaaS apps, API platforms, infrastructure products, marketplaces, fintech portals, and developer tools where customers need current component health, uptime evidence, planned maintenance, incident history, and notification subscriptions without contacting support.

Recommended future components:

- Uptime sparkline primitive: standardize compact daily health bars, incident overlays, and accessible summaries for service rows.
- Status subscriber settings: confirm email ownership, manage alert channels, expose unsubscribe tokens, and support per-component preferences.
- Incident detail page: provide a public permalink with a complete update timeline, affected components, RSS/Atom links, and customer-facing root cause notes.
- Status event webhook: send signed component, incident, maintenance, and resolution events to customer automation systems.

### Feedback Board

`src/pages/blocks/feedback-board` adds a copy/paste product feedback workspace for feature request triage. It is intended for public feedback portals, private customer boards, product operations dashboards, and customer success workflows where teams need to collect requests, segment demand, weigh account value, set roadmap status, notify voters, and keep an audit trail.

Recommended future components:

- Duplicate request merger: identify similar requests, preserve voters, and redirect public links after consolidation.
- Changelog publisher: turn shipped feedback items into release notes, customer emails, and in-app announcements.
- Customer impact score: combine votes, ARR, plan tier, churn risk, support burden, and strategic tags into a transparent priority score.
- Issue tracker sync: connect request status and ownership with Jira, Linear, GitHub Issues, or internal planning tools.

### Customer Health

`src/pages/blocks/customer-health` adds a copy/paste customer success workspace for account health reviews. It is intended for SaaS admin consoles, revenue operations, account management tools, and customer success platforms where teams need to understand renewal risk, adoption, support pressure, executive context, expansion signals, and next-best actions in one place.

Recommended future components:

- Health score badge: standardize score, trend, status, and driver summaries for account rows, dashboards, and alerts.
- Account activity timeline: filter CRM, support, usage, billing, lifecycle, and product events without rebuilding timeline UI.
- Success playbook templates: create reusable task bundles for renewals, save plans, expansion discovery, onboarding rescue, and executive reviews.
- Renewal forecast panel: compare health movement, ARR, close date, stage, sponsor strength, and forecast category for revenue teams.

### Session Security

`src/pages/blocks/session-security` adds a copy/paste account security center for reviewing active sessions and recovery readiness. It is intended for account settings, workspace security pages, fintech profiles, healthcare portals, consumer apps, and admin consoles where users need to understand signed-in devices, revoke risky access, maintain MFA and passkeys, and review recent security events.

Recommended future components:

- Re-auth dialog: require password, passkey, or MFA confirmation before revoking sessions, changing recovery settings, exporting logs, or disabling protection.
- Passkey setup flow: guide users through device enrollment, naming, backup methods, and recovery fallback checks.
- Trusted-device manager: let users name devices, set trust expiration, and distinguish personal, shared, and managed hardware.
- Security event filters: search, export, and paginate account events by actor, device, region, IP, risk level, and event category.

### Changelog Publisher

`src/pages/blocks/changelog-publisher` adds a copy/paste release communication workspace for turning shipped product work into customer-facing announcements. It is intended for SaaS admin tools, product marketing consoles, developer portals, customer success workflows, and changelog CMS screens where teams need to select release notes, edit customer copy, choose audiences, preview channels, satisfy publish checks, and maintain an activity trail.

Recommended future components:

- Channel preview renderer: produce in-app, email, public changelog, and community snippets from the same structured entry.
- Release note picker: sync shipped issues, feature flags, docs pages, screenshots, and migration guides into a publishable note list.
- Approval checklist policy: block publication based on breaking changes, paid-plan gates, legal review, support enablement, analytics tags, and localization state.
- Announcement analytics panel: show impressions, email opens, in-app clicks, changelog views, dismissals, and customer success follow-up tasks.

### AI Prompt Lab

`src/pages/blocks/ai-prompt-lab` adds a copy/paste AI prompt engineering workspace for testing LLM-backed product workflows. It is intended for AI feature consoles, internal model playgrounds, prompt management tools, support automation builders, and QA workbenches where teams need to edit instructions, run eval cases, inspect generated output, review safety checks, and track cost and latency before release.

Recommended future components:

- Prompt diff viewer: compare current draft, approved production version, and proposed release notes before promotion.
- Eval dataset importer: turn CSV, JSONL, support tickets, docs pages, and failure logs into structured regression cases.
- Tool-call trace viewer: inspect tool inputs, outputs, retries, redactions, and policy decisions alongside the model answer.
- Prompt approval gate: route high-risk prompt changes through legal, trust, support, or product reviewers before rollout.

### Funnel Analytics

`src/pages/blocks/funnel-analytics` adds a copy/paste product analytics funnel explorer for understanding conversion through multi-step journeys. It is intended for growth teams, activation workspaces, ecommerce checkout analysis, onboarding analytics, lifecycle marketing, and product-led sales tools where users need to build funnels, compare segments, inspect step drop-off, reorder events, create cohorts, and save insights from one screen.

Recommended future components:

- Event picker: browse approved analytics events, property schemas, deprecation warnings, and sample payloads without hand-typing event names.
- Cohort export job monitor: show queued, syncing, failed, retried, and completed audience exports to CRM, lifecycle, warehouse, or ad platforms.
- Funnel annotation layer: attach launches, experiments, incidents, and marketing campaigns to chart periods so conversion changes have context.
- Query freshness warning: standardize sampled result badges, data freshness, bot filtering, identity resolution, and permission warnings across analytics blocks.

### Command Palette

`src/pages/blocks/command-palette` adds a copy/paste universal command palette shell for product navigation and high-frequency actions. It is intended for SaaS app shells, internal tools, developer dashboards, productivity products, and admin consoles where users need to search routes, records, reports, automations, settings, and creation flows from one keyboard-first entry point.

Recommended future components:

- Grouped command sections: render commands under navigation, records, actions, settings, and recent work headings while preserving keyboard selection.
- Remote command search: combine local commands with debounced API results, loading states, stale-result protection, and permission-aware empty states.
- Command action router: normalize route, modal, drawer, copy, download, and async job actions so palette selections stay consistent across products.
- Shortcut manager: let admins expose, remap, document, and measure keyboard shortcuts without hard-coding them into individual app surfaces.
