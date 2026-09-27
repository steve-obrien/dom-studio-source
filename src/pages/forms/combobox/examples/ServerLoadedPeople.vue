<script setup>
import { ref } from 'vue';
import { DomCombobox } from '@getdom/studio/vue';
import { usePagedLookup } from '../../_shared/usePagedLookup.js';
import LookupStatus from '../../_shared/LookupStatus.vue';

const value = ref('');
const { options, loading, hasMore, error, total, search, loadMore } = usePagedLookup('people');
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomCombobox
			v-model="value"
			:options="options"
			:loading="loading"
			:has-more="hasMore"
			:filter-options="false"
			label="Assign owner"
			description="A real HTTP endpoint returns 12 of 602 synthetic contacts at a time."
			placeholder="Search or browse people"
			@query="search"
			@load-more="loadMore"
		>
			<template #item="{ item }">
				<span class="block truncate font-medium">{{ item.label }}</span>
				<span class="block truncate text-xs text-muted-fg">{{ item.email }} · {{ item.role }}</span>
			</template>
		</DomCombobox>
		<LookupStatus :error="error" :count="options.length" :total="total" @retry="loadMore" />
		<p class="text-xs text-muted-fg">Value: <code>{{ value || 'None' }}</code></p>
	</div>
</template>
