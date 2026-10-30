# Block review programme

Use this document as the repeatable instruction set and action queue for reviewing every block in `src/pages/blocks`.

The live Blocks page reads completed reviews from `blockReviewStatus.js`. Keep that file and the checkbox queue below in sync: only check a block after its implementation and browser verification are complete.

## Review instructions

1. Inspect the current block before editing.
	- Open the isolated iframe preview, not only the documentation page.
	- Capture the current desktop and mobile states.
	- Expand the preview to a full-screen viewport and confirm whether the composition represents a section, a panel, or a complete application screen.
	- Record visible issues such as clipped content, excessive nested boxes, weak hierarchy, wasted space, horizontal overflow, hidden primary actions, or desktop-only navigation.
2. Clarify the block's primary user task.
	- Make the primary task and action legible within the first viewport.
	- Remove decorative structure that competes with the task.
	- Use realistic data and ensure visible controls change meaningful state.
3. Build a working app section, not a nearly working screenshot.
	- Data-led blocks should read and mutate through real repository-local API routes instead of keeping their source of truth in the component.
	- Cover loading, success, validation, empty, and recoverable failure states that the workflow can genuinely encounter.
	- Verify saved mutations by reloading the preview. If the demo API is intentionally process-local, document that boundary and show the production persistence seam.
	- Prefer focused REST-shaped routes for reads and mutations so teams can lift both the UI and its contract into a real application.
4. Choose an intentional visual precedent and preserve variety.
	- Look at mature products with the same workflow and borrow useful interaction hierarchy, density, and disclosure patterns without copying branding or protected assets.
	- Record the precedent in the review notes when it materially shaped the result, such as a Figma- or Google Drive-style sharing panel, a Linear-style issue workflow, or a Stripe-style billing surface.
	- Do not make every block a dashboard of rounded cards. Let dialogs, split panes, rails, canvases, inspectors, lists, command surfaces, sheets, timelines, and focused forms look appropriate to their task.
	- Keep DOM Studio tokens and components as the shared design language even when the composition pattern changes.
5. Recompose with DOM Studio components.
	- Prefer exported DOM Studio Vue components over native controls or bespoke versions of components the library already owns.
	- Use `DomSelect` as the default replacement for `DomNativeSelect` so blocks demonstrate styled dropdowns, rich option descriptions, metadata, and custom option rows.
	- Use `DomCombobox` when a longer option set benefits from search and committed selection.
	- Keep `DomNativeSelect` only when the compact operating-system control is intentional; note that decision in the review.
	- Look beyond forms: use appropriate cards, buttons, badges, status pills, tabs, toggles, dialogs, dropdowns, and data components to demonstrate realistic composition.
6. Remove the shrunken-screen effect.
	- Full application screens should own the iframe viewport with a responsive `min-h-screen` composition, not sit inside a large rounded demo card.
	- Let section blocks size to their content; do not make every block pretend to be a full screen.
	- Use theme tokens and semantic classes instead of one-off raw colours.
	- Reduce box-in-box styling. Prefer spacing, dividers, typography, and one or two meaningful surfaces for hierarchy.
7. Make the block responsive to its actual iframe width.
	- Treat the iframe as the viewport; do not rely on the width of the parent documentation page.
	- Verify the existing breakpoints against the content rather than assuming desktop classes are sufficient.
	- Reflow navigation, summaries, tables, and primary actions for narrow widths.
	- Avoid horizontal scrolling unless the content is genuinely tabular and a compact mobile alternative would lose meaning.
8. Check interaction and accessibility.
	- Give every control a programmatic label and expose selected, current, expanded, checked, disabled, and error states correctly.
	- Confirm keyboard focus remains visible.
	- Exercise the primary action and every control that affects its readiness.
	- Check that the visual state and underlying model agree after interaction.
9. Verify before marking complete.
	- Run the smallest relevant build or validation command.
	- Test the isolated preview at desktop and mobile widths.
	- Test the documentation viewer's full-screen expansion.
	- Review browser console errors and horizontal overflow.
	- Update `block.meta.js`, the block docs copy, and `blockReviewStatus.js` when the reviewed behavior has materially changed.

