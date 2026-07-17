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
3. Recompose with DOM Studio components.
	- Prefer exported DOM Studio Vue components over native controls or bespoke versions of components the library already owns.
	- Use `DomSelect` as the default replacement for `DomNativeSelect` so blocks demonstrate styled dropdowns, rich option descriptions, metadata, and custom option rows.
	- Use `DomCombobox` when a longer option set benefits from search and committed selection.
	- Keep `DomNativeSelect` only when the compact operating-system control is intentional; note that decision in the review.
	- Look beyond forms: use appropriate cards, buttons, badges, status pills, tabs, toggles, dialogs, dropdowns, and data components to demonstrate realistic composition.
4. Remove the shrunken-screen effect.
	- Full application screens should own the iframe viewport with a responsive `min-h-screen` composition, not sit inside a large rounded demo card.
	- Let section blocks size to their content; do not make every block pretend to be a full screen.
	- Use theme tokens and semantic classes instead of one-off raw colours.
	- Reduce box-in-box styling. Prefer spacing, dividers, typography, and one or two meaningful surfaces for hierarchy.
5. Make the block responsive to its actual iframe width.
	- Treat the iframe as the viewport; do not rely on the width of the parent documentation page.
	- Verify the existing breakpoints against the content rather than assuming desktop classes are sufficient.
	- Reflow navigation, summaries, tables, and primary actions for narrow widths.
	- Avoid horizontal scrolling unless the content is genuinely tabular and a compact mobile alternative would lose meaning.
6. Check interaction and accessibility.
	- Give every control a programmatic label and expose selected, current, expanded, checked, disabled, and error states correctly.
	- Confirm keyboard focus remains visible.
	- Exercise the primary action and every control that affects its readiness.
	- Check that the visual state and underlying model agree after interaction.
7. Verify before marking complete.
	- Run the smallest relevant build or validation command.
	- Test the isolated preview at desktop and mobile widths.
	- Test the documentation viewer's full-screen expansion.
	- Review browser console errors and horizontal overflow.
	- Update `block.meta.js`, the block docs copy, and `blockReviewStatus.js` when the reviewed behavior has materially changed.

## Definition of done

A block is reviewed only when all of these are true:

- [ ] The primary task is clear and the main action is reachable.
- [ ] The block uses DOM Studio components wherever a suitable library component exists.
- [ ] Selection controls prefer `DomSelect`, use `DomCombobox` when search is useful, and retain `DomNativeSelect` only for an intentional native experience.
- [ ] Full-screen and section-level composition match the block's actual purpose.
- [ ] Desktop, mobile, iframe, and expanded viewer layouts have been checked.
- [ ] Interaction state, labels, focus, and basic accessibility have been checked.
- [ ] There is no unintended horizontal overflow or clipped essential content.
- [ ] The block builds successfully and its review record is updated.

## Review queue

### Account settings

- [ ] `account-settings/notification-preferences`
- [ ] `account-settings/privacy/privacy-control-center`
- [ ] `account-settings/security/enterprise-sso-setup`
- [ ] `account-settings/security/step-up-verification`
- [ ] `account-settings/session-security`

### Analytics

- [ ] `analytics/funnel-analytics`
- [ ] `analytics/report-builder`
- [ ] `analytics/retention/cohort-retention-heatmap`

### App shells

- [x] `app-shells/ai-workspaces/ai-collaboration-shell` — responsive review-first composition, rich `DomSelect` agent and workstream controls, semantic status components, compact decision rows, and working accept/apply states.
- [ ] `app-shells/application-layout`
- [ ] `app-shells/collapsible-sidebar-shell`
- [ ] `app-shells/command-palette`
- [x] `app-shells/dashboard` — responsive app shell, full-screen composition, mobile navigation, hierarchy, and a rich `DomSelect` reporting control.

### Collaboration

- [ ] `collaboration/review/screen-annotation-review`
- [ ] `collaboration/share-permissions`

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

- [ ] `monetization/billing`
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
