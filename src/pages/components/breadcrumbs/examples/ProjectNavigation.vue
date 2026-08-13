<script setup>
import { ref } from 'vue';
import { DomBreadcrumbs } from '../../../lib/vue';

const selectedLabel = ref('API credentials');
const items = [
	{ key: 'home', label: 'Home' },
	{ key: 'workspaces', label: 'Workspaces' },
	{ key: 'northstar', label: 'Northstar' },
	{ key: 'settings', label: 'Settings' },
	{ key: 'developers', label: 'Developers' },
	{ key: 'credentials', label: 'API credentials', current: true },
];

/**
 * Records the application-owned destination selected by the user.
 *
 * @param {{ item: Record<string, unknown> }} payload Breadcrumb navigation payload.
 * @returns {void}
 */
function recordNavigation(payload) {
	selectedLabel.value = String(payload.item.label);
}
</script>

<template>
	<div class="w-full rounded-xl border border-border skin-card p-5">
		<DomBreadcrumbs :items="items" :max-items="4" @navigate="recordNavigation" />
		<p class="mt-5 border-t border-border pt-4 text-sm text-muted-fg" aria-live="polite">
			Application destination: <span class="font-semibold text-canvas-fg">{{ selectedLabel }}</span>
		</p>
	</div>
</template>
