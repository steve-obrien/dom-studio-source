<script setup>
import { computed } from 'vue';
import { inspectComponent } from './inspect.js';
import TypeCodeBlock from './TypeCodeBlock.vue';
import { DomPopover } from '../../lib/vue';

const props = defineProps({
	component: { required: true },
	source: { type: String, default: '' },
	title: { type: String, default: 'Slots' },
});
const info = computed(() => inspectComponent(props.component, props.source));

function payloadTokens(slot) {
	return slot.payloadTokens?.length
		? slot.payloadTokens
		: [{ text: slot.payload || '—', definition: '', typeDefinitions: {} }];
}
</script>

<template>
	<section v-if="info?.slots?.length" class="space-y-3">
		<h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-fg">{{ title }}</h3>
		<div class="overflow-hidden rounded-2xl border border-border">
			<table class="w-full text-left text-sm">
				<thead class="bg-secondary text-xs uppercase tracking-wider text-muted-fg">
					<tr>
						<th class="px-4 py-2 font-medium">Name</th>
						<th class="px-4 py-2 font-medium">Scope</th>
						<th class="px-4 py-2 font-medium">Description</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					<tr v-for="s in info.slots" :key="s.name">
						<td class="px-4 py-3 font-mono text-[12.5px] text-fg">#{{ s.name }}</td>
						<td class="px-4 py-3 font-mono text-[12.5px] text-muted-fg">
							<template v-for="(token, index) in payloadTokens(s)" :key="`${s.name}:${index}`">
								<DomPopover
									v-if="token.definition"
									trigger="hover-click"
									position="bottom-start"
									width="w-[min(34rem,80vw)]"
									padding="p-0"
								>
									<template #trigger>
										<span class="cursor-help text-fg underline decoration-dotted underline-offset-4">{{ token.text }}</span>
									</template>
									<TypeCodeBlock class="max-h-80" :code="token.definition" :definitions="token.typeDefinitions || {}" :framed="false" />
								</DomPopover>
								<span v-else>{{ token.text }}</span>
							</template>
						</td>
						<td class="px-4 py-3 text-muted-fg">{{ s.description || '—' }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>
