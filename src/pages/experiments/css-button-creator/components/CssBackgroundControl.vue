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
	addFillLayer,
	duplicateFillLayer,
	enabledFills,
	fillToCss,
	fillTypeOptions,
	removeFillLayer,
} from '../lib/styleModel.js';

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

function addFill() {
	addFillLayer(props.background);
}

function duplicateFill(index) {
	duplicateFillLayer(props.background, index);
}

function removeFill(index) {
	removeFillLayer(props.background, index);
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
		:meta="`${enabledFills(background.fills).length} of ${background.fills.length} visible`"
		:muted="!background.enabled"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #actions>
			<DomButton size="sm" type="button" @click.stop="addFill">Add</DomButton>
			<ControlIconButton
				:icon="background.enabled ? 'eye' : 'eye-off'"
				:label="background.enabled ? 'Hide background' : 'Show background'"
				@click="background.enabled = !background.enabled"
			/>
		</template>

		<div class="divide-y divide-border">
			<p v-if="variables.bgImage" class="px-3 py-2 font-mono text-[11px] text-muted-fg">
				{{ variables.bgImage }}
			</p>
			<article
				v-for="(fill, index) in background.fills"
				:key="fill.id"
				class="px-3 py-2"
				:class="!fill.enabled && 'opacity-60'"
			>
				<div class="grid grid-cols-[1fr_auto] items-center gap-2">
					<DomPopover
						:data-layer-popover-id="fill.id"
						position="start-bottom"
						width="w-[22rem] max-w-[calc(100vw-2rem)]"
						padding="p-0"
						:collision-padding="12"
						@open="closeOtherLayerPopovers(fill.id)"
					>
						<template #trigger>
							<button
								type="button"
								class="grid w-full min-w-0 grid-cols-[auto_1fr] items-center gap-2 rounded-md text-left transition hover:bg-secondary/60"
								@pointerdown.capture="closeAllLayerPopovers"
							>
								<span
									class="h-5 w-5 rounded border border-border"
									:style="{ background: fillToCss(fill) }"
								/>
								<span class="min-w-0">
									<span class="block truncate text-sm font-medium">{{
										fill.kind === 'solid'
											? 'Solid'
											: fill.kind === 'linear'
												? 'Linear gradient'
												: 'Radial gradient'
									}}</span>
								</span>
							</button>
						</template>
						<div>
							<div class="border-b border-border px-3 py-2">
								<p class="truncate text-sm font-semibold">Fill {{ index + 1 }}</p>
							</div>
							<div class="grid gap-3 p-3 sm:grid-cols-2">
								<DomNativeSelect
									v-model="fill.kind"
									label="Type"
									:options="fillTypeOptions"
									placeholder=""
								/>
								<template v-if="fill.kind === 'solid'">
									<CssColorInput v-model="fill.color" label="Colour" />
									<DomRangeInput v-model="fill.alpha" label="Alpha" :min="0" :max="100" suffix="%" />
								</template>
								<template v-else>
									<CssColorInput v-model="fill.gradientFrom" label="From" />
									<DomRangeInput
										v-model="fill.gradientFromAlpha"
										label="From alpha"
										:min="0"
										:max="100"
										suffix="%"
									/>
									<CssColorInput v-model="fill.gradientTo" label="To" />
									<DomRangeInput
										v-model="fill.gradientToAlpha"
										label="To alpha"
										:min="0"
										:max="100"
										suffix="%"
									/>
									<DomRangeInput
										v-if="fill.kind === 'linear'"
										v-model="fill.gradientAngle"
										label="Angle"
										:min="0"
										:max="360"
										suffix="deg"
									/>
									<DomRangeInput
										v-model="fill.gradientFromStop"
										label="From stop"
										:min="0"
										:max="100"
										suffix="%"
									/>
									<DomRangeInput
										v-model="fill.gradientToStop"
										label="To stop"
										:min="0"
										:max="100"
										suffix="%"
									/>
								</template>
							</div>
						</div>
					</DomPopover>
					<div class="flex items-center gap-1">
						<ControlIconButton icon="duplicate" label="Duplicate fill" @click="duplicateFill(index)" />
						<ControlIconButton
							:icon="fill.enabled ? 'eye' : 'eye-off'"
							:label="fill.enabled ? 'Hide fill' : 'Show fill'"
							@click="fill.enabled = !fill.enabled"
						/>
						<ControlIconButton icon="remove" label="Remove fill" @click="removeFill(index)" />
					</div>
				</div>
			</article>
		</div>
	</StyleControlSection>
</template>
