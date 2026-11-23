<script setup>
import { computed, nextTick, ref } from 'vue';
import DomDropdown from '../dropdown/DomDropdown.vue';
import DomMenuStack from '../menu-stack/DomMenuStack.vue';

const props = defineProps({
	items: { type: Array, required: true },
	selected: { type: Object, required: true },
	hasFeatures: { type: Boolean, default: false },
	modelHasFeatures: { type: Function, required: true },
	resolvedModelLabel: { type: String, default: '' },
	qualifier: { type: String, default: '' },
	align: { type: String, default: 'left' },
	disabled: { type: Boolean, default: false },
	triggerClass: { type: String, required: true },
});
const emit = defineEmits(['select']);
const query = ref('');
const path = ref(['root']);
const pages = [{ id: 'features', label: 'Features', children: [] }];
const canChooseModel = computed(() => props.items.length > 1);

const selectionLabel = computed(() => (
	props.selected.id === 'auto' && props.resolvedModelLabel
		? `Auto · ${props.resolvedModelLabel}`
		: props.selected.label
));
const selectionDetail = computed(() => [props.selected.provider, selectionLabel.value].filter(Boolean).join(' · '));
const groups = computed(groupOptions);

/**
 * Groups matching models by the application-provided provider name.
 *
 * @returns {Map<string, Array<object>>} Matching options in catalogue order.
 */
function groupOptions() {
	const search = query.value.trim().toLowerCase();
	const grouped = new Map();
	for (const item of props.items) {
		const terms = [item.label, item.provider, item.description, item.id].filter(Boolean).join(' ').toLowerCase();
		if (!terms.includes(search)) continue;
		const provider = item.provider || '';
		if (!grouped.has(provider)) grouped.set(provider, []);
		grouped.get(provider).push(item);
	}
	return grouped;
}

/**
 * Allows Tab to move between picker controls before the parent dropdown handles dismissal.
 *
 * @param {KeyboardEvent} event Tab key event inside the picker panel.
 * @returns {void}
 */
function keepTabInPicker(event) {
	const controls = [...event.currentTarget.querySelectorAll('input:not([disabled]), select:not([disabled]), button:not([disabled])')]
		.filter((element) => !element.closest('[inert]'));
	const edge = event.shiftKey ? controls[0] : controls.at(-1);
	if (event.target !== edge) {
		event.stopPropagation();
		if (event.shiftKey && event.target.matches('[data-dom-app-stack-pane]')) {
			event.preventDefault();
			controls[0]?.focus();
		}
	}
}

/**
 * Selects the model, then either opens its options in the stack or closes the picker.
 *
 * @param {string} id Selected model identifier.
 * @param {object} stack Shared navigation helpers for the current picker.
 * @param {() => void} close Closes the dropdown and returns focus to its trigger.
 * @returns {Promise<void>} Resolves after the host applies the model choice.
 */
async function selectModel(id, stack, close) {
	emit('select', id);
	await nextTick();
	if (props.hasFeatures) stack.push('features');
	else close();
}

/**
 * Starts the next opening from the unfiltered model list.
 *
 * @returns {void}
 */
function resetPicker() {
	query.value = '';
	path.value = ['root'];
}
</script>

<template>
	<DomDropdown
		v-if="canChooseModel || hasFeatures"
		class="min-w-0 max-w-full"
		panel-type="dialog"
		placement="top"
		:align="align"
		width="w-[min(21rem,calc(100vw-1.5rem))]"
		:trigger-class="triggerClass"
		:disabled="disabled"
		:auto-focus-panel="false"
		@dom:close="resetPicker"
	>
		<template #trigger>
			<span class="sr-only">Model:</span>
			<span class="min-w-0 truncate" :title="selectionDetail">{{ selectionLabel }}</span>
			<span v-if="qualifier" class="shrink-0 text-muted-fg">{{ qualifier }}</span>
			<span v-if="selected.provider" class="sr-only">{{ selected.provider }}</span>
		</template>
		<template #panel="{ close }">
			<DomMenuStack
				v-model:path="path"
				:items="canChooseModel ? pages : []"
				:title="canChooseModel ? 'Models' : 'Features'"
				panel-class="px-0! py-1!"
				height="min(22rem, max(0px, calc(var(--dom-floating-available-height, 70dvh) - 10px)))"
				class="border-0!"
				role="dialog"
				aria-label="Model and features"
				@keydown.tab="keepTabInPicker"
			>
				<template #rows="{ screen, stack }">
					<template v-if="screen.id === 'root' && canChooseModel">
						<div class="sticky -top-1 z-10 flex items-center gap-1 bg-canvas px-1.5 py-1">
							<input
								v-model="query"
								type="search"
								data-autofocus
								aria-label="Search models"
								placeholder="Search models"
								class="skin-input min-w-0 flex-1 px-2.5 py-1.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
								@keydown.enter.prevent
							/>
							<button v-if="hasFeatures" type="button" class="rounded-xl px-2.5 py-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60" @click="stack.push('features')">Features</button>
						</div>
						<div v-for="[provider, models] in groups" :key="provider" class="pb-1">
							<p v-if="provider" class="px-2.5 pb-1 pt-2 text-xs font-semibold text-muted-fg">{{ provider }}</p>
							<button
								v-for="model in models"
								:key="model.id"
								type="button"
								:aria-pressed="model.id === selected.id"
								class="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 aria-pressed:bg-secondary"
								:disabled="disabled"
								@click="selectModel(model.id, stack, close)"
							>
								<span class="min-w-0 flex-1">
									<span class="block break-words font-medium">{{ model.label }}</span>
									<span v-if="model.description" class="block break-words text-xs text-muted-fg">{{ model.description }}</span>
								</span>
								<svg v-if="model.id === selected.id" viewBox="0 0 24 24" class="size-4 shrink-0 text-primary" fill="none" aria-hidden="true">
									<path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<svg v-if="modelHasFeatures(model)" viewBox="0 0 20 20" class="size-4 shrink-0 text-muted-fg" fill="none" aria-hidden="true">
									<path d="m8 6 4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</button>
						</div>
						<p v-if="!groups.size" class="p-3 text-sm text-muted-fg" role="status">No matching models.</p>
					</template>
					<div v-else class="grid gap-3 px-2.5 py-2">
						<header class="flex items-start justify-between gap-2">
							<h2 class="min-w-0 wrap-break-word font-semibold">{{ selectionLabel }}</h2>
							<button type="button" class="rounded-lg bg-secondary px-2.5 py-1.5 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60" @click="close">Done</button>
						</header>
						<slot v-if="hasFeatures" name="features" />
						<p v-else class="text-sm text-muted-fg">This model has no configurable features.</p>
					</div>
				</template>
			</DomMenuStack>
		</template>
	</DomDropdown>
	<span v-else class="min-w-0 truncate px-2 text-sm font-medium text-muted-fg" :title="selectionDetail">
		<span class="sr-only">Model:</span> {{ selectionLabel }}
	</span>
</template>
