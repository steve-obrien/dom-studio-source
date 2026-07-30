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

- [ ] `commerce/booking/availability-pricing-calendar`
- [x] `commerce/checkout-review` — responsive checkout flow, rich `DomSelect` dropdowns, compact order rows, readiness feedback, and sticky summary.
- [ ] `commerce/post-purchase/delivery-tracker`
- [ ] `commerce/post-purchase/pickup-handoff`
- [ ] `commerce/returns-portal`

### Communication

- [ ] `communication/changelog-publisher`
- [ ] `communication/chat`
- [ ] `communication/mail`

### Compliance

- [ ] `compliance/audit/audit-log-explorer`
- [ ] `compliance/data-retention`
- [ ] `compliance/identity-verification`

### Content management

- [ ] `content-management/localization/localization-review-workbench`
- [ ] `content-management/media/media-asset-picker`
- [ ] `content-management/navigation/app-navigation-builder`

### Conversion

- [ ] `conversion/appointment-booking`
- [ ] `conversion/login`
- [ ] `conversion/onboarding`
- [ ] `conversion/product-tours/product-tour-builder`

### Data capture

- [ ] `data-capture/data-import`
- [ ] `data-capture/forms`

### Developer experience

- [ ] `developer-experience/ai-agents/agent-run-trace`
- [ ] `developer-experience/ai-prompt-lab`
- [ ] `developer-experience/api-keys`
- [ ] `developer-experience/api-request-console`
- [ ] `developer-experience/cursor-workspace`
- [ ] `developer-experience/integration-marketplace`
- [ ] `developer-experience/webhooks`

### Documents

- [ ] `documents/document-signing`
- [ ] `documents/proposal-editor`
- [ ] `documents/review/ai-document-review`

### Financial services

- [ ] `financial-services/cards/card-control-center`
- [ ] `financial-services/disputes/card-dispute-flow`

### Marketing

- [ ] `marketing/campaign-composer`
- [ ] `marketing/growth/referral-program`

### Monetization

- [x] `monetization/billing` — organization-scoped billing context, responsive payment-method management, accessible invoice history, editable legal and tax preferences, provider-safe Stripe collection guidance, and working tab, default-method, dialog, filter, and save states.
- [ ] `monetization/packaging/entitlement-matrix`
- [ ] `monetization/usage-limits`
- [ ] `monetization/usage-metering/usage-event-reconciliation`

### Operations

- [ ] `operations/approval-workflow`
- [ ] `operations/approvals/mobile-approval-queue`
- [ ] `operations/bulk-actions`
- [ ] `operations/customer-health`
- [ ] `operations/customer-success/customer-activity-feed`
- [ ] `operations/feature-flags`
- [ ] `operations/finance/expense-capture`
- [ ] `operations/incident-response`
- [ ] `operations/infrastructure/virtual-machine-control-panel`
- [ ] `operations/logistics/field-dispatch-map`
- [ ] `operations/sales/sales-pipeline-kanban`
- [ ] `operations/scheduling/resource-scheduler`
- [ ] `operations/support-center`
- [ ] `operations/team-members`

### Product management

- [ ] `product-management/feedback-board`
- [ ] `product-management/roadmap-timeline`

### Reliability

- [ ] `reliability/status-page`

### Trust and safety

- [ ] `trust-and-safety/content-moderation`

### Work management

- [ ] `work-management/saved-filters`
- [ ] `work-management/sprint-planning`
- [ ] `work-management/workflow-automation`
