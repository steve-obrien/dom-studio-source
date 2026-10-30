<script setup>
import { ref } from 'vue';
import { DomAutocomplete } from '@getdom/studio/vue';
import { usePagedLookup } from '../../_shared/usePagedLookup.js';
import LookupStatus from '../../_shared/LookupStatus.vue';

const value = ref('');
const { options, loading, hasMore, error, total, search, loadMore } = usePagedLookup('people');
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomAutocomplete
			v-model="value"
			:options="options"
			:loading="loading"
			:has-more="hasMore"
			:filter-options="false"
			label="Search people"
			description="Browse paginated suggestions or commit your own text."
			placeholder="Search or browse people"
			@query="search"
			@load-more="loadMore"
		>
			<template #item="{ item }">
				<span class="block truncate font-medium">{{ item.label }}</span>
				<span class="block truncate text-xs text-muted-fg">{{ item.email }} · {{ item.role }}</span>
			</template>
		</DomAutocomplete>
		<LookupStatus :error="error" :count="options.length" :total="total" @retry="loadMore" />
		<p class="text-xs text-muted-fg">Value: <code>{{ value || 'None' }}</code></p>
	</div>
</template>
