<script setup>
import { computed, provide, ref, watch } from 'vue';
import { useKeyboardViewport } from '../_shared/useKeyboardViewport.js';

const shell = ref(null);
provide('dom-app-shell', shell);

defineOptions({
	__doc: {
		name: 'App shell',
		tag: '<DomAppShell>',
		description: 'A bounded app viewport with safe areas, pinned top and bottom slots, and one scrolling content region. Fills the viewport by default; use height="100%" only inside an explicitly sized parent. Set content-scroll to false when a nested DomAppStack owns scrolling.',
		slots: [
			{ name: 'top', description: 'Top navigation, status, or toolbar content.' },
			{ name: '(default)', description: 'Scrollable app content.' },
			{ name: 'bottom', payload: '{ keyboardOpen }', description: 'Bottom navigation or persistent controls. Receives the detected keyboard state.' },
			{ name: 'overlay', description: 'Absolute overlay layer for drawers, action sheets, and app-level panels.' },
		],
		events: [{ name: 'keyboard-change', payload: '{ open, height }', description: 'Estimated keyboard state or the app-supplied native keyboard inset.' }],
		playground: {
			mobileSlot: 'shell',
			initial: { height: '100%' },
		},
	},
});

const props = defineProps({
	keyboardBehavior: {
		type: String,
		default: 'resize',
		validator: (value) => ['resize', 'none'].includes(value),
		_edit: { options: ['resize', 'none'], description: 'Resize to the visible viewport while editing. Use none when the native host owns keyboard layout.' },
	},
	keyboardInset: {
		type: Number,
		default: null,
		_edit: { typeRef: 'number | null', description: 'Optional native keyboard height in CSS pixels. Leave null to detect viewport changes; zero explicitly means closed.' },
	},
	hideBottomOnKeyboard: {
		type: Boolean,
		default: false,
		_edit: { description: 'Hide bottom navigation while the keyboard is visible. Leave false for a persistent reply composer.' },
	},
	height: {
		type: String,
		default: '100dvh',
		_edit: { description: 'App height as a CSS length. Use 100dvh standalone, 36rem for an embedded app, or 100% inside a sized parent.' },
	},
	contentScroll: {
		type: Boolean,
		default: true,
		_edit: { description: 'Let the main region scroll. Disable when a nested stack or split-pane layout owns scrolling.' },
	},
	variant: {
		type: String,
		default: 'app',
		_edit: {
			options: ['app', 'card'],
			description: 'Use app for full-screen app views and card for inset surfaces.',
		},
	},
});
const emit = defineEmits(['keyboard-change']);
const keyboard = useKeyboardViewport(shell, () => props.keyboardBehavior === 'resize', () => props.keyboardInset);
const keyboardOpen = keyboard.open;
const shellStyle = computed(() => ({
	height: props.height,
	maxHeight: keyboardOpen.value ? `${keyboard.available.value}px` : undefined,
	'--dom-keyboard-height': `${keyboard.height.value}px`,
	'--dom-safe-area-bottom': keyboardOpen.value ? '0px' : undefined,
}));

/** Reports geometry changes so the app can coordinate native controls. */
function reportKeyboard() {
	emit('keyboard-change', { open: keyboardOpen.value, height: keyboard.height.value });
}
watch([keyboard.open, keyboard.height], reportKeyboard);
</script>

<template>
	<div
		ref="shell"
		data-dom-app-shell
		:data-keyboard-open="keyboardOpen"
		class="[&_input]:text-base [&_textarea]:text-base [&_select]:text-base relative isolate flex min-h-0 min-w-0 w-full flex-col overflow-hidden overscroll-none bg-canvas text-canvas-fg pt-[var(--dom-safe-area-top,env(safe-area-inset-top,0px))] pb-[var(--dom-safe-area-bottom,env(safe-area-inset-bottom,0px))] pl-[var(--dom-safe-area-left,env(safe-area-inset-left,0px))] pr-[var(--dom-safe-area-right,env(safe-area-inset-right,0px))]"
		:class="variant === 'card' && 'skin-card rounded-[2rem]'"
		:style="shellStyle"
	>
		<div v-if="$slots.top" class="shrink-0 [--dom-safe-area-top:0px] [--dom-safe-area-bottom:0px] [--dom-safe-area-left:0px] [--dom-safe-area-right:0px]">
			<slot name="top" />
		</div>
		<main data-dom-app-shell-main class="min-h-0 min-w-0 flex-1 overscroll-contain [--dom-safe-area-top:0px] [--dom-safe-area-bottom:0px] [--dom-safe-area-left:0px] [--dom-safe-area-right:0px]" :class="contentScroll ? 'overflow-y-auto' : 'flex flex-col overflow-hidden'">
			<slot />
		</main>
		<div v-if="$slots.bottom" v-show="!hideBottomOnKeyboard || !keyboardOpen" class="shrink-0 [--dom-safe-area-top:0px] [--dom-safe-area-bottom:0px] [--dom-safe-area-left:0px] [--dom-safe-area-right:0px]">
			<slot name="bottom" :keyboard-open="keyboardOpen" />
		</div>
		<div v-if="$slots.overlay" data-dom-app-shell-overlay class="pointer-events-none absolute inset-0 z-20">
			<slot name="overlay" />
		</div>
	</div>
</template>