## Definition of done

A block is reviewed only when all of these are true:

- [ ] The primary task is clear and the main action is reachable.
- [ ] Data-led workflows use working API reads and mutations, expose realistic request states, and preserve saved changes across a preview reload.
- [ ] The composition has an intentional workflow-appropriate precedent and adds design variety instead of repeating the same rounded-card dashboard.
- [ ] The block uses DOM Studio components wherever a suitable library component exists.
- [ ] Selection controls prefer `DomSelect`, use `DomCombobox` when search is useful, and retain `DomNativeSelect` only for an intentional native experience.
- [ ] Full-screen and section-level composition match the block's actual purpose.
- [ ] Dense desktop layouts reflow into visible controls at narrow widths instead of hiding essential choices behind internal horizontal scrolling.
- [ ] Desktop, mobile, iframe, and expanded viewer layouts have been checked.
- [ ] Interaction state, labels, focus, and basic accessibility have been checked.
- [ ] There is no unintended horizontal overflow or clipped essential content.
- [ ] The block builds successfully and its review record is updated.

## Review queue

### Account settings

- [x] `account-settings/notification-preferences` — contained settings composition with rich category, cadence, and timezone `DomSelect` controls, responsive channel `DomToggle` groups, `DomTimeSelector` quiet hours, required-route protection, and working save/restore states.
- [x] `account-settings/privacy/privacy-control-center` — contained tabbed settings composition with rich retention and export `DomSelect` controls, responsive consent toggles, human-readable review state, DOM Studio action rows, and working save/export request flows.
- [x] `account-settings/security/enterprise-sso-setup` — contained three-stage SSO workflow with verified progress, rich per-group role `DomSelect` controls, working copy/save/test/activation states, responsive reflow, and rollout safeguards.
- [x] `account-settings/security/step-up-verification` — compact sensitive-action workflow with policy-filtered `DomTabs`, segmented `DomConfirmationCodeInput`, passkey and password states, recoverable code errors, separate recovery guidance, scoped unlock success, and responsive iframe composition.
- [x] `account-settings/session-security` — focused Sessions, Protection, and Activity workflow with rich device and event `DomSelect` controls, working rename and trust actions, confirmed revocation, precise readiness progress, recovery guidance, CSV export, and responsive iframe composition.

### Analytics

- [x] `analytics/funnel-analytics` — focused query, Conversion, Segments, and Follow-up workflow with rich funnel and filter `DomSelect` controls, factual freshness state, live mock datasets, semantic progress and status components, working insight, cohort, and CSV actions, and responsive iframe composition.
- [x] `analytics/report-builder` — focused Build, Delivery, and Activity workflow with rich report and configuration `DomSelect` controls, preview-first mobile ordering, accurate freshness readiness, responsive chart/table results, working recipient, CSV, draft, and publish actions, and full-screen iframe composition.
- [x] `analytics/retention/cohort-retention-heatmap` — viewport-owned retention workspace with rich segment and mobile cohort `DomSelect` controls, responsive desktop matrix and compact mobile focus, accessible semantic cells, working CSV and investigation actions, and DOM Studio status, progress, dialog, radio, toggle, and button components.

### App shells

- [x] `app-shells/ai-workspaces/ai-collaboration-shell` — responsive review-first composition, rich `DomSelect` agent and workstream controls, semantic status components, compact decision rows, and working accept/apply states.
- [x] `app-shells/application-layout` — viewport-owned customer-health workspace with independent desktop navigation, a responsive `DomDrawer`, rich `DomSelect` reporting periods, a real `DomProfileMenu`, compact account rows, and a working `DomDialog` review flow.
- [x] `app-shells/collapsible-sidebar-shell` — Scout-inspired responsive shell with an in-panel desktop collapse control, real navigation links, a flush-edge mobile `DomDrawer`, responsive `DomProfileMenu`, viewport-owned scrolling, and rich `DomSelect` controls.
- [x] `app-shells/command-palette` — viewport-owned command workspace with a mobile `DomDrawer`, rich `DomSelect` workspace switching, `DomProfileMenu`, responsive recent-work rows, visible command results, and a working `DomCommandPalette`.
- [x] `app-shells/dashboard` — responsive app shell, full-screen composition, mobile navigation, hierarchy, and a rich `DomSelect` reporting control.

