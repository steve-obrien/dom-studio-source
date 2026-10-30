const longDocumentContent = {
	type: 'doc',
	content: [
		{
			type: 'heading',
			attrs: { level: 1 },
			content: [{ type: 'text', text: 'Launching the research workspace' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'This working draft brings the launch narrative, rollout decisions, customer evidence, and publishing checklist into one document. It is intentionally long enough to exercise editing controls while the page scrolls.' }],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Why the workspace exists' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'Research currently arrives through interviews, support conversations, analytics notes, and product reviews. Teams can collect plenty of evidence, but the useful context is often split across tools by the time a decision needs to be made.' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'The workspace gives every study a durable home. Raw observations stay close to the synthesis, reviewers can see how a conclusion was reached, and the final recommendation can move into delivery without losing its source material.' }],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'The first release' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'The initial release focuses on the smallest complete research loop: create a study, collect notes, tag recurring themes, write a synthesis, and share the result. Templates provide a starting point without forcing every team into the same method.' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'Import and export remain deliberately simple. Teams can paste existing notes, attach supporting files, and export the final document as structured content for publishing in another part of the product.' }],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'What customers told us' }],
		},
		{
			type: 'blockquote',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'I do not need another place to store notes. I need the evidence to stay visible when we decide what to build.' }] }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'That distinction shaped the experience. The product is not positioned as a generic notebook. It is a decision workspace where evidence, interpretation, review, and the resulting action remain connected.' }],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Rollout approach' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'We will begin with eight design partners who already run recurring discovery programmes. Their existing studies will be migrated into the workspace, giving the team realistic volume and structure before the feature reaches a broader audience.' }],
		},
		{
			type: 'bulletList',
			content: [
				{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Week one: migrate active studies and confirm access rules.' }] }] },
				{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Week two: observe synthesis and review workflows.' }] }] },
				{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Week three: measure sharing, return visits, and completed decisions.' }] }] },
			],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Success measures' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'The primary measure is the percentage of active studies that reach a reviewed synthesis. Supporting measures include time from first note to shared recommendation, the number of reviewers who open the evidence, and whether a decision is linked back to the study.' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'Activity alone will not be treated as success. A busy workspace that produces no clearer decisions would add process without adding value, so qualitative follow-up remains part of the launch review.' }],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Known risks' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'Permissions are the most sensitive part of the release. Studies can contain customer details and unreleased product thinking, so workspace access must be explicit and inherited sharing needs to be easy to inspect.' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'The second risk is premature structure. Tags and templates should help teams find patterns, but they should not turn early observations into fixed categories before researchers have had time to understand what they are seeing.' }],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Publishing checklist' }],
		},
		{
			type: 'orderedList',
			content: [
				{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Confirm the launch claim against the latest customer evidence.' }] }] },
				{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add one annotated product image from the approved media library.' }] }] },
				{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ask product, research, and support leads to review the final draft.' }] }] },
				{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Publish the structured document and retain this editable source.' }] }] },
			],
		},
		{
			type: 'heading',
			attrs: { level: 2 },
			content: [{ type: 'text', text: 'Next decision' }],
		},
		{
			type: 'paragraph',
			content: [{ type: 'text', text: 'After the design-partner review, the team will decide whether the next investment should improve evidence capture, synthesis assistance, or publishing. That choice will be based on where users lose the most time in the complete workflow rather than which feature attracts the most requests in isolation.' }],
		},
	],
};

/**
 * Creates an independent long document for scrolling editor demos.
 *
 * @returns {Record<string, unknown>} Cloned Tiptap JSON document.
 */
export function createLongDocumentContent() {
	return JSON.parse(JSON.stringify(longDocumentContent));
}
