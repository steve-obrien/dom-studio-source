<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';
import DomPasswordStrength from '../password-strength/DomPasswordStrength.vue';
import { checkCompromisedPassword } from './pwnedPasswords.js';

defineOptions({
	__doc: {
		name: 'Password input',
		tag: '<DomPasswordInput>',
		description: 'A styled password field with show/hide control, strength feedback, and an optional compromised-password warning.',
		events: [
			{ name: 'update:modelValue', payload: 'string', description: 'Fired when the password text changes.' },
		],
	},
});

const props = defineProps({
	...fieldProps,
	label: {
		type: String,
		default: 'Password',
		_edit: { description: 'Visible field label.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Optional helper copy below the label.' },
	},
	placeholder: {
		type: String,
		default: 'Enter password',
		_edit: { description: 'Placeholder text shown before entry.' },
	},
	showStrength: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show a strength meter below the field.' },
	},
	compromised: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a warning when the current password has been found in a breach.' },
	},
	checkCompromised: {
		type: Boolean,
		default: false,
		_edit: { description: 'Check the password against the Have I Been Pwned Pwned Passwords API.' },
	},
	compromisedCheckDelay: {
		type: Number,
		default: 600,
		_edit: { description: 'Delay in milliseconds before checking the Pwned Passwords API after typing.' },
	},
	compromisedMessage: {
		type: String,
		default: 'This password appears in known breaches. Choose a different password.',
		_edit: { description: 'Warning copy shown when compromised is true.' },
	},
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);
const visible = ref(false);
const field = useField(props, emit, { idPrefix: 'dom-password-input' });
const compromisedCheck = ref({
	pending: false,
	compromised: false,
	count: 0,
	error: null,
});
const isCompromised = computed(() => props.compromised || (props.checkCompromised && compromisedCheck.value.compromised));
const passwordFieldAttrs = computed(() => ({
	...field.fieldAttrs.value,
	invalid: field.invalid.value || isCompromised.value,
}));
const compromisedWarning = computed(() => {
	if (!props.checkCompromised || !compromisedCheck.value.compromised) return props.compromisedMessage;
	const count = compromisedCheck.value.count;
	const records = count === 1 ? 'record' : 'records';
	return `${props.compromisedMessage} It appears in ${count.toLocaleString()} known breach ${records}.`;
});

let compromisedCheckTimer;
let compromisedCheckController;

const resetCompromisedCheck = () => {
	clearTimeout(compromisedCheckTimer);
	compromisedCheckController?.abort();
	compromisedCheckController = null;
	compromisedCheck.value = {
		pending: false,
		compromised: false,
		count: 0,
		error: null,
	};
};

const runCompromisedCheck = async (password) => {
	compromisedCheckController?.abort();
	const controller = new AbortController();
	compromisedCheckController = controller;
	compromisedCheck.value = {
		pending: true,
		compromised: false,
		count: 0,
		error: null,
	};

	try {
		const result = await checkCompromisedPassword(password, { signal: controller.signal });
		if (controller.signal.aborted) return;
		compromisedCheck.value = {
			pending: false,
			compromised: result.compromised,
			count: result.count,
			error: null,
		};
	} catch (error) {
		if (controller.signal.aborted) return;
		compromisedCheck.value = {
			pending: false,
			compromised: false,
			count: 0,
			error,
		};
	}
};

if (typeof window !== 'undefined') {
	watch(
		() => [props.checkCompromised, field.value.value, props.compromisedCheckDelay],
		([shouldCheck, password, delay]) => {
			clearTimeout(compromisedCheckTimer);
			compromisedCheckController?.abort();

			if (!shouldCheck || !password) {
				resetCompromisedCheck();
				return;
			}

			compromisedCheck.value = {
				pending: true,
				compromised: false,
				count: 0,
				error: null,
			};
			compromisedCheckTimer = setTimeout(() => runCompromisedCheck(password), Math.max(0, delay));
		},
		{ immediate: true },
	);

	onBeforeUnmount(resetCompromisedCheck);
}

</script>

<template>
	<DomField v-bind="passwordFieldAttrs" :chrome="chrome">
		<div class="dom-password-input__body">
			<div class="relative">
				<input
					v-bind="field.inputAttrs.value"
					:type="visible ? 'text' : 'password'"
					:aria-invalid="field.invalid.value || isCompromised || undefined"
					class="skin-input h-10 pr-11"
					@input="field.onInput($event.target.value)"
					@focus="field.onFocus"
					@blur="field.onBlur"
				/>
				<button
					type="button"
					class="absolute inset-y-1 right-1 grid size-8 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-secondary-fg focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
					:disabled="field.disabled.value"
					:aria-label="visible ? 'Hide password' : 'Show password'"
					@click="visible = !visible"
				>
					<svg v-if="visible" class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M3 3l18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						<path d="M8.5 5.4A9.8 9.8 0 0 1 12 4.75c4.6 0 7.7 3.4 9 7.25a11 11 0 0 1-2.2 3.7M6.2 6.9A11 11 0 0 0 3 12c1.3 3.85 4.4 7.25 9 7.25 1.2 0 2.3-.23 3.3-.64" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<svg v-else class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M3 12c1.3-3.85 4.4-7.25 9-7.25s7.7 3.4 9 7.25c-1.3 3.85-4.4 7.25-9 7.25S4.3 15.85 3 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
						<path d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" stroke="currentColor" stroke-width="1.8" />
					</svg>
				</button>
			</div>

			<DomPasswordStrength v-if="showStrength" :model-value="field.value.value" class="mt-3" />
			<transition
				enter-active-class="transition duration-300 ease"
				enter-from-class="opacity-0 -translate-y-2 max-h-0"
				enter-to-class="opacity-100 translate-y-0 max-h-28"
				leave-active-class="transition duration-200 ease"
				leave-from-class="opacity-100 translate-y-0 max-h-28"
				leave-to-class="opacity-0 -translate-y-2 max-h-0"
			>
				<p
					v-if="isCompromised"
					class="dom-password-input__warning mt-3 overflow-hidden rounded-lg border-warning-fg/30 bg-warning px-3 py-2 text-xs leading-5 text-warning-fg"
					style="transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1);"
				>
					{{ compromisedWarning }}
				</p>
			</transition>
		</div>
	</DomField>
</template>