### Collaboration

- [x] `collaboration/review/screen-annotation-review` — viewport-owned screen review with a real responsive checkout target, accessible spatial pins, rich thread and assignee `DomSelect` controls, compact screen/thread switching, working replies, resolution, annotation creation, and DOM Studio feedback, identity, progress, dialog, radio, toggle, and status components.
- [x] `collaboration/share-permissions` — Figma- and Google Drive-inspired people-first sharing panel with API-backed resource loading, role updates, invitations, revocation, general access, safeguards, reload persistence, rich `DomSelect` controls, and focused mobile People/Access views.

### Commerce

- [x] `commerce/booking/availability-pricing-calendar` — Airbnb-inspired host calendar with an API-backed inventory store, responsive month and focused day views, rich listing and availability `DomSelect` controls, exact money and stay inputs, saved date drafts, partner hold imports, validated publishing, reload persistence, and a desktop calendar-canvas inspector.
- [x] `commerce/checkout-review` — responsive checkout flow, rich `DomSelect` dropdowns, compact order rows, readiness feedback, and sticky summary.
- [x] `commerce/post-purchase/delivery-tracker` — Shop- and Uber-inspired status-first delivery experience with API-backed orders, courier checkpoints, rich order and drop-off `DomSelect` controls, persistent instructions, actionable access-code resolution, server-owned carrier updates, delivered-state proof, and compact responsive reflow.
- [x] `commerce/post-purchase/pickup-handoff` — Target Drive Up- and Shopify POS-inspired pickup desk with API-backed arrivals, rich order and location `DomSelect` controls, item staging, substitution consent, segmented code verification, restricted-item checks, reload persistence, server-owned completion gates, handoff proof, and responsive desktop and mobile layouts.
- [x] `commerce/returns-portal` — Loop- and Amazon-inspired guided return with API-backed order eligibility, per-item reason `DomSelect` controls, exchange stock, refund and credit estimates, saved drafts, server-owned readiness checks, reload persistence, immutable RMA proof, label handoff, and responsive desktop and mobile steps.

### Communication

- [x] `communication/changelog-publisher` — Linear- and GitHub-inspired release editor with API-backed drafts, rich release, audience, reviewer, and schedule `DomSelect` controls, channel previews, server-owned publishing checks, optimistic revisions, review and approval gates, scheduling or immediate publication, reload persistence, delivery proof, and responsive Write, Preview, and Publish views.
- [x] `communication/chat` — Intercom- and Zendesk-inspired support copilot built from `DomAgentChatShell` and `DomAgentConversationList`, with API-backed queue and message persistence, custom tool evidence, rich specialist and priority `DomSelect` controls, retry recovery, optimistic revisions, resolve/reopen lifecycle, a responsive context `DomDrawer`, and viewport-owned desktop and mobile layouts.
- [x] `communication/mail` — Superhuman- and Shortwave-inspired mail workspace with API-backed folders and thread reads, optimistic read, star, and label state, rich filter and snooze `DomSelect` controls, replies, composition, drafts, archive undo, reload persistence, a resizable desktop split view, and focused mobile folder, list, and reader states.

### Compliance

- [x] `compliance/audit/audit-log-explorer` — Vercel Activity-, Datadog Logs-, and Sentry-inspired investigation workspace with server-side search, rich saved-view and filter `DomSelect` controls, paginated events, responsive list and evidence inspector, JSON metadata, change diffs, optimistic legal holds, saved views, alert rules, verified export proof, API validation states, reload persistence, and a viewport-owned desktop and mobile composition.
- [x] `compliance/data-retention` — Google Vault- and AWS lifecycle-inspired retention control plane with API-backed policy reads, server-calculated impact, revisioned drafts, approval and publication gates, signed version proof, legal-hold creation and release, validation and stale-write recovery, reload persistence, rich DOM Studio selects and inputs, and viewport-owned desktop and mobile workflows.
- [x] `compliance/identity-verification` — Persona- and Stripe Identity-inspired guided verification with API-backed resume state, validated profile saves, rich DOM Studio selects, recoverable provider capture, opaque evidence references, server-owned screening, saved consent, optimistic conflicts, support requests, acknowledgement gates, checksum submission proof, reload persistence, and focused desktop and mobile workflows.

