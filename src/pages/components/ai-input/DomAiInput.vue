<script setup>
import { computed, ref } from 'vue';
import DomTextareaComposer from '../../forms/textarea-composer/DomTextareaComposer.vue';
import DomDropdown from '../dropdown/DomDropdown.vue';
import DomIconButton from '../icon-button/DomIconButton.vue';
import DomMenu from '../menu/DomMenu.vue';
import AiModelFlyout from './AiModelFlyout.vue';
import AiModelPicker from './AiModelPicker.vue';

/**
 * An application-owned file already available in its media library.
 *
 * @typedef {object} AiInputMediaAttachment A library file reference.
 * @property {string} id Stable identifier used by the host to resolve the file.
 * @property {string} name Display filename.
 */

/**
 * A setting value and its user-facing label.
 *
 * @typedef {object} AiInputFeatureOption An available execution setting.
 * @property {string} value Value passed to the host.
 * @property {string} label Text shown for the option.
 */

/**
 * Settings supported by an individual model or the automatic router.
 *
 * @typedef {object} AiInputModelFeatures Model-specific execution capabilities.
 * @property {Array<'plan' | 'build'>} [modes] Supported workflow modes. Omit for either mode when a workflow is configured.
 * @property {AiInputFeatureOption[]} [reasoningEfforts] Supported reasoning efforts. The first option is the default.
 * @property {AiInputFeatureOption[]} [speeds] Supported execution speeds. The first option is the default.
 */

/**
 * Model available for selection. The identifier must be unique and cannot be `auto`.
 *
 * @typedef {object} AiInputModel Model supplied by the application.
 * @property {string} id Stable model identifier, preferably qualified by provider.
 * @property {string} label Model name displayed in the composer.
 * @property {string} provider Provider name used to group models in the picker.
 * @property {string} [description] Short guidance displayed in the picker.
 * @property {AiInputModelFeatures} [features] Settings supported by this model.
 * @property {boolean} [fast] Set false to offer just Standard when features.speeds is omitted and the draft sets a speed.
 */

/**
 * User-editable prompt and execution preferences.
 *
 * @typedef {object} AiInputDraft User-editable prompt and execution preferences.
 * @property {string} [text] Prompt text, including any line breaks.
 * @property {File[]} [attachments] Local files chosen for the prompt.
 * @property {AiInputMediaAttachment[]} [media] Existing files referenced by the prompt.
 * @property {'plan' | 'build'} [mode] Requested workflow mode. A model may require a supported mode to be selected.
 * @property {string} [reasoningEffort] Requested reasoning effort.
 * @property {string} [speed] Requested execution speed.
 * @property {string} [model] Selected model identifier. Defaults to `auto`.
 */

/**
 * Snapshot sent to the host when the user submits the composer.
 *
 * @typedef {object} AiInputRequest Prompt and effective settings when the user submits.
 * @property {string} text Prompt text, including any line breaks.
 * @property {File[]} attachments Local files chosen for the prompt.
 * @property {AiInputMediaAttachment[]} [media] Existing files referenced by the prompt.
 * @property {string} model Effective model identifier or `auto`.
 * @property {'plan' | 'build'} [mode] Selected workflow mode when enabled.
 * @property {string} [reasoningEffort] Effective reasoning effort when supported.
 * @property {string} [speed] Effective execution speed when supported.
 */

defineOptions({
	__doc: {
		name: 'AI Input',
		tag: '<DomAiInput>',
		description: 'Compose a prompt with files and choose a model with its supported workflow modes, reasoning efforts, and speeds.',
		icon: 'M5 6h14v10H9l-4 3V6Zm7 2v6m-3-3h6',
		nav: { section: 'ai' },
		order: 15,
		events: [
			{ name: 'update:modelValue', payload: 'AiInputDraft', description: 'Emitted when the prompt, files, model, or execution settings change.' },
			{ name: 'submit', payload: 'AiInputRequest', description: 'Emitted with the prompt, a snapshot of its files, and the current execution preferences.' },
		],
		slots: [
			{ name: 'add', payload: '{ disabled }', description: 'Replace the native file picker trigger, for example with an application media library.' },
			{ name: 'tools', payload: '{ disabled }', description: 'Application controls next to the attachment trigger, such as workflow or approval settings.' },
			{ name: 'actions', payload: '{ disabled }', description: 'Additional controls immediately before the send button.' },
		],
		keyboard: [
			{ keys: 'Enter', action: 'Send from the editor. When submitOnEnter is false, insert a newline.' },
			{ keys: 'Shift + Enter', action: 'Insert a newline. When submitOnEnter is false, send from the editor.' },
			{ keys: 'Escape', action: 'Dismiss the workflow menu, model picker, or Features view.' },
		],
	},
});

