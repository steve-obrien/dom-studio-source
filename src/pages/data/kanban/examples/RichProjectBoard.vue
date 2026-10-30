<script setup>
import { markRaw, ref } from 'vue';
import { DomKanban } from '../../../lib/vue';
import ProjectFeatureCard from './ProjectFeatureCard.vue';

const columns = ref([
	{ key: 'discovery', label: 'Discovery', description: 'Validate the problem and expected outcome.' },
	{ key: 'delivery', label: 'Delivery', description: 'Design and implementation in progress.' },
	{ key: 'validation', label: 'Validation', description: 'QA, rollout, and customer feedback.' },
]);
const rows = ref([
	{
		id: 'project-1',
		title: 'Live dispatch overview',
		description: 'Give coordinators one map for technician locations and delayed jobs.',
		status: 'discovery',
		position: 0,
		area: 'Operations',
		cover: '/assets/blocks/field-dispatch-map/london-dispatch-map.png',
		tags: ['Research', 'Maps'],
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		dueLabel: 'Due 14 Aug',
		checklistComplete: 3,
		checklistTotal: 7,
	},
	{
		id: 'project-2',
		title: 'Receipt capture review',
		description: 'Let finance compare extracted fields against the original receipt.',
		status: 'delivery',
		position: 0,
		area: 'Finance',
		cover: '/assets/blocks/expense-capture/receipt-northstar-coffee.png',
		tags: ['OCR', 'Review'],
		owner: 'Owen Reed',
		ownerInitials: 'OR',
		dueLabel: 'Due 18 Aug',
		checklistComplete: 6,
		checklistTotal: 9,
	},
	{
		id: 'project-3',
		title: 'Saved operational views',
		description: 'Save filters, sorting, and display preferences across data surfaces.',
		status: 'delivery',
		position: 1,
		area: 'Platform',
		tags: ['Data', 'Preferences'],
		owner: 'Priya Shah',
		ownerInitials: 'PS',
		dueLabel: 'Due 21 Aug',
		checklistComplete: 4,
		checklistTotal: 6,
	},
	{
		id: 'project-4',
		title: 'Keyboard move semantics',
		description: 'Verify card and column movement without a pointer.',
		status: 'validation',
		position: 0,
		area: 'Accessibility',
		tags: ['Keyboard', 'QA'],
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		dueLabel: 'Due today',
		checklistComplete: 8,
		checklistTotal: 8,
	},
]);
const lastAction = ref('Custom cards can emit application actions without owning navigation.');
const cardComponent = markRaw(ProjectFeatureCard);

/**
 * Records an action emitted by the application-defined card component.
 *
 * @param {{ action: string, rowKey: string|number }} payload Enriched DomKanban card action.
 * @returns {void}
 */
function recordCardAction(payload) {
	lastAction.value = `${payload.action} feature ${payload.rowKey}`;
}
</script>

<template>
	<div class="w-full min-w-0 space-y-3" data-testid="rich-project-kanban">
		<DomKanban
			v-model:rows="rows"
			v-model:columns="columns"
			:card-component="cardComponent"
			:allow-add-cards="false"
			:allow-add-columns="false"
			board-label="Product delivery board"
			resource-label="features"
			column-width="20rem"
			height="38rem"
			@card-action="recordCardAction"
		/>
		<p class="text-xs text-muted-fg" aria-live="polite">{{ lastAction }}</p>
	</div>
</template>
