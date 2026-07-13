<script setup>
import { computed, unref, useId } from 'vue';
import DomField from '../field/DomField.vue';
import { normalizeErrors } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'Input group',
		tag: '<DomInputGroup>',
		description: 'A display-only frame that presents several independent form controls as one grouped input, followed by optional feedback and their errors.',
		icon: 'M5 5h14v14H5V5Zm0 7h14',
		slots: [
			{ name: '(default)', description: 'Form controls using chrome="false". Each control keeps its own model, name, validation, and form registration.' },
			{ name: 'feedback', description: 'Supporting content shown outside the shared frame and before validation errors.' },
		],
	},
});

const props = defineProps({
	ariaLabel: {
		type: String,
		default: 'Grouped form fields',
		_edit: { description: 'Accessible name for the shared control frame.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Optional helper text shown below the grouped errors.' },
	},
	errors: {
		type: [Array, Object, String],
		default: () => [],
		_edit: { component: 'DomJsonInput', description: 'Optional group-level validation errors shown after child field errors.' },
	},
	errorLabels: {
		type: Boolean,
		default: true,
		_edit: { description: 'Prefix each child error with its field label so repeated messages remain distinguishable.' },
	},
	invalid: {
		type: Boolean,
		default: false,
		_edit: { description: 'Mark the shared frame invalid in addition to any child field state.' },
	},
	visible: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show or hide the complete input group.' },
	},
});

const inputGroupId = `dom-input-group-${useId()}`;
const descriptionId = `${inputGroupId}-description`;
const groupErrorId = `${inputGroupId}-error`;

/**
 * Normalizes group-level errors without merging identical child messages.
 */
const groupErrors = computed(() => normalizeErrors(props.errors));

/**
 * Resolves a reactive field registration value or its matching field attribute.
 *
 * @param {Record<string, unknown>} field Registered child field.
 * @param {string} key Registration property to resolve.
 * @returns {unknown} Resolved property value.
 */
function fieldValue(field, key) {
	const directValue = unref(field?.[key]);
	if (directValue !== undefined) return directValue;
	return unref(unref(field?.fieldAttrs)?.[key]);
}

/**
 * Returns the stable key for a registered child field.
 *
 * @param {Record<string, unknown>} field Registered child field.
 * @param {number} index Child position used as a final fallback.
 * @returns {string} Stable rendering key.
 */
function fieldKey(field, index) {
	return String(fieldValue(field, 'path') || fieldValue(field, 'htmlId') || fieldValue(field, 'id') || index);
}

/**
 * Returns the visible and accessible label for a child field.
 *
 * @param {Record<string, unknown>} field Registered child field.
 * @returns {string} Child field label.
 */
function fieldLabel(field) {
	return String(fieldValue(field, 'label') || fieldValue(field, 'name') || 'Field');
}

/**
 * Returns the native input ID registered by a child field.
 *
 * @param {Record<string, unknown>} field Registered child field.
 * @returns {string} Native input ID.
 */
function fieldHtmlId(field) {
	return String(fieldValue(field, 'htmlId') || fieldValue(field, 'id') || '');
}

/**
 * Returns the error element ID expected by a child input's ARIA attributes.
 *
 * @param {Record<string, unknown>} field Registered child field.
 * @returns {string} Child error element ID.
 */
function fieldErrorId(field) {
	return String(fieldValue(field, 'errorId') || '');
}

/**
 * Returns every validation message registered for a child field.
 *
 * @param {Record<string, unknown>} field Registered child field.
 * @returns {string[]} Normalized validation messages.
 */
function fieldErrors(field) {
	return normalizeErrors(fieldValue(field, 'errors'));
}

/**
 * Reports whether any registered child field currently has validation errors.
 *
 * @param {Array<Record<string, unknown>>} fields Registered child fields.
 * @returns {boolean} Whether child validation errors exist.
 */
function hasFieldErrors(fields) {
	return fields.some((field) => fieldErrors(field).length > 0);
}

/**
 * Adds field context to an error when several controls share one error region.
 *
 * @param {Record<string, unknown>} field Registered child field.
 * @param {string} error Validation message.
 * @returns {string} Error copy for display.
 */
function displayError(field, error) {
	if (!props.errorLabels) return error;
	return `${fieldLabel(field)}: ${error}`;
}
</script>

<template>
	<DomField :chrome="false" :errors="errors" :invalid="invalid" :visible="visible">
		<template #default="{ invalid: groupInvalid, fields }">
			<div class="w-full space-y-1.5">
				<div
					:aria-label="ariaLabel"
					:aria-describedby="description ? descriptionId : undefined"
					:aria-errormessage="groupErrors.length ? groupErrorId : undefined"
					:aria-invalid="groupInvalid || undefined"
					role="group"
					class="dom-input-group__controls overflow-hidden rounded-lg border border-input bg-canvas shadow-sm transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 data-[invalid]:border-destructive data-[invalid]:focus-within:border-destructive data-[invalid]:focus-within:ring-destructive/25"
					:data-invalid="groupInvalid ? '' : undefined"
				>
					<div class="sr-only">
						<label
							v-for="(field, fieldIndex) in fields"
							:key="`label-${fieldKey(field, fieldIndex)}`"
							:for="fieldHtmlId(field) || undefined"
						>
							{{ fieldLabel(field) }}
						</label>
					</div>
					<slot />
				</div>

				<div v-if="$slots.feedback" class="dom-input-group__feedback pt-1">
					<slot name="feedback" />
				</div>

				<div
					v-if="hasFieldErrors(fields) || groupErrors.length"
					class="space-y-1 text-[11px] leading-snug text-destructive"
					aria-live="polite"
				>
					<template v-for="(field, fieldIndex) in fields" :key="`errors-${fieldKey(field, fieldIndex)}`">
						<p
							v-for="(error, errorIndex) in fieldErrors(field)"
							:key="`${fieldKey(field, fieldIndex)}-${error}-${errorIndex}`"
							:id="errorIndex === 0 ? fieldErrorId(field) || undefined : undefined"
						>
							{{ displayError(field, error) }}
						</p>
					</template>
					<p
						v-for="(error, errorIndex) in groupErrors"
						:key="`group-${error}-${errorIndex}`"
						:id="errorIndex === 0 ? groupErrorId : undefined"
					>
						{{ error }}
					</p>
				</div>

				<p v-if="description" :id="descriptionId" class="text-[11px] leading-snug text-muted-fg">
					{{ description }}
				</p>
			</div>
		</template>
	</DomField>
</template>

<style scoped>
.dom-input-group__controls :deep(.skin-input) {
	background: transparent;
	border: 0;
	border-radius: 0;
	box-shadow: none;
}

.dom-input-group__controls :deep(.skin-input:focus) {
	border-color: transparent;
	box-shadow: none;
}

.dom-input-group__controls :deep(.dom-password-input__warning) {
	margin: 0.75rem;
}

:global(.dom-input-group__controls > *:not(.sr-only):not(:last-child)) {
	border-bottom: 1px solid var(--border);
}
</style>