const props = defineProps({
	modelValue: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Draft bound with v-model. Includes text, local attachments, media references, and execution settings.' },
	},
	models: {
		type: Array,
		default: () => [],
		_edit: { description: 'Host-provided model catalogue. Auto is always available.' },
	},
	autoFeatures: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Capabilities advertised by the application when Auto is selected.' },
	},
	resolvedModelLabel: {
		type: String,
		default: '',
		_edit: { description: 'Host-reported model to display when Auto is selected and its choice is known.' },
	},
	layout: {
		type: String,
		default: 'toolbar',
		_edit: { options: ['toolbar', 'workflow'], description: 'The workflow layout shows a mode menu beside the attachment button.' },
	},
	modeInPicker: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the workflow mode in the model picker. Turn off when an application control sets draft.mode.' },
	},
	modelPicker: {
		type: String,
		default: 'stack',
		_edit: { options: ['stack', 'flyout'], description: 'Use a sliding Features page or compact side flyouts for model settings.' },
	},
	modelPlacement: {
		type: String,
		default: 'leading',
		_edit: { options: ['leading', 'trailing'], description: 'Place the model picker next to the attachment button or near Send, where it also shows the active reasoning effort.' },
	},
	submitOnEnter: {
		type: Boolean,
		default: true,
		_edit: { label: 'Enter submits', description: 'When enabled, Enter sends and Shift + Enter adds a line. Turn it off to swap the shortcuts.' },
	},
	markdown: {
		type: Boolean,
		default: false,
		_edit: { label: 'Rich Markdown editor', description: 'Format shortcuts as you type and submit the prompt as Markdown.' },
	},
	placeholder: { type: String, default: 'Ask AI…', _edit: { description: 'Hint shown in the empty prompt editor.' } },
	ariaLabel: { type: String, default: 'AI prompt', _edit: { description: 'Accessible name of the prompt editor.' } },
	rows: { type: Number, default: 2, _edit: { min: 1, description: 'Minimum number of text rows.' } },
	maxRows: { type: Number, default: 8, _edit: { min: 0, description: 'Maximum rows before scrolling. Use 0 for no limit.' } },
	disabled: { type: Boolean, default: false, _edit: { description: 'Disable the editor and its controls.' } },
	submitting: { type: Boolean, default: false, _edit: { description: 'Show progress and disable submission and toolbar controls while sending.' } },
	submitDisabled: { type: Boolean, default: false, _edit: { description: 'Disable sending while the host is preparing the request.' } },
});
const emit = defineEmits(['update:modelValue', 'submit']);

const fileInput = ref(null);
const autoModel = computed(() => ({ id: 'auto', label: 'Auto', description: 'Let the app choose the model.', features: props.autoFeatures }));
const modes = [
	{ value: 'plan', label: 'Plan' },
	{ value: 'build', label: 'Build' },
];
const speeds = [
	{ value: 'standard', label: 'Standard' },
	{ value: 'fast', label: 'Fast' },
];
const toolbarButton = 'inline-flex min-h-10 min-w-0 max-w-full items-center gap-1 rounded-full px-2.5 text-sm font-medium text-canvas-fg outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 disabled:opacity-50 [&>svg]:shrink-0';
const modelItems = computed(() => [autoModel.value, ...props.models.filter((model) => model.id !== 'auto')]);
const selectedModel = computed(() => modelItems.value.find((model) => model.id === props.modelValue.model) || autoModel.value);
const capabilities = computed(() => selectedModel.value.features ?? {});
const modeEnabled = computed(() => supportsMode(capabilities.value));
const modeOptions = computed(() => modes.filter((mode) => capabilities.value.modes?.includes(mode.value) ?? true));
const selectedMode = computed(() => modeOptions.value.find((mode) => mode.value === props.modelValue.mode));
const workflowMenuItems = computed(() => modes.map((mode) => ({
	...mode,
	type: 'radio',
	checked: mode === selectedMode.value,
	disabled: !modeOptions.value.includes(mode),
})));
const missingMode = computed(() => modeEnabled.value && !selectedMode.value);
const modeHint = computed(() => modeOptions.value.length
	? 'Choose a workflow mode supported by this model.'
	: 'This model has no workflow modes. Choose another model to continue.');