### Content management

- [x] `content-management/localization/localization-review-workbench` — Lokalise- and Phrase-inspired translation workbench with API-backed release and locale reads, rich release, locale, and status `DomSelect` controls, focused string editing, translation-memory suggestions, server-owned QA, glossary handoff, optimistic revisions, acknowledgement-gated publishing, immutable bundle proof, reload persistence, and responsive desktop panes and mobile drawers.
- [x] `content-management/media/media-asset-picker` — Cloudinary- and Contentful-inspired media workspace built around `DomMediaBrowser`, with server-filtered collections, rich `DomSelect` controls, recoverable ingestion, metadata approval, optimistic revisions, archive and restore actions, receipt-backed insertion, reload persistence, and responsive desktop rails and mobile drawers.
- [x] `content-management/navigation/app-navigation-builder` — Webflow- and Shopify-inspired navigation studio with a responsive hierarchy, real app-shell preview, focused metadata inspector, rich `DomSelect` and `DomIconSelector` controls, server-filtered audience modes, API-backed create, edit, reorder, and archive operations, registered-route and policy validation, optimistic conflicts, immutable publish receipts, reload persistence, and mobile drawers.

### Conversion

- [x] `conversion/appointment-booking` — Calendly- and Cal.com-inspired scheduling section with rich `DomRadioGroup` appointment choices, `DomSelect` timezones and cancellation reasons, rolling server availability, optimistic slot revisions, expiring holds, attendee validation, immutable confirmation proof, API-backed cancellation, and viewport-owned desktop and mobile journeys.
- [x] `conversion/login` — Linear- and 1Password-inspired workspace gateway with password and passwordless entry, documented demo credentials, server rate limits, expiring single-use verification codes, rich workspace `DomSelect` handoff, signed session proof, explicit revocation, recoverable API errors, and content-owned desktop and mobile scrolling.
- [x] `conversion/onboarding` — Notion- and Linear-inspired activation workspace with resumable server state, optimistic revisions, rich workspace, region, role, and source `DomSelect` controls, prioritized outcomes, recoverable provider permissions, scoped invitations, readiness gates, immutable launch proof, a useful post-launch handoff, and viewport-owned desktop and mobile composition.
- [x] `conversion/product-tours/product-tour-builder` — Appcues- and Pendo-inspired authoring studio with a live product canvas, responsive Canvas, Steps, and Inspector modes, rich target and audience `DomSelect` controls, revisioned API drafts, target validation, preview sessions, exact-revision launch checks, signed publication receipts, reload persistence, and viewport-owned desktop and mobile composition.

### Data capture

- [x] `data-capture/data-import` — HubSpot- and Airtable-inspired customer import workspace with distinct rich `DomSelect` mappings, responsive Map, Review, and Run modes, API-backed optimistic revisions, server validation proof, blocked-row CSV receipts, acknowledgement-gated job creation, deterministic worker progress, reload persistence, completion proof, and viewport-owned desktop and mobile composition.
- [x] `data-capture/forms` — Typeform- and Airtable-inspired form operations workspace with API-backed draft settings, exact-revision checks, acknowledgement-gated publishing, rich `DomSelect` and structured field controls, public submission validation, spam rejection, immutable response receipts, response triage, reload persistence, and viewport-owned desktop and mobile views.

### Developer experience

