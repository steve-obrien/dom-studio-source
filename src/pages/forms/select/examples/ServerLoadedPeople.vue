<script setup>
import { ref } from 'vue';
import { DomSelect } from '@getdom/studio/vue';
import { usePagedLookup } from '../../_shared/usePagedLookup.js';
import LookupStatus from '../../_shared/LookupStatus.vue';

const owners = ref(['steve']);
// A separately resolved record supplies the label before its remote page arrives.
const selectedOptions = [{ value: 'steve', label: 'Steve Obrien' }];
const { options, loading, hasMore, error, total, search, loadMore } = usePagedLookup('people');
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomSelect v-model="owners" :options="options" :selected-options="selectedOptions" :loading="loading" :has-more="hasMore" :filter-options="false" searchable multiple clearable label="Project reviewers" description="Select several people across pages. Searching never removes a committed reviewer." width="w-[min(28rem,calc(100vw-2rem))]" @query="search" @load-more="loadMore">
			<template #option="{ option }">
				<span class="block truncate font-medium">{{ option.label }}</span>
				<span class="block truncate text-xs text-muted-fg">{{ option.email }}</span>
			</template>
		</DomSelect>
		<LookupStatus :error="error" :count="options.length" :total="total" @retry="loadMore" />
		<p class="text-xs text-muted-fg">Selected values: <code>{{ owners.join(', ') || 'None' }}</code></p>
	</div>
</template>
