<script setup>
import { ref } from 'vue';
import { DomTagCombobox } from '@getdom/studio/vue';
import { usePagedLookup } from '../../_shared/usePagedLookup.js';
import LookupStatus from '../../_shared/LookupStatus.vue';

const classes = ref(['flex']);
const { options, loading, hasMore, error, total, search, loadMore } = usePagedLookup('classes');
</script>

<template>
	<div class="grid w-full max-w-md gap-3">
		<DomTagCombobox
			v-model="classes"
			:options="options"
			:loading="loading"
			:has-more="hasMore"
			:filter-options="false"
			:allow-custom="true"
			label="Server-loaded classes"
			description="Selected tokens survive new searches and pages."
			placeholder="Search or browse classes"
			@query="search"
			@load-more="loadMore"
		>
		</DomTagCombobox>
		<LookupStatus :error="error" :count="options.length" :total="total" @retry="loadMore" />
		<p class="text-xs text-muted-fg">Selected classes: <code>{{ classes.join(' ') || 'None' }}</code></p>
	</div>
</template>
