<script setup>
import { computed } from 'vue';
import ProfileMenuDefaultRow from './ProfileMenuDefaultRow.vue';

const props = defineProps({
	item: {
		type: Object,
		default: () => ({}),
	},
	label: {
		type: String,
		default: '',
	},
	value: {
		type: [String, Number],
		default: '',
	},
});

/**
 * Determine whether the row represents an organization identity.
 *
 * @returns {boolean} True when organization-specific row styling should be used.
 */
function resolveIsOrganization() {
	return props.item?.kind === 'organization' || props.item?.kind === 'organization-current';
}

const isOrganization = computed(resolveIsOrganization);
</script>

<template>
	<span v-if="isOrganization" class="flex min-w-0 items-center gap-3">
		<span
			class="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold"
			:class="item.avatarClass || 'bg-primary/10 text-primary'"
			aria-hidden="true"
		>
			{{ item.initials || label.slice(0, 1) }}
		</span>
		<span class="min-w-0 flex-1">
			<span class="block truncate font-medium">{{ label }}</span>
			<span v-if="item.description" class="mt-0.5 block truncate text-xs text-muted-fg">
				{{ item.description }}
			</span>
		</span>
	</span>
	<ProfileMenuDefaultRow v-else :item="item" :label="label" :value="value" />
</template>
