<script setup>
import DocSection from '../../_layout/DocSection.vue';
</script>

<template>
	<DocSection eyebrow="Behaviour" title="Selection, search and remote pages">
		<div class="space-y-3 text-sm leading-relaxed text-muted-fg">
			<p>A selected value is not a search filter. Opening shows the loaded options and a checkmark on matching selections. Only typing filters; custom item/option slots receive <code>query</code> and <code>selected</code>.</p>
			<p>Set <code>:filter-options="false"</code> for server-ranked results. Handle <code>@query</code> to reset the cursor and replace options, then <code>@load-more</code> to append the next page. Pass <code>loading</code> and <code>hasMore</code>. Scrolling, keyboard navigation at the last row, and the Load more button request another page.</p>
			<p>The examples call <code>/api/form-options</code>, a real HTTP endpoint serving synthetic records. The shared example loader debounces queries, aborts old requests, ignores stale responses, deduplicates pages and exposes a Retry button. Applications own their endpoint, authorization and cursor protocol; the controls do not fetch data themselves.</p>
			<p>Selected labels are retained when a page is replaced. For Select, Combobox and Tag combobox, <code>selectedOptions</code> can supply initial records that are not loaded yet. Autocomplete stores the label as free text. Select opens near the selected row when it is loaded; a remote selection on a later page requires an application-owned lookup or seek endpoint. Multi-select opens at the beginning.</p>
		</div>
	</DocSection>
</template>
