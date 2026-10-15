<script setup>
import CssColorInput from '../color-swatch/DomColorSwatch.vue';
import { DomPopover } from '../../lib/vue';
import ControlIconButton from '../_shared/ControlIconButton.vue';
import IconSegmented from '../_shared/IconSegmented.vue';
import ScrubField from '../_shared/ScrubField.vue';
import StyleControlSection from '../_shared/StyleControlSection.vue';
import {
	addFillLayer,
	enabledFills,
	fillToCss,
	removeFillLayer,
} from './backgroundModel.js';

const kindOptions = [
	{ value: 'solid', icon: 'fill-solid', label: 'Solid' },
	{ value: 'linear', icon: 'fill-linear', label: 'Linear gradient' },
	{ value: 'radial', icon: 'fill-radial', label: 'Radial gradient' },
];
const kindLabels = { solid: 'Solid', linear: 'Linear', radial: 'Radial' };
const checker = 'repeating-conic-gradient(var(--border) 0 25%, var(--canvas) 0 50%) 0 0 / 8px 8px';

const props = defineProps({
	background: {
		type: Object,
		required: true,
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	title: {
		type: String,
		default: 'Fill',
	},

	variables: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits(['update:modelValue']);

/** Handles background layer interaction: addFill. */
function addFill() {
	emit('update:modelValue', true);
	addFillLayer(props.background);
}

/** Handles background layer interaction: removeFill. */
function removeFill(index) {
	removeFillLayer(props.background, index);
}

/** Handles background layer interaction: closeOtherLayerPopovers. */
function closeOtherLayerPopovers(activeId) {
	if (typeof document === 'undefined') return;
	globalThis.requestAnimationFrame?.(() => {
		document.querySelectorAll('dom-popover[data-layer-popover-id]').forEach((popover) => {
			if (popover.dataset.layerPopoverId === activeId) return;
			closeLayerPopoverElement(popover);
		});
	});
}

/** Handles background layer interaction: closeAllLayerPopovers. */
function closeAllLayerPopovers() {
	if (typeof document === 'undefined') return;
	document.querySelectorAll('dom-popover[data-layer-popover-id]').forEach(closeLayerPopoverElement);
}

/** Handles background layer interaction: closeLayerPopoverElement. */
function closeLayerPopoverElement(popover) {
	popover.open = false;
	popover.removeAttribute('open');
	popover.querySelector('.dom-popover-panel')?.hidePopover?.();
	popover.querySelector('[aria-expanded="true"]')?.setAttribute('aria-expanded', 'false');
}
</script>

<template>
	<StyleControlSection
		:model-value="modelValue && background.fills.length > 0"
		:title="title"
		:meta="background.fills.length ? `${enabledFills(background.fills).length} of ${background.fills.length}` : ''"
		:muted="!background.enabled"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<ControlIconButton
				v-if="background.fills.length"
				:icon="background.enabled ? 'eye' : 'eye-off'"
				:label="background.enabled ? 'Hide all fills' : 'Show all fills'"
				@click="background.enabled = !background.enabled"
			/>
			<ControlIconButton icon="plus" label="Add fill" @click.stop="addFill" />
		</template>

		<div class="space-y-1.5">
			<p v-if="variables.bgImage" class="truncate font-mono text-[11px] text-muted-fg">
				{{ variables.bgImage }}
			</p>
			<div
				v-for="(fill, index) in background.fills"
				:key="fill.id"
				class="flex items-center gap-1"
			>
				<div class="min-w-0 flex-1" :class="!fill.enabled && 'opacity-50'">
					<CssColorInput
						v-if="fill.kind === 'solid'"
						v-model="fill.color"
						v-model:alpha="fill.alpha"
						hide-label
						:label="`Fill ${index + 1}`"
					>
						<template #swatch="{ style }">
							<DomPopover
								:data-layer-popover-id="fill.id"
								position="start-bottom"
								width="w-64 max-w-[calc(100vw-2rem)]"
								padding="p-0"
								:collision-padding="12"
								class="ml-1.5 flex"
								@open="closeOtherLayerPopovers(fill.id)"
							>
								<template #trigger>
									<button type="button" class="block size-4 rounded-[3px] ring-1 ring-inset ring-canvas-fg/15" :style="style" :aria-label="`Edit fill ${index + 1}`" @pointerdown.capture="closeAllLayerPopovers"></button>
								</template>
								<div class="space-y-3 p-3">
									<IconSegmented v-model="fill.kind" :options="kindOptions" label="Fill type" />
									<CssColorInput v-model="fill.color" v-model:alpha="fill.alpha" label="Colour" />
								</div>
							</DomPopover>
						</template>
					</CssColorInput>
					<div v-else class="flex h-7 min-w-0 items-center rounded-md bg-secondary/60 text-xs">
						<DomPopover
							:data-layer-popover-id="fill.id"
							position="start-bottom"
							width="w-64 max-w-[calc(100vw-2rem)]"
							padding="p-0"
							:collision-padding="12"
							class="!block min-w-0 flex-1 [&>[data-trigger]]:!block"
							@open="closeOtherLayerPopovers(fill.id)"
						>
							<template #trigger>
								<button type="button" class="flex h-7 w-full min-w-0 items-center gap-2 rounded-md pl-1.5 pr-2 text-left hover:ring-1 hover:ring-inset hover:ring-border" :aria-label="`Edit fill ${index + 1}`" @pointerdown.capture="closeAllLayerPopovers">
									<span class="size-4 shrink-0 rounded-[3px] ring-1 ring-inset ring-canvas-fg/15" :style="{ background: `${fillToCss(fill)}, ${checker}` }"></span>
									<span class="truncate text-[11px]">{{ kindLabels[fill.kind] }}<span v-if="fill.kind === 'linear'" class="text-muted-fg"> · {{ fill.gradientAngle }}°</span></span>
								</button>
							</template>
							<div class="space-y-3 p-3">
								<IconSegmented v-model="fill.kind" :options="kindOptions" label="Fill type" />
								<div class="h-6 rounded ring-1 ring-inset ring-canvas-fg/15" :style="{ background: `${fillToCss({ ...fill, kind: 'linear', gradientAngle: 90 })}, ${checker}` }" aria-hidden="true"></div>
								<ScrubField v-if="fill.kind === 'linear'" v-model="fill.gradientAngle" icon="angle" label="Angle" suffix="°" :min="0" :max="360" />
								<div class="grid grid-cols-[minmax(0,1fr)_4.5rem] items-end gap-1.5">
									<CssColorInput v-model="fill.gradientFrom" v-model:alpha="fill.gradientFromAlpha" label="Start" />
									<ScrubField v-model="fill.gradientFromStop" prefix="@" label="Start position" suffix="%" :min="0" :max="100" />
									<CssColorInput v-model="fill.gradientTo" v-model:alpha="fill.gradientToAlpha" label="End" />
									<ScrubField v-model="fill.gradientToStop" prefix="@" label="End position" suffix="%" :min="0" :max="100" />
								</div>
							</div>
						</DomPopover>
					</div>
				</div>
				<ControlIconButton
					:icon="fill.enabled ? 'eye' : 'eye-off'"
					:label="fill.enabled ? 'Hide fill' : 'Show fill'"
					@click="fill.enabled = !fill.enabled"
				/>
				<ControlIconButton icon="remove" label="Remove fill" @click="removeFill(index)" />
			</div>
		</div>
	</StyleControlSection>
</template>