const speedOptions = computed(() => modelSpeeds(selectedModel.value));
const reasoningOptions = computed(() => capabilities.value.reasoningEfforts ?? []);
const selectedSpeed = computed(() => resolveFeatureOption(speedOptions.value, props.modelValue.speed));
const selectedEffort = computed(() => resolveFeatureOption(reasoningOptions.value, props.modelValue.reasoningEffort));
const showPickerMode = computed(() => props.modeInPicker && props.layout !== 'workflow');
const featureControls = computed(() => [
	{ key: 'mode', label: 'Workflow mode', options: showPickerMode.value && modeEnabled.value ? modeOptions.value : [], value: selectedMode.value?.value },
	{ key: 'reasoningEffort', label: 'Reasoning effort', options: reasoningOptions.value, value: selectedEffort.value?.value },
	{ key: 'speed', label: 'Speed', options: speedOptions.value, value: selectedSpeed.value?.value },
].filter((feature) => feature.options.length));
const attachments = computed(() => props.modelValue.attachments ?? []);
const media = computed(() => props.modelValue.media ?? []);
const attachmentItems = computed(() => [
	...attachments.value.map((file, index) => ({ key: `local:${index}`, source: 'attachments', index, name: file.name })),
	...media.value.map((file, index) => ({ key: `media:${file.id}`, source: 'media', index, name: file.name })),
]);
const controlsDisabled = computed(() => props.disabled || props.submitting);
const trailingModel = computed(() => props.modelPlacement === 'trailing');
const pickerHasFeatures = computed(() => Boolean(featureControls.value.length || (showPickerMode.value && missingMode.value)));

/**
 * Determines whether the host or model enables workflow mode selection.
 *
 * @param {AiInputModelFeatures} features Model capabilities.
 * @returns {boolean} Whether the composer needs a workflow choice.
 */
function supportsMode(features) {
	return props.modelValue.mode !== undefined || Boolean(features.modes?.length);
}

/**
 * Resolves declared speeds or the defaults for a draft with a speed preference.
 *
 * @param {AiInputModel} model Model being considered.
 * @returns {AiInputFeatureOption[]} Available speeds.
 */
function modelSpeeds(model) {
	return model.features?.speeds ?? (
		props.modelValue.speed === undefined ? [] : speeds.slice(0, model.fast === false ? 1 : speeds.length)
	);
}

/**
 * Determines whether selecting this model leads to a settings page.
 *
 * @param {AiInputModel} model Model being considered.
 * @returns {boolean} Whether the model has configurable features.
 */
function modelHasFeatures(model) {
	const features = model.features ?? {};
	return (showPickerMode.value && supportsMode(features)) || Boolean(features.reasoningEfforts?.length || modelSpeeds(model).length);
}

/**
 * Keeps a supported preference or uses the model's first advertised option.
 *
 * @param {AiInputFeatureOption[]} options Options in priority order.
 * @param {string | undefined} preference Requested setting.
 * @returns {AiInputFeatureOption | undefined} Effective option if supported.
 */
function resolveFeatureOption(options, preference) {
	return options.find((option) => option.value === preference) ?? options[0];
}

/**
 * Updates the bound draft without mutating the application-owned value.
 *
 * @param {AiInputDraft} changes Changed draft fields.
 * @returns {void}
 */
function updateDraft(changes) {
	emit('update:modelValue', { ...props.modelValue, ...changes });
}

/**
 * Applies the chosen workflow and closes the menu, returning focus to its trigger.
 *
 * @param {{ value: 'plan' | 'build' }} selection Selected workflow menu item.
 * @param {() => void} close Dropdown close callback.
 * @returns {void}
 */
function selectWorkflow({ value }, close) {
	updateDraft({ mode: value });
	close();
}

/**
 * Opens the native picker during the user's Add files action.
 *
 * @returns {void}
 */
function openFiles() {
	fileInput.value?.click();
}

/**
 * Adds the picked files and clears the picker so a removed file can be added again.
 *
 * @param {Event} event Native input change event.
 * @returns {void}
 */
function addFiles(event) {
	const input = event.currentTarget;
	const files = Array.from(input.files ?? []);
	input.value = '';
	if (!controlsDisabled.value && files.length) updateDraft({ attachments: [...attachments.value, ...files] });
}

/**
 * Removes the file at the selected chip position, allowing duplicate names.
 *
 * @param {{ source: 'attachments' | 'media', index: number }} attachment Composer chip to remove.
 * @returns {void}
 */
function removeFile({ source, index }) {
	const files = source === 'media' ? media.value : attachments.value;
	updateDraft({ [source]: files.filter((_, fileIndex) => fileIndex !== index) });
}

/**
 * Emits the prompt and the effective settings without clearing the draft.
 *
 * @param {string} text Prompt text from the shared composer.
 * @returns {void}
 */
function submit(text) {
	emit('submit', {
		text,
		attachments: [...attachments.value],
		...(media.value.length ? { media: media.value.map((file) => ({ ...file })) } : {}),
		model: selectedModel.value.id,
		...(selectedMode.value ? { mode: selectedMode.value.value } : {}),
		...(selectedEffort.value ? { reasoningEffort: selectedEffort.value.value } : {}),
		...(selectedSpeed.value ? { speed: selectedSpeed.value.value } : {}),
	});
}
</script>

