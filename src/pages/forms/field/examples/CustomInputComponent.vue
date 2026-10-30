<script setup>
import { ref } from 'vue';
import { DomButton, DomForm } from '@getdom/studio/vue';
import SlugInput from './SlugInput.vue';

const article = ref({
	slug: 'launch-notes',
});
</script>

<template>
	<DomForm v-model="article" name="article" class="w-full max-w-md space-y-4">
		<SlugInput
			name="slug"
			label="Article slug"
			description="The field writes to article.slug and still gets IDs, errors, and validation from the form."
			placeholder="launch-notes"
			required
		/>
		<div class="flex items-center gap-2">
			<DomButton type="submit">Save article</DomButton>
			<code class="text-xs text-muted-fg">{{ article.slug }}</code>
		</div>
	</DomForm>
</template>
