export const blockReviews = Object.freeze([
	{
		blockPath: 'account-settings/notification-preferences',
		reviewedAt: '2026-07-28',
		components: ['DomButton', 'DomCard', 'DomSelect', 'DomStatusPill', 'DomTimeSelector', 'DomToggle'],
		summary: 'Rebuilt the clipped channel matrix as a responsive settings workflow with rich category, cadence, and timezone choices, grouped channel switches, required-route protection, and working save and restore states.',
	},
	{
		blockPath: 'account-settings/privacy/privacy-control-center',
		reviewedAt: '2026-07-29',
		components: ['DomAccordion', 'DomButton', 'DomCard', 'DomDialog', 'DomRadioGroup', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomToggle'],
		summary: 'Rebuilt the oversized privacy stack as a contained tabbed workflow with responsive consent choices, rich retention and export selects, human-readable review state, DOM Studio action rows, and working save and data-export request flows.',
	},
	{
		blockPath: 'account-settings/security/enterprise-sso-setup',
		reviewedAt: '2026-07-29',
		components: ['DomAccordion', 'DomBadge', 'DomButton', 'DomCard', 'DomCodeInput', 'DomDialog', 'DomProgress', 'DomRadioGroup', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomTagCombobox', 'DomTextInput', 'DomToggle'],
		summary: 'Rebuilt the card-heavy SSO page as a staged setup workflow with verified readiness gates, rich per-group role selection, working copy and save feedback, safe test and activation dialogs, and responsive mobile and iframe layouts.',
	},
	{
		blockPath: 'account-settings/security/step-up-verification',
		reviewedAt: '2026-07-29',
		components: ['DomAlert', 'DomBadge', 'DomButton', 'DomCard', 'DomCheckbox', 'DomConfirmationCodeInput', 'DomDialog', 'DomEmptyState', 'DomPasswordInput', 'DomStatusPill', 'DomTabs'],
		summary: 'Rebuilt the oversized policy-card composition as a compact sensitive-action workflow with policy-filtered methods, segmented code entry, recoverable errors, separate recovery guidance, scoped unlock success, and responsive iframe and mobile layouts.',
	},
	{
		blockPath: 'account-settings/session-security',
		reviewedAt: '2026-07-29',
		components: ['DomAlert', 'DomBadge', 'DomButton', 'DomCard', 'DomDialog', 'DomEmptyState', 'DomProgress', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomTextInput', 'DomToggle'],
		summary: 'Rebuilt the dense three-column security center as focused session, protection, and activity workflows with rich device and event selection, confirmed revocation, working rename and trust actions, precise readiness, CSV export, and responsive iframe layouts.',
	},
	{
		blockPath: 'analytics/funnel-analytics',
		reviewedAt: '2026-07-29',
		components: ['DomAlert', 'DomBadge', 'DomButton', 'DomCard', 'DomDialog', 'DomProgress', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomTextareaInput', 'DomToggle'],
		summary: 'Rebuilt the dense three-column analytics screen as a focused query, conversion, segment, and follow-up workflow with rich selectors, live mock datasets, factual freshness, visible drop-off, working insight, cohort, and CSV actions, and responsive iframe layouts.',
	},
	{
		blockPath: 'analytics/report-builder',
		reviewedAt: '2026-07-29',
		components: ['DomAlert', 'DomBadge', 'DomButton', 'DomCard', 'DomCheckbox', 'DomDialog', 'DomEmailInput', 'DomEmptyState', 'DomProgress', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomTextInput'],
		summary: 'Rebuilt the dense three-column report screen as a focused Build, Delivery, and Activity workflow with rich selectors, preview-first mobile ordering, accurate freshness readiness, responsive chart and table results, and working recipient, CSV, draft, and publish actions.',
	},
	{
		blockPath: 'analytics/retention/cohort-retention-heatmap',
		reviewedAt: '2026-07-29',
		components: ['DomAlert', 'DomBadge', 'DomButton', 'DomCard', 'DomDialog', 'DomProgress', 'DomRadioGroup', 'DomSelect', 'DomStatusPill', 'DomTextareaInput', 'DomToggle', 'DomToggleButtonGroup', 'DomTooltip'],
		summary: 'Rebuilt the oversized retention screen as a viewport-owned investigation workspace with rich selectors, accessible semantic cells, a responsive desktop matrix, compact mobile cohort focus, and working CSV and saved-investigation actions.',
	},
	{
		blockPath: 'app-shells/dashboard',
		reviewedAt: '2026-07-17',
		components: ['DomButton', 'DomCard', 'DomDropdown', 'DomSelect', 'DomStatusPill'],
		summary: 'Reworked the full-screen composition, responsive navigation, content hierarchy, narrow iframe behavior, and reporting-period selection.',
	},
	{
		blockPath: 'app-shells/ai-workspaces/ai-collaboration-shell',
		reviewedAt: '2026-07-17',
		components: ['DomAvatar', 'DomButton', 'DomCard', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomToggle', 'DomTooltip'],
		summary: 'Rebuilt the supervised-AI workspace around the active human decision, with rich agent and workstream selectors, a compact desktop rail, responsive review rows, and working approval states.',
	},
	{
		blockPath: 'app-shells/application-layout',
		reviewedAt: '2026-07-28',
		components: ['DomAvatar', 'DomButton', 'DomCard', 'DomDialog', 'DomDrawer', 'DomEmptyState', 'DomIconButton', 'DomProfileMenu', 'DomSelect', 'DomStatusPill'],
		summary: 'Rebuilt the fixed-height demo card as a viewport-owned customer-health application with independent desktop navigation, a responsive mobile drawer, rich reporting-period selection, profile actions, and a working account-review flow.',
	},
	{
		blockPath: 'app-shells/collapsible-sidebar-shell',
		reviewedAt: '2026-07-28',
		components: ['DomAvatar', 'DomButton', 'DomCard', 'DomDrawer', 'DomEmailInput', 'DomIconButton', 'DomPasswordInput', 'DomProfileMenu', 'DomSelect', 'DomStatusPill', 'DomUrlInput', 'DomTooltip'],
		summary: 'Ported Scout’s improved application shell back into the block with an in-panel desktop collapse control, real navigation links, a flush-edge mobile drawer, viewport-owned scrolling, a responsive profile menu, rich DOM Studio selects, and a less box-heavy content plan.',
	},
	{
		blockPath: 'app-shells/command-palette',
		reviewedAt: '2026-07-28',
		components: ['DomAvatar', 'DomButton', 'DomCard', 'DomCommandPalette', 'DomDrawer', 'DomEmptyState', 'DomIconButton', 'DomProfileMenu', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomToggle'],
		summary: 'Rebuilt the fixed-height demo as a viewport-owned command workspace with responsive navigation, rich workspace selection, a profile menu, compact recent-work rows, meaningful command results, and a working mobile launcher.',
	},
	{
		blockPath: 'collaboration/review/screen-annotation-review',
		reviewedAt: '2026-07-29',
		components: ['DomAlert', 'DomAvatar', 'DomBadge', 'DomButton', 'DomCard', 'DomDialog', 'DomProgress', 'DomRadioGroup', 'DomSelect', 'DomStatusPill', 'DomTextareaInput', 'DomTextInput', 'DomToggle', 'DomToggleButtonGroup', 'DomTooltip'],
		summary: 'Rebuilt the rounded screen-within-a-screen review as a viewport-owned workflow with a real responsive checkout target, accessible pins, rich filtering and assignment, focused mobile thread navigation, and working reply, resolution, and annotation creation actions.',
	},
	{
		blockPath: 'collaboration/share-permissions',
		reviewedAt: '2026-07-29',
		components: ['DomAlert', 'DomAvatar', 'DomBadge', 'DomButton', 'DomDialog', 'DomEmailInput', 'DomEmptyState', 'DomProgress', 'DomSelect', 'DomStatusPill', 'DomTabs', 'DomToggle', 'DomToggleButtonGroup'],
		summary: 'Rebuilt the three-column dashboard as a people-first sharing panel with API-backed resource reads, permission updates, invitations, revocation, server validation, reload persistence, rich selection controls, reviewable diffs, and focused mobile People and Access views.',
	},
	{
		blockPath: 'commerce/checkout-review',
		reviewedAt: '2026-07-17',
		components: ['DomButton', 'DomCard', 'DomCheckbox', 'DomSelect', 'DomStatusPill', 'DomTextInput'],
		summary: 'Rebuilt the checkout as a responsive full-screen flow with rich selection controls, compact item rows, clearer readiness feedback, and a sticky desktop summary.',
	},
	{
		blockPath: 'monetization/billing',
		reviewedAt: '2026-07-28',
		components: ['DomButton', 'DomDialog', 'DomNativeSelect', 'DomStatusPill', 'DomTabs', 'DomTextInput'],
		summary: 'Rebuilt the billing block as an organization-scoped console with responsive payment methods, invoice history, legal and tax preferences, provider-safe Stripe boundaries, and working billing interactions.',
	},
]);

const reviewByBlockPath = new Map(blockReviews.map((review) => [review.blockPath, review]));

/**
 * Returns the completed quality review for a canonical block path, or null
 * when the block remains in the review queue.
 *
 * @param {string} blockPath Canonical path relative to src/pages/blocks.
 * @returns {{ blockPath: string, reviewedAt: string, components: string[], summary: string } | null}
 */
export function getBlockReview(blockPath) {
	return reviewByBlockPath.get(blockPath) || null;
}
