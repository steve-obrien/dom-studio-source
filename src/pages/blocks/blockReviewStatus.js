export const blockReviews = Object.freeze([
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
		blockPath: 'commerce/checkout-review',
		reviewedAt: '2026-07-17',
		components: ['DomButton', 'DomCard', 'DomCheckbox', 'DomSelect', 'DomStatusPill', 'DomTextInput'],
		summary: 'Rebuilt the checkout as a responsive full-screen flow with rich selection controls, compact item rows, clearer readiness feedback, and a sticky desktop summary.',
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
