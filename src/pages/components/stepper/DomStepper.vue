<script>
/**
 * @typedef {object} StepperItem
 * @property {string|number} key Stable controlled step key.
 * @property {string} label Human-readable step label.
 * @property {string} [description] Optional supporting copy.
 * @property {'complete'|'current'|'upcoming'|'error'} [status] Explicit state override.
 * @property {boolean} [optional] Mark the step as optional.
 * @property {boolean} [disabled] Prevent navigation to this step.
 */

/**
 * @typedef {object} StepperChangePayload
 * @property {StepperItem} item Selected step record.
 * @property {string|number} key Selected step key.
 * @property {number} index Selected step index.
 * @property {string|number|null} previousKey Previously active step key.
 */

/**
 * @typedef {object} StepperSlotPayload
 * @property {StepperItem} item Step record.
 * @property {string|number} key Step key.
 * @property {number} index Step index.
 * @property {'complete'|'current'|'upcoming'|'error'} state Resolved display state.
 * @property {boolean} active Whether the step matches the controlled active key.
 * @property {boolean} disabled Whether the step cannot currently be selected.
 */

export const stepperProps = {
	items: {
		type: Array,
		default: () => [],
		_edit: { typeRef: 'Array<StepperItem>', description: 'Ordered application-owned step records.' },
	},
	modelValue: {
		type: [String, Number],
		default: '',
		_edit: { description: 'Controlled active step key. Defaults to the first enabled item.' },
	},
	orientation: {
		type: String,
		default: 'horizontal',
		_edit: { options: ['horizontal', 'vertical'], description: 'Arrange steps across a row or down a column.' },
	},
	clickable: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow enabled step indicators and labels to change the active key.' },
	},
	linear: {
		type: Boolean,
		default: false,
		_edit: { description: 'Prevent navigation beyond the next incomplete step.' },
	},
	showDescriptions: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show supporting descriptions when supplied.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { options: ['sm', 'md'], description: 'Indicator and label density.' },
	},
	ariaLabel: {
		type: String,
		default: 'Progress',
		_edit: { description: 'Accessible label for the step navigation.' },
	},
};
</script>

<script setup>
import { computed, ref } from 'vue';

defineOptions({
	__doc: {
		name: 'Stepper',
		tag: '<DomStepper>',
		description: 'Controlled horizontal or vertical progress navigation for multi-step application workflows.',
		icon: 'M5 12h14M6 12a2 2 0 1 0 0 .01M12 12a2 2 0 1 0 0 .01M18 12a2 2 0 1 0 0 .01',
		events: [
			{ name: 'update:modelValue', payload: 'string | number', description: 'Fired when an enabled step is selected.' },
			{ name: 'change', payload: 'StepperChangePayload', typeRef: 'StepperChangePayload', description: 'Fired with the selected step, key, index, and previous key.' },
		],
		slots: [
			{ name: 'step', payload: 'StepperSlotPayload', typeRef: 'StepperSlotPayload', description: 'Replace the label and description while retaining navigation and progress structure.' },
			{ name: 'indicator', payload: 'StepperSlotPayload', typeRef: 'StepperSlotPayload', description: 'Replace the numbered, completed, or error indicator.' },
			{ name: 'separator', payload: '{ index, previous, next }', description: 'Replace the connector between adjacent steps.' },
		],
		keyboard: [
			{ keys: '← / →', action: 'Move between enabled horizontal steps.' },
			{ keys: '↑ / ↓', action: 'Move between enabled vertical steps.' },
			{ keys: 'Home / End', action: 'Move to the first or last enabled step.' },
		],
	},
});

const props = defineProps(stepperProps);
const emit = defineEmits(['update:modelValue', 'change']);

const root = ref(null);
const normalizedItems = computed(getNormalizedItems);
const activeIndex = computed(getActiveIndex);
const rootClass = computed(getRootClass);

/**
 * Normalizes every supplied step and its stable key.
 *
 * @returns {Array<StepperItem>} Safe step records.
 */
function getNormalizedItems() {
	return (Array.isArray(props.items) ? props.items : [])
		.filter(hasStepKey)
		.map(normalizeStep);
}

/**
 * Reports whether a candidate step has a stable key.
 *
 * @param {StepperItem} item Candidate step.
 * @returns {boolean} True when the step can be controlled.
 */
function hasStepKey(item) {
	return Boolean(item && item.key !== null && item.key !== undefined && item.key !== '');
}

