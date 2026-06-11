# Block Discovery Convention

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

Generation AI instructions:

- Create `src/pages/blocks/{category-path}/{block-slug}/Index.vue`.
- Put runnable examples in `src/pages/blocks/{category-path}/{block-slug}/examples/*.vue`.
- Add `block.meta.js` next to `Index.vue` only when you need to override the fallback metadata.
- Add `categoryDescription` only when the default category copy needs a more specific explanation for that block family.
- Use the folder slug as the only source of the block name.
- Declare `icon` as SVG path data for a `24x24` viewBox, drawn with strokes, no fill, and no outer `<svg>` wrapper.
- Keep the icon visually simple enough to render at `16px`.
- Use an existing category when it fits, or introduce a new stable category with `categoryOrder`.
- Keep `summary` to one sentence.

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

`src/pages/blocks/identity-verification` adds a copy/paste KYC and identity verification flow. It is intended for fintech onboarding, marketplaces, age-gated apps, healthcare portals, creator payouts, and compliance-heavy products where teams need to collect profile details, secure evidence, consent, risk signals, and reviewer notes before account activation.

Recommended future components:

- Provider session adapter: normalize Stripe Identity, Persona, Onfido, Veriff, Alloy, Middesk, or custom provider states into one packet shape.
- Camera capture step: provide mobile document framing, glare guidance, retake handling, and liveness capture states.
- Rejection reason templates: help reviewers send clear, localized retry instructions for expired IDs, blurry uploads, address mismatches, and unsupported countries.
- Re-verification scheduler: trigger renewal when documents expire, risk policy changes, payouts increase, or regulatory rules require refresh checks.

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
