<script setup>
import CssColorInput from './CssColorInput.vue';
import {
	DomButton,
	DomNativeSelect,
	DomPopover,
	DomRangeInput,
} from '../../../lib/vue';
import ControlIconButton from './ControlIconButton.vue';
import StyleControlSection from './StyleControlSection.vue';
import {
	addShadowLayer,
	duplicateShadowLayer,
	enabledShadows,
	removeShadowLayer,
	shadowKindOptions,
	shadowTitle,
} from '../lib/styleModel.js';

const props = defineProps({
	shadows: {
		type: Array,
		required: true,
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	title: {
		type: String,
		default: 'Box shadows',
	},
	variables: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(['update:modelValue']);

function addShadow() {
	addShadowLayer(props.shadows);
}

function duplicateShadow(index) {
	duplicateShadowLayer(props.shadows, index);
}

function removeShadow(index) {
	removeShadowLayer(props.shadows, index);
}

function closeOtherLayerPopovers(activeId) {
	if (typeof document === 'undefined') return;
	globalThis.requestAnimationFrame?.(() => {
		document.querySelectorAll('dom-popover[data-layer-popover-id]').forEach((popover) => {
			if (popover.dataset.layerPopoverId === activeId) return;
			closeLayerPopoverElement(popover);
		});
	});
}

function closeAllLayerPopovers() {
	if (typeof document === 'undefined') return;
	document.querySelectorAll('dom-popover[data-layer-popover-id]').forEach(closeLayerPopoverElement);
}

function closeLayerPopoverElement(popover) {
	popover.open = false;
	popover.removeAttribute('open');
	popover.querySelector('.dom-popover-panel')?.hidePopover?.();
	popover.querySelector('[aria-expanded="true"]')?.setAttribute('aria-expanded', 'false');
}
</script>

<template>
	<StyleControlSection
		:model-value="modelValue"
		:title="title"
		:meta="`${enabledShadows(shadows).length} of ${shadows.length} visible`"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<DomButton size="sm" type="button" @click.stop="addShadow">Add</DomButton>
		</template>

		<div class="divide-y divide-border">
			<p v-if="variables.shadow" class="px-3 py-2 font-mono text-[11px] text-muted-fg">{{ variables.shadow }}</p>
			<article
				v-for="(shadow, index) in shadows"
				:key="shadow.id"
				class="px-3 py-2"
				:class="!shadow.enabled && 'opacity-60'"
			>
				<div class="grid grid-cols-[1fr_auto] items-center gap-2">
					<DomPopover
						:data-layer-popover-id="shadow.id"
						position="start-bottom"
						width="w-[22rem] max-w-[calc(100vw-2rem)]"
						padding="p-0"
						:collision-padding="12"
						@open="closeOtherLayerPopovers(shadow.id)"
					>
						<template #trigger>
							<button
								type="button"
								class="w-full min-w-0 rounded-md text-left transition hover:bg-secondary/60"
								@pointerdown.capture="closeAllLayerPopovers"
							>
								<span class="flex min-w-0 items-center gap-2">
									<span class="font-mono text-[11px] text-muted-fg">{{ index + 1 }}</span>
									<span class="truncate text-sm font-medium">{{ shadowTitle(shadow) }}</span>
								</span>
							</button>
						</template>
						<div>
							<div class="border-b border-border px-3 py-2">
								<p class="truncate text-sm font-semibold">{{ shadowTitle(shadow) }}</p>
							</div>
							<div class="grid gap-3 p-3 sm:grid-cols-2">
								<DomNativeSelect
									v-model="shadow.kind"
									label="Type"
									:options="shadowKindOptions"
									placeholder=""
								/>
								<CssColorInput v-model="shadow.color" label="Colour" />
								<DomRangeInput v-model="shadow.alpha" label="Alpha" :min="0" :max="100" suffix="%" />
								<DomRangeInput
									v-model="shadow.x"
									label="Horizontal"
									:min="-80"
									:max="80"
									suffix="px"
									:disabled="shadow.kind === 'ring'"
								/>
								<DomRangeInput
									v-model="shadow.y"
									label="Vertical"
									:min="-80"
									:max="80"
									suffix="px"
									:disabled="shadow.kind === 'ring'"
								/>
								<DomRangeInput
									v-model="shadow.blur"
									label="Blur"
									:min="0"
									:max="120"
									suffix="px"
									:disabled="shadow.kind === 'ring'"
								/>
								<DomRangeInput
									v-model="shadow.spread"
									label="Spread"
									:min="-80"
									:max="80"
									suffix="px"
								/>
							</div>
						</div>
					</DomPopover>
					<div class="flex items-center gap-1">
						<ControlIconButton icon="duplicate" label="Duplicate shadow" @click="duplicateShadow(index)" />
						<ControlIconButton
							:icon="shadow.enabled ? 'eye' : 'eye-off'"
							:label="shadow.enabled ? 'Hide shadow' : 'Show shadow'"
							@click="shadow.enabled = !shadow.enabled"
						/>
						<ControlIconButton icon="remove" label="Remove shadow" @click="removeShadow(index)" />
					</div>
				</div>
			</article>
		</div>
	</StyleControlSection>
</template>