- [x] `developer-experience/ai-agents/agent-run-trace` — Sentry- and LangSmith-inspired trace investigation workspace with a dense run rail and waterfall, responsive Runs, Trace, and Inspector views, rich `DomSelect` controls, payload-free list reads, lazy redacted payload access, optimistic investigation ownership, server validation, replay and eval creation, redacted export proof, conflict recovery, reload persistence, and viewport-owned iframe composition.
- [x] `developer-experience/ai-prompt-lab` — OpenAI Playground-, Anthropic Console-, and Braintrust-inspired prompt registry with API-backed exact-revision saves, reusable production-derived eval datasets, deterministic run evidence, output checks and diffs, rich `DomSelect` controls, server validation, optimistic conflict recovery, acknowledgement-gated human review, reload persistence, and responsive Dataset, Prompt, Results, and Release views.
- [x] `developer-experience/api-keys` — Stripe-, Vercel-, and GitHub-inspired credential lifecycle with API-backed safe inventory reads, one-time create and rotate receipts, hashed secret storage, rich owner, environment, lifetime, and overlap `DomSelect` controls, server-owned scope and origin policy, staged overlap completion, auditable revocation, optimistic conflict recovery, reload persistence, and responsive Keys, Details, and Security views.
- [x] `developer-experience/api-request-console` — Postman- and Insomnia-inspired API workbench with responsive Library, Request, Response, and Context views, rich `DomSelect` environment and authorization controls, server-resolved variables, credential redaction, allowlisted endpoints, scope checks, production-write confirmation, revisioned saved templates, immutable run history, recoverable validation and conflicts, reload persistence, and viewport-owned iframe composition.
- [x] `developer-experience/cursor-workspace` — GitHub Codespaces- and Cursor-inspired repository change session with responsive Files, Editor, Agent, and Review views, rich `DomSelect` model controls, API-backed file reads and optimistic saves, contextual agent proposals, per-file `DomTextDiff` review, exact-revision patch application, rollback receipts, focused test evidence, settings persistence, conflict recovery, reload persistence, and viewport-owned iframe composition.
- [x] `developer-experience/integration-marketplace` — Linear-, Sentry-, and Stripe-inspired connections workspace with responsive Catalog, Details, and Connection views, rich `DomSelect` filters and runtime controls, API-backed OAuth and credential setup, server-owned required scopes, optimistic settings revisions, connection tests, manual sync evidence, provider requests, guarded disconnects, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `developer-experience/webhooks` — Svix-, Stripe-, and GitHub-inspired webhook delivery workspace with responsive Endpoints, Deliveries, and Endpoint views, repository-local APIs, server-owned event contracts, exact-revision endpoint settings, immutable signed request and response evidence, synthetic test sends, guarded replays, one-time signing-secret rotation, disable and enable receipts, conflict recovery, reload persistence, rich `DomSelect` controls, and viewport-owned iframe composition.

### Documents

- [x] `documents/document-signing` — DocuSign-, Dropbox Sign-, and Adobe Sign-inspired envelope room with responsive Envelopes, Document, and Details views, meaningful agreement content, rich DOM Studio controls, exact-revision recipient and delivery contracts, server-owned field placement and readiness, checksum-gated version approval, provider-style sending, guarded reminders and callbacks, signing-order enforcement, immutable evidence, certificate retrieval, void receipts, conflict recovery, reload persistence, and viewport-owned iframe composition.
- [x] `documents/proposal-editor` — Qwilr-, PandaDoc-, and Notion-inspired proposal room with responsive Proposals, Content, and Details views, meaningful client-facing sections, rich DOM Studio controls, exact-revision authoring and delivery contracts, line-item commercials, anchored comment resolution, reviewer evidence, server-owned readiness, provider-style sending, deterministic client views and acceptance, immutable receipts, conflict recovery, and reload persistence.
- [x] `documents/review/ai-document-review` — Ironclad-, Harvey-, and GitHub-review-inspired contract desk with responsive Documents, Contract, and Review views, cited AI findings, rich `DomTextDiff` and `DomSelect` controls, exact-revision human decisions, high-risk acknowledgement, clause patching, analysis invalidation and reruns, required reviewer gates, server readiness, immutable release and redline receipts, conflict recovery, and reload persistence.

### Financial services

