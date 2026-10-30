<script setup>
import { RouterLink } from 'vue-router';
import DocSection from '../../_layout/DocSection.vue';
</script>

<template>
	<DocSection eyebrow="Choosing a control" title="Multi-select or tag input?">
		<div class="space-y-3 text-sm leading-relaxed text-muted-fg">
			<p>Use <RouterLink to="/forms/select" class="font-medium text-primary underline underline-offset-4">Select with multiple</RouterLink> for a compact picker of known options, such as reviewers, roles or projects. The closed field summarizes the selection; search lives inside the dropdown, where checkmarks let people select or deselect several items. It does not create new values.</p>
			<p>Use <RouterLink to="/forms/tag-combobox" class="font-medium text-primary underline underline-offset-4">Tag combobox (tag input)</RouterLink> when each selected value should remain visible as a removable token, with typing and suggestions in the field itself. It suits recipients, labels and class names. Keep <code>allowCustom</code> off for known options only, or enable it for new values. Pasting can add several tokens using <code>tokenSeparators</code>; Backspace removes the last token when the query is empty.</p>
			<p>Both use the same option normalization, selected-record retention, field state, pagination requests and loading/empty-state components. Both retain selections while searching or loading server pages. The different trigger, token editing and keyboard interactions are intentional; applications still own their data fetching.</p>
		</div>
	</DocSection>
</template>