/**
 * Adds safe defaults to one step record.
 *
 * @param {StepperItem} item Source step.
 * @param {number} index Source step index.
 * @returns {StepperItem} Normalized step.
 */
function normalizeStep(item, index) {
	return {
		...item,
		label: item.label || `Step ${index + 1}`,
		description: item.description || '',
	};
}

/**
 * Finds the controlled active step or the first enabled step.
 *
 * @returns {number} Active step index or -1.
 */
function getActiveIndex() {
	const controlledIndex = normalizedItems.value.findIndex(matchesModelValue);
	if (controlledIndex >= 0) return controlledIndex;
	return normalizedItems.value.findIndex(isEnabledStep);
}

/**
 * Reports whether a step matches the controlled active key.
 *
 * @param {StepperItem} item Candidate step.
 * @returns {boolean} True when keys match.
 */
function matchesModelValue(item) {
	return String(item.key) === String(props.modelValue);
}

/**
 * Reports whether a step is enabled.
 *
 * @param {StepperItem} item Candidate step.
 * @returns {boolean} True when navigation is allowed.
 */
function isEnabledStep(item) {
	return !item.disabled;
}

/**
 * Builds orientation-aware root classes.
 *
 * @returns {string} Step list classes.
 */
function getRootClass() {
	return props.orientation === 'vertical'
		? 'flex flex-col'
		: 'flex min-w-max items-start';
}

/**
 * Resolves derived or explicitly supplied state for one step.
 *
 * @param {StepperItem} item Step record.
 * @param {number} index Step index.
 * @returns {'complete'|'current'|'upcoming'|'error'} Display state.
 */
function stepState(item, index) {
	if (['complete', 'current', 'upcoming', 'error'].includes(item.status)) return item.status;
	if (index < activeIndex.value) return 'complete';
	if (index === activeIndex.value) return 'current';
	return 'upcoming';
}

/**
 * Reports whether a step can be selected under current navigation rules.
 *
 * @param {StepperItem} item Step record.
 * @param {number} index Step index.
 * @returns {boolean} True when the step is interactive.
 */
function canSelect(item, index) {
	if (!props.clickable || item.disabled) return false;
	if (!props.linear) return true;
	return index <= activeIndex.value + 1;
}

/**
 * Selects an enabled step and emits controlled state.
 *
 * @param {StepperItem} item Step record.
 * @param {number} index Step index.
 * @returns {void}
 */
function selectStep(item, index) {
	if (!canSelect(item, index)) return;
	const previousKey = normalizedItems.value[activeIndex.value]?.key ?? null;
	emit('update:modelValue', item.key);
	emit('change', { item, key: item.key, index, previousKey });
}

/**
 * Handles directional and boundary keyboard navigation.
 *
 * @param {KeyboardEvent} event Native keyboard event.
 * @param {number} index Focused step index.
 * @returns {void}
 */
function onStepKeydown(event, index) {
	const direction = keyboardDirection(event.key);
	if (direction === null) return;
	event.preventDefault();
	const nextIndex = direction === 'first'
		? findEnabledIndex(0, 1)
		: direction === 'last'
			? findEnabledIndex(normalizedItems.value.length - 1, -1)
			: findEnabledIndex(index + direction, direction);
	if (nextIndex < 0) return;
	focusStep(nextIndex);
}

/**
 * Maps supported keys to a navigation direction.
 *
 * @param {string} key Keyboard key.
 * @returns {number|'first'|'last'|null} Navigation direction.
 */
function keyboardDirection(key) {
	if (key === 'Home') return 'first';
	if (key === 'End') return 'last';
	if (props.orientation === 'vertical' && key === 'ArrowUp') return -1;
	if (props.orientation === 'vertical' && key === 'ArrowDown') return 1;
	if (props.orientation === 'horizontal' && key === 'ArrowLeft') return -1;
	if (props.orientation === 'horizontal' && key === 'ArrowRight') return 1;
	return null;
}

/**
 * Finds the next enabled and selectable step in one direction.
 *
 * @param {number} startIndex Initial candidate index.
 * @param {number} direction Direction increment.
 * @returns {number} Matching index or -1.
 */
function findEnabledIndex(startIndex, direction) {
	for (let index = startIndex; index >= 0 && index < normalizedItems.value.length; index += direction) {
		if (canSelect(normalizedItems.value[index], index)) return index;
	}
	return -1;
}

/**
 * Focuses and activates one step button.
 *
 * @param {number} index Target step index.
 * @returns {void}
 */
