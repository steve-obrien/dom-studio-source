<script setup>
import { computed, inject } from 'vue';
import DomTooltip from '../../components/tooltip/DomTooltip.vue';
import { formFieldProviderKey } from '../field/useField.js';
import { passwordStrength } from './passwordStrength.js';

defineOptions({
	__doc: {
		name: 'Password strength',
		tag: '<DomPasswordStrength>',
		description: 'A display-only password strength meter that can read a named DomForm field or a direct model value.',
		icon: 'M4 18h3V9H4v9Zm6 0h3V6h-3v12Zm6 0h3V3h-3v15Z',
		playground: {
			initial: {
				modelValue: 'violet-orbit-lantern-47!',
			},
		},
	},
});

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
		_edit: { description: 'Password value to assess when no form field name is provided.' },
	},
	name: {
		type: String,
		default: '',
		_edit: { description: 'Named DomForm field whose current value should be assessed.' },
	},
	showCrackTime: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the estimated time required to crack the password.' },
	},
	descriptionMode: {
		type: String,
		default: 'inline',
		_edit: {
			options: ['inline', 'tooltip'],
			description: 'Show the strength description below the meter or in a tooltip.',
		},
	},
	tooltipPlacement: {
		type: String,
		default: 'bottom',
		_edit: {
			options: ['top', 'bottom', 'left', 'right'],
			description: 'Position of the strength description when descriptionMode is tooltip.',
		},
	},
	visible: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show or hide the strength meter.' },
	},
});

const form = inject(formFieldProviderKey, null);
const strengthTones = ['', 'bg-destructive', 'bg-destructive', 'bg-warning', 'bg-warning', 'bg-success'];

/**
 * Resolves the password from a named form field or the direct component value.
 *
 * @returns {string} Current password value.
 */
function resolvedPassword() {
	if (props.name && typeof form?.getValue === 'function') {
		const formValue = form.getValue(props.name);
		if (formValue !== undefined) return String(formValue ?? '');
	}
	return String(props.modelValue ?? '');
}

/**
 * Builds the visible and accessible description for the current password strength.
 *
 * @returns {string} Password strength label with an optional crack-time estimate.
 */
function strengthDescription() {
	if (!password.value) return 'Password strength not yet available';

	const crackTime = props.showCrackTime && passwordInfo.value.crackTime
		? ` (Time to crack: ${passwordInfo.value.crackTime})`
		: '';

	return `${passwordInfo.value.label} password${crackTime}`;
}

const password = computed(resolvedPassword);
const passwordInfo = computed(() => passwordStrength(password.value));
const description = computed(strengthDescription);
</script>

<template>
	<div
		v-if="visible"
		class="dom-password-strength w-full"
		:class="{ 'space-y-2': descriptionMode === 'inline' }"
		role="status"
		aria-live="polite"
		:aria-label="description"
	>
		<component
			:is="descriptionMode === 'tooltip' ? DomTooltip : 'div'"
			v-bind="descriptionMode === 'tooltip' ? { text: description, placement: tooltipPlacement } : {}"
			class="w-full"
		>
			<div
				class="grid w-full grid-cols-5 gap-1.5"
				:aria-hidden="descriptionMode === 'inline' ? 'true' : undefined"
				:aria-label="descriptionMode === 'tooltip' ? description : undefined"
				:tabindex="descriptionMode === 'tooltip' ? 0 : undefined"
			>
				<span
					v-for="step in 5"
					:key="step"
					class="h-1.5 rounded-full transition"
					:class="step <= passwordInfo.score ? strengthTones[passwordInfo.score] : 'bg-muted'"
				></span>
			</div>
		</component>
		<p v-if="descriptionMode === 'inline'" class="min-h-4 text-xs text-muted-fg">
			{{ password ? description : '' }}
		</p>
	</div>
</template>