- [x] `financial-services/cards/card-control-center` — Revolut-, Wise-, and Stripe Issuing-inspired card operations desk with responsive Cards, Controls, and Activity views, rich DOM Studio inputs, API-backed exact-revision policy updates, immediate freeze and unfreeze, validated travel notices, single-use step-up detail reveal, acknowledgement-gated replacement lifecycle, immutable receipts, conflict recovery, reload persistence, and viewport-owned iframe composition.
- [x] `financial-services/disputes/card-dispute-flow` — Monzo-, Revolut-, and Stripe disputes-inspired resolution workspace with responsive Transactions, Claim, Evidence, and Case views, rich DOM Studio controls, API-backed exact-revision intake, typed evidence records, server-owned eligibility and network checks, immediate card protection, acknowledgement-gated filing, provisional-credit decisions, immutable receipts, conflict recovery, reload persistence, and viewport-owned iframe composition.

### Marketing

- [x] `marketing/campaign-composer` — Customer.io- and HubSpot-inspired campaign operations section with responsive Message, Audience, Preview, Launch, and Results views, rich DOM Studio controls, API-backed exact-revision drafts, server-calculated audience proof, provider-style test receipts, server-owned checks, acknowledgement-gated scheduling, immutable launch evidence, deterministic worker progress, reload persistence, and viewport-owned iframe composition.
- [x] `marketing/growth/referral-program` — Wise- and Dropbox-inspired referral wallet with responsive Invite, Referrals, Rewards, and Activity views, rich DOM Studio controls, API-backed exact-revision preferences, validated provider invites, signed share attribution, deterministic lifecycle webhooks, server-owned qualification and milestone bonuses, immutable billing-ledger redemption evidence, reload persistence, conflict recovery, and viewport-owned iframe composition.

### Monetization

- [x] `monetization/billing` — organization-scoped billing context, responsive payment-method management, accessible invoice history, editable legal and tax preferences, provider-safe Stripe collection guidance, and working tab, default-method, dialog, filter, and save states.
- [x] `monetization/packaging/entitlement-matrix` — Stripe- and LaunchDarkly-inspired packaging control plane with dense version, plan, and entitlement views, rich DOM Studio controls, exact-revision API edits, server-owned customer impact and release checks, provider-style checkout evidence, acknowledgement-gated publication, immutable release proof, deterministic multi-surface rollout, reload persistence, and responsive mobile, embedded, and expanded composition.
- [x] `monetization/usage-limits` — Vercel- and Stripe-inspired usage-governance console with focused policy, forecast, exception, and release views, rich DOM Studio controls, exact-revision API edits, server-owned account and billing impact, notification delivery receipts, finance and customer-exception approvals, authoritative release checks, acknowledgement-gated publication, immutable release proof, deterministic gateway, billing, and notification rollout, reload persistence, and responsive mobile, embedded, and expanded composition.
- [x] `monetization/usage-metering/usage-event-reconciliation` — Stripe-, Metronome-, and Lago-inspired reconciliation desk with responsive queue, evidence, resolution, and release views, rich DOM Studio controls, exact-revision ownership and source-versus-rated comparison, append-only corrections, invoice-preview diffs, finance approval, schema replay, authoritative release checks, acknowledgement-gated publication, immutable provider receipts, deterministic rollout, reload persistence, conflict recovery, and viewport-owned iframe composition.

### Operations