<template>
	<div class="min-w-0">
		<DomTextareaComposer
			:model-value="modelValue.text ?? ''"
			:placeholder="placeholder"
			:aria-label="ariaLabel"
			:rows="rows"
			:max-rows="maxRows"
			:markdown="markdown"
			:disabled="disabled"
			:submitting="submitting"
			:submit-disabled="submitDisabled || missingMode"
			:submit-on-enter="submitOnEnter"
			:allow-empty-submit="attachmentItems.length > 0"
			submit-label="Send to AI"
			@update:model-value="updateDraft({ text: $event })"
			@submit="submit"
		>
			<template v-if="attachmentItems.length" #attachments>
				<div
					v-for="file in attachmentItems"
					:key="file.key"
					class="flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-border bg-secondary/50 py-1 pl-2.5 pr-1"
				>
					<svg viewBox="0 0 24 24" class="size-4 shrink-0 text-muted-fg" fill="none" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
					<span class="min-w-0 truncate text-xs font-medium" :title="file.name">{{ file.name }}</span>
					<DomIconButton :label="`Remove ${file.name}`" size="xs" icon="m6 6 12 12M18 6 6 18" :disabled="controlsDisabled" @click="removeFile(file)" />
				</div>
			</template>

			<template #leading="{ disabled: toolbarDisabled }">
				<div class="flex w-full min-w-0 flex-wrap items-center gap-x-0.5 gap-y-1">
					<slot name="add" :disabled="toolbarDisabled">
						<input ref="fileInput" type="file" multiple hidden :disabled="toolbarDisabled" @change="addFiles" />
						<DomIconButton label="Add files" title="Add files" :disabled="toolbarDisabled" @click="openFiles" />
					</slot>
					<DomDropdown
						v-if="modeEnabled && layout === 'workflow'"
						:disabled="toolbarDisabled || !modeOptions.length"
						:focus-value="selectedMode?.value ?? null"
						placement="top"
						width="w-[min(12rem,calc(100vw-1.5rem))] p-0!"
						trigger-class="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-fg outline-none hover:bg-secondary hover:text-canvas-fg focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
					>
						<template #trigger>
							<span class="sr-only">Workflow mode:</span>
							{{ selectedMode?.label ?? 'Choose mode' }}
						</template>
						<template #default="{ close }">
							<DomMenu :items="workflowMenuItems" @select="selectWorkflow($event, close)" />
						</template>
					</DomDropdown>
					<slot name="tools" :disabled="toolbarDisabled" />
					<AiModelFlyout
						v-if="modelPicker === 'flyout'"
						:class="trailingModel && 'ml-auto'"
						:models="modelItems"
						:selected="selectedModel"
						:features="featureControls"
						:resolved-model-label="resolvedModelLabel"
						:qualifier="trailingModel ? selectedEffort?.label : ''"
						:align="trailingModel ? 'right' : 'left'"
						:disabled="toolbarDisabled"
						:trigger-class="toolbarButton"
						@update="updateDraft"
					/>
					<AiModelPicker
						v-else
						:class="trailingModel && 'ml-auto'"
						:items="modelItems"
						:selected="selectedModel"
						:has-features="pickerHasFeatures"
						:model-has-features="modelHasFeatures"
						:resolved-model-label="resolvedModelLabel"
						:qualifier="trailingModel ? selectedEffort?.label : ''"
						:align="trailingModel ? 'right' : 'left'"
						:disabled="toolbarDisabled"
						:trigger-class="toolbarButton"
						@select="updateDraft({ model: $event })"
					>
						<template #features>
							<label v-for="feature in featureControls" :key="feature.key" class="grid gap-1.5">
								<span class="text-sm font-medium">{{ feature.label }}</span>
								<select
									class="skin-input w-full px-2.5 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
									:value="feature.value ?? ''"
									:disabled="toolbarDisabled"
									@change="updateDraft({ [feature.key]: $event.target.value })"
								>
									<option v-if="!feature.value" value="" disabled>Choose a mode</option>
									<option v-for="option in feature.options" :key="option.value" :value="option.value">{{ option.label }}</option>
								</select>
							</label>
							<p v-if="missingMode" class="text-sm text-muted-fg" role="status">{{ modeHint }}</p>
						</template>
					</AiModelPicker>
				</div>
			</template>
			<template v-if="$slots.actions" #actions="{ disabled: toolbarDisabled }">
				<slot name="actions" :disabled="toolbarDisabled" />
			</template>
		</DomTextareaComposer>
		<p v-if="missingMode" class="mt-2 text-sm text-muted-fg" role="status">{{ modeHint }}</p>
	</div>
</template>
