<script setup>
import { ref } from 'vue';
import CssColorInput from '../color-swatch/DomColorSwatch.vue';
import { DomPopover } from '../../lib/vue';
import ControlIconButton from '../_shared/ControlIconButton.vue';
import InspectorIcon from '../_shared/InspectorIcon.vue';
import InspectorSelect from '../_shared/InspectorSelect.vue';
import ScrubField from '../_shared/ScrubField.vue';
import StyleControlSection from '../_shared/StyleControlSection.vue';
import {
	addShadowLayer,
	enabledShadows,
	removeShadowLayer,
	shadowKindOptions,
} from '../shadow-editor/shadowModel.js';

const kindIcons = { drop: 'shadow-drop', inset: 'shadow-inset', ring: 'shadow-ring' };

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

const section = ref(null);
const emit = defineEmits(['update:modelValue']);

/** Adds a default layer to the editor-owned draft. */
function addShadow() {
	emit('update:modelValue', true);
	addShadowLayer(props.shadows);
}

/** Removes a layer from the editor-owned draft. */
function removeShadow(index) {
	removeShadowLayer(props.shadows, index);
}

/** Closes other layer popovers when opening the active layer. */
function closeOtherLayerPopovers(activeId) {
	if (typeof document === 'undefined') return;
	globalThis.requestAnimationFrame?.(() => {
		section.value?.$el?.querySelectorAll('dom-popover[data-layer-popover-id]').forEach((popover) => {
			if (popover.dataset.layerPopoverId === activeId) return;
			closeLayerPopoverElement(popover);
		});
	});
}

/** Closes open layer controls before switching the active layer. */
function closeAllLayerPopovers() {
	if (typeof document === 'undefined') return;
	section.value?.$el?.querySelectorAll('dom-popover[data-layer-popover-id]').forEach(closeLayerPopoverElement);
}

/** Closes a native popover and synchronizes its trigger state. */
function closeLayerPopoverElement(popover) {
	popover.open = false;
	popover.removeAttribute('open');
	popover.querySelector('.dom-popover-panel')?.hidePopover?.();
	popover.querySelector('[aria-expanded="true"]')?.setAttribute('aria-expanded', 'false');
}
</script>

<template>
	<StyleControlSection
		ref="section"
		:model-value="modelValue && shadows.length > 0"
		:title="title"
		:meta="shadows.length ? `${enabledShadows(shadows).length} of ${shadows.length}` : ''"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<ControlIconButton icon="plus" label="Add shadow" @click.stop="addShadow" />
		</template>

		<div class="space-y-1.5">
			<p v-if="variables.shadow" class="truncate font-mono text-[11px] text-muted-fg">{{ variables.shadow }}</p>
			<div
				v-for="(shadow, index) in shadows"
				:key="shadow.id"
				class="flex items-center gap-1"
			>
				<div class="flex min-w-0 flex-1 items-center gap-1" :class="!shadow.enabled && 'opacity-50'">
					<DomPopover
						:data-layer-popover-id="shadow.id"
						position="start-bottom"
						width="w-64 max-w-[calc(100vw-2rem)]"
						padding="p-0"
						:collision-padding="12"
						class="flex"
						@open="closeOtherLayerPopovers(shadow.id)"
					>
						<template #trigger>
							<button
								type="button"
								class="grid size-7 shrink-0 place-items-center rounded-md bg-secondary/60 text-muted-fg transition hover:text-canvas-fg hover:ring-1 hover:ring-inset hover:ring-border"
								:aria-label="`Edit shadow ${index + 1}`"
								@pointerdown.capture="closeAllLayerPopovers"
							>
								<InspectorIcon :name="kindIcons[shadow.kind] || 'shadow-drop'" />
							</button>
						</template>
						<div class="space-y-3 p-3">
							<div class="grid grid-cols-2 gap-1.5">
								<ScrubField v-model="shadow.x" prefix="X" label="Horizontal offset" :min="-200" :max="200" :disabled="shadow.kind === 'ring'" />
								<ScrubField v-model="shadow.y" prefix="Y" label="Vertical offset" :min="-200" :max="200" :disabled="shadow.kind === 'ring'" />
								<ScrubField v-model="shadow.blur" icon="blur" label="Blur" :min="0" :max="300" :disabled="shadow.kind === 'ring'" />
								<ScrubField v-model="shadow.spread" icon="spread" label="Spread" :min="-200" :max="200" />
							</div>
							<CssColorInput v-model="shadow.color" v-model:alpha="shadow.alpha" label="Colour" />
						</div>
					</DomPopover>
					<InspectorSelect v-model="shadow.kind" :options="shadowKindOptions" :label="`Shadow ${index + 1} type`" class="flex-1" />
				</div>
				<ControlIconButton
					:icon="shadow.enabled ? 'eye' : 'eye-off'"
					:label="shadow.enabled ? 'Hide shadow' : 'Show shadow'"
					@click="shadow.enabled = !shadow.enabled"
				/>
				<ControlIconButton icon="remove" label="Remove shadow" @click="removeShadow(index)" />
			</div>
		</div>
	</StyleControlSection>
</template>