- [x] `operations/approval-workflow` — GitHub-, Ramp-, and ServiceNow-inspired decision inbox with responsive Review, Policy, and Activity views, rich DOM Studio controls, exact-revision ownership and evaluation, immutable configuration diffs and evidence, server-owned separation-of-duties and reviewer-scope checks, DPA recovery, approval delegation, structured decisions, acknowledgement-gated execution, immutable receipts, deterministic gateway, monitoring, and audit rollout, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/approvals/mobile-approval-queue` — Brex Tasks- and Microsoft Power Automate-inspired mobile approvals app with responsive Tasks, Review, Policy, and Activity views, rich DOM Studio mobile primitives and `DomSelect` controls, API-backed exact revisions, server-owned policy evaluation, request-bound trusted-device step-up, structured decisions, checksummed evidence, information requests and evidence recovery, specialist escalation, immutable receipts, deterministic undo, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/bulk-actions` — Shopify- and Zendesk-inspired bulk change desk with responsive Select, Review impact, and Run views, rich DOM Studio controls, exact-revision server drafts, immutable before-and-after previews, eligibility exclusions, approval routing, acknowledgement-gated jobs, queued cancellation, deterministic progress, safe-update partial failures, focused retry, receipts, reload persistence, and viewport-owned iframe composition.
- [x] `operations/customer-health` — Gainsight- and Vitally-inspired customer recovery desk with responsive Portfolio, Health evidence, Timeline, and Recovery plan views, rich DOM Studio controls, weighted sourced scorecards, exact workspace and account revisions, immutable plan previews, acknowledgement-gated launch, accountable tasks, CRM synchronization, official timeline entries, intervention-based health recalculation, immutable receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/customer-success/customer-activity-feed` — Intercom- and Stripe-inspired customer activity inbox with responsive Account, Feed, Detail, and Work views, rich DOM Studio controls, exact workspace, account, event, and task revisions, source receipts and raw payloads, event reviews, immutable task and outbound-message previews, acknowledgement-gated execution, accountable task completion, durable notes, provider delivery proof, pagination, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/feature-flags` — LaunchDarkly- and PostHog-inspired release control room with responsive Flags, Targeting, and Release views, rich DOM Studio controls, exact workspace and configuration revisions, immutable change previews, deterministic context evaluation, independent approval, acknowledgement-gated publication, guardrail monitoring, restore-point rollback, immutable audit and stream receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/finance/expense-capture` — Ramp-, Brex-, and Expensify-inspired expense operations inbox with responsive Inbox, Details, and Checks views, rich DOM Studio controls including `DomSelect`, a generated receipt asset, API-backed exact workspace and expense revisions, receipt verification, card matching, server-owned policy evaluation, immutable route previews, acknowledgement-gated submission, manager approval, accounting export and reimbursement receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/incident-response` — PagerDuty-, Statuspage-, and Rootly-inspired incident command room with responsive Incidents, Command, and Updates views, rich DOM Studio controls including `DomSelect`, API-backed exact workspace and incident revisions, unique accountable roles, source and monitoring evidence, mitigation actions, immutable communication previews, acknowledgement-gated publishing, guarded monitoring and resolution transitions, provider receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/infrastructure/virtual-machine-control-panel` — DigitalOcean- and AWS EC2-inspired compute workspace with responsive Fleet, Machine, and Provision views, rich DOM Studio controls including `DomSelect`, API-backed exact revisions and machine versions, immutable provisioning previews, server-owned policy checks, acknowledgement-gated provider jobs, distinct system and instance health evidence, snapshots, power operations, provider receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/logistics/field-dispatch-map` — ServiceTitan-, Onfleet-, Samsara-, and Salesforce-inspired field operations console with responsive Queue, Map, and Dispatch views, a generated cartographic asset, rich DOM Studio controls including `DomSelect`, API-backed exact revisions and entity versions, immutable assignment previews, server-owned territory, skill, vehicle, capacity, and customer-window checks, acknowledgement-gated dispatch, live GPS refresh, driver delivery receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/sales/sales-pipeline-kanban` — Attio-, Pipedrive-, and Salesforce-inspired revenue desk with a dense five-stage desktop pipeline, responsive Pipeline, Deal, and Forecast views, rich DOM Studio controls including `DomSelect`, API-backed exact revisions and deal versions, immutable stage-transition previews, server-owned stage, buyer, close-plan, pricing, security, legal, mutual-plan, and forecast checks, acknowledgement-gated CRM saves, retained sales activity, forecast synchronization receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/scheduling/resource-scheduler` — Float-inspired workforce scheduling desk with responsive Schedule, People, Assignment, and Capacity views, a first-class `DomWeekPlanner` surface, rich DOM Studio controls including `DomSelect`, API-backed exact workspace and allocation versions, immutable availability previews, server-owned overlap, skill, service-area, working-hours, daily-capacity, and weekly-capacity checks, acknowledgement-gated assignment commits, status transitions, provider publication receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/support-center` — Intercom- and Zendesk-inspired human service desk with responsive Inbox, Conversation, and Details views, rich DOM Studio controls including `DomSelect`, API-backed exact workspace and ticket revisions, lazy ticket detail reads, public replies and internal notes, provider delivery receipts, safe failed-message retry, structured resolution gates, reopen support, reload persistence, conflict recovery, and viewport-owned iframe composition.
- [x] `operations/team-members` — Linear-, Vercel-, and GitHub-inspired people directory with responsive People, Access, and Invites views, rich DOM Studio controls including `DomSelect`, API-backed exact workspace and entity revisions, work-email, external-guest, team, duplicate, and paid-seat validation, immutable role previews, guarded suspension and access-policy changes, recoverable invitation delivery, CSV receipts, reload persistence, conflict recovery, and viewport-owned iframe composition.

### Product management

- [x] `product-management/feedback-board` — Linear Customer Requests- and Canny-inspired feedback operations workspace with a dense evidence-first inbox, responsive Inbox, Evidence, and Decision destinations, rich DOM Studio controls including `DomSelect`, API-backed customer insight capture, exact workspace and idea revisions, server-owned internal and public status compatibility, public responses with notification receipts, immutable duplicate previews, acknowledged merge commits, reload persistence, validation, conflict recovery, and viewport-owned iframe composition.
- [x] `product-management/roadmap-timeline` — Linear- and Productboard-inspired portfolio planning workspace with a dense project timeline, responsive Roadmap, Details, and Release destinations, rich DOM Studio controls including `DomSelect`, API-backed initiative creation and planning edits, exact workspace and initiative revisions, immutable dependency and capacity previews, acknowledged schedule commits, health updates with notification evidence, audience-specific inclusion and redaction previews, immutable publication receipts, reload persistence, validation, conflict recovery, and viewport-owned iframe composition.

### Reliability

- [x] `reliability/status-page` — Atlassian Statuspage- and Better Stack-inspired public reliability section with an impact-first incident narrative, quiet editorial availability evidence, responsive regional reflow, rich DOM Studio controls including `DomSelect`, server-derived component and top-level status, lazy component details, a JSON Feed-compatible public stream, exact subscription previews, confirmation delivery evidence, verified subscriber activation, immutable receipts, reload persistence, validation, conflict recovery, and viewport-owned desktop, embedded, and mobile composition.

### Trust and safety

- [x] `trust-and-safety/content-moderation` — Reddit-, YouTube Studio-, and Discord-inspired trust and safety desk with responsive Queue, Case, and Decision destinations, rich DOM Studio controls including `DomSelect`, lazy API-backed case details, exact workspace, case, and appeal revisions, accountable reviewer claims, durable internal notes, report and classifier evidence, immutable decision and appeal previews, server-owned action and policy gates, acknowledgement-gated enforcement, original-decision preservation, author delivery and audit receipts, reload persistence, structured validation, conflict recovery, and viewport-owned iframe composition.

### Work management

- [x] `work-management/saved-filters` — Linear-, Jira-, and Notion-inspired saved-view workspace with responsive Views, Results, and Query destinations, rich DOM Studio controls including `DomSelect` and `DomTagCombobox`, API-backed view navigation and issue evaluation, server-owned fields and operators, exact workspace and view revisions, immutable query previews, acknowledgement-gated creates and updates, explicit personal, team, and workspace visibility, subscriber notification receipts, favorites, activity history, reload persistence, structured validation, conflict recovery, and viewport-owned iframe composition.
- [x] `work-management/sprint-planning` — Linear-, Jira-, and GitHub Projects-inspired planning room with responsive Backlog, Cycle, and Review destinations, rich DOM Studio controls including `DomSelect`, repository-local APIs, exact workspace, sprint, and issue revisions, immutable scope previews, server-owned team and owner capacity, dependency and ownership checks, acknowledgement-gated scope moves and sprint commitment, audit and calendar receipts, reload persistence, structured validation, conflict recovery, and viewport-owned iframe composition.
- [x] `work-management/workflow-automation` — Zapier-, n8n-, and Workato-inspired automation operations room with responsive Workflows, Build, Test, Release, and Activity destinations, rich DOM Studio controls including `DomSelect`, repository-local APIs, exact workspace and workflow revisions, immutable draft and release previews, server-owned catalogs and readiness checks, side-effect-free sample traces, acknowledgement-gated saves and publication, audit and runtime receipts, reload persistence, structured validation, conflict recovery, and viewport-owned iframe composition.