function focusStep(index) {
	const button = root.value?.querySelector(`[data-step-index="${index}"]`);
	button?.focus();
	selectStep(normalizedItems.value[index], index);
}

/**
 * Builds the public slot payload for one step.
 *
 * @param {StepperItem} item Step record.
 * @param {number} index Step index.
 * @returns {Record<string, unknown>} Step slot payload.
 */
function slotPayload(item, index) {
	return {
		item,
		key: item.key,
		index,
		state: stepState(item, index),
		active: index === activeIndex.value,
		disabled: !canSelect(item, index),
	};
}

/**
 * Builds semantic classes for a step indicator.
 *
 * @param {StepperItem} item Step record.
 * @param {number} index Step index.
 * @returns {string} Indicator classes.
 */
function indicatorClass(item, index) {
	const state = stepState(item, index);
	if (state === 'complete') return 'border-primary bg-primary text-primary-fg';
	if (state === 'current') return 'border-primary bg-canvas text-primary ring-4 ring-primary/10';
	if (state === 'error') return 'border-destructive bg-destructive/10 text-destructive';
	return 'border-border bg-secondary text-muted-fg';
}

/**
 * Builds semantic classes for a connector after one step.
 *
 * @param {number} index Step index before the connector.
 * @returns {string} Connector classes.
 */
function separatorClass(index) {
	const complete = index < activeIndex.value;
	if (props.orientation === 'vertical') {
		return `ml-[0.9375rem] h-8 w-px ${complete ? 'bg-primary' : 'bg-border'}`;
	}
	return `mt-[0.9375rem] h-px min-w-6 flex-1 ${complete ? 'bg-primary' : 'bg-border'}`;
}

/**
 * Returns the compact indicator dimension for the selected size.
 *
 * @returns {string} Indicator size classes.
 */
function indicatorSizeClass() {
	return props.size === 'sm' ? 'size-7 text-xs' : 'size-8 text-sm';
}
</script>

<template>
	<nav :aria-label="ariaLabel" class="min-w-0 overflow-x-auto">
		<ol ref="root" :class="rootClass">
			<template v-for="(item, index) in normalizedItems" :key="item.key">
				<li class="flex min-w-0" :class="orientation === 'vertical' ? 'flex-col' : 'min-w-[8rem] flex-1 flex-row'">
					<div class="flex min-w-0" :class="orientation === 'vertical' ? 'items-start gap-3' : 'flex-col items-center px-1 text-center'">
						<button
							type="button"
							class="group flex min-w-0 focus-visible:outline-none"
							:class="orientation === 'vertical' ? 'items-start gap-3 text-left' : 'flex-col items-center text-center'"
							:data-step-index="index"
							:aria-current="index === activeIndex ? 'step' : undefined"
							:aria-disabled="!canSelect(item, index) ? 'true' : undefined"
							:disabled="!canSelect(item, index)"
							@click="selectStep(item, index)"
							@keydown="onStepKeydown($event, index)"
						>
							<slot name="indicator" v-bind="slotPayload(item, index)">
								<span class="grid shrink-0 place-items-center rounded-full border font-semibold transition group-focus-visible:ring-2 group-focus-visible:ring-ring" :class="[indicatorSizeClass(), indicatorClass(item, index)]">
									<svg v-if="stepState(item, index) === 'complete'" viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true"><path d="m6.5 12.5 3.2 3.2 7.8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
									<span v-else-if="stepState(item, index) === 'error'" aria-hidden="true">!</span>
									<span v-else>{{ index + 1 }}</span>
								</span>
							</slot>
							<slot name="step" v-bind="slotPayload(item, index)">
								<span class="min-w-0" :class="orientation === 'vertical' ? 'pt-0.5' : 'mt-2'">
									<span class="block text-sm font-semibold" :class="index === activeIndex ? 'text-canvas-fg' : 'text-muted-fg'">{{ item.label }}</span>
									<span v-if="item.optional" class="mt-0.5 block text-[11px] text-muted-fg">Optional</span>
									<span v-if="showDescriptions && item.description" class="mt-1 block text-xs leading-5 text-muted-fg">{{ item.description }}</span>
								</span>
							</slot>
						</button>
					</div>
					<slot v-if="index < normalizedItems.length - 1" name="separator" :index="index" :previous="item" :next="normalizedItems[index + 1]">
						<span aria-hidden="true" :class="separatorClass(index)"></span>
					</slot>
				</li>
			</template>
		</ol>
	</nav>
</template>
