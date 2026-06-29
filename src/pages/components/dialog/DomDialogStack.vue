<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import DomButton from '../button/DomButton.vue';
import DomDialog from './DomDialog.vue';
import DomDialogSchemaForm from './DomDialogSchemaForm.vue';

const DIALOG_REMOVAL_DELAY_MS = 320;

defineOptions({
	__doc: {
		name: 'Dialog stack',
		tag: '<DomDialogStack>',
		description: 'Renderer for dialogs created with useDialogs(). Mount it once, then call the dialog API from script.',
		slots: [
			{ name: 'default', payload: '{ dialog, resolve, dismiss }', description: 'Custom renderer for a programmatic dialog body.' },
			{ name: 'footer', payload: '{ dialog, resolve, dismiss }', description: 'Custom renderer for programmatic dialog actions.' },
		],
		events: [
			{ name: 'resolve', payload: '({ id, value })', description: 'Emitted when a dialog resolves.' },
			{ name: 'dismiss', payload: '({ id, value })', description: 'Emitted when a dialog is dismissed.' },
			{ name: 'action', payload: '({ id, dialog, ...payload })', description: 'Emitted by custom dialog bodies for app-specific actions.' },
		],
	},
});

const props = defineProps({
	dialogs: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Visible programmatic dialogs from useDialogs().',
			props: {
				addLabel: '+ Add dialog',
				compact: true,
				schema: [
					{ key: 'id', label: 'ID', placeholder: 'dialog-id', default: (index) => `dialog-${index + 1}` },
					{ key: 'title', label: 'Title', placeholder: 'Delete project?' },
					{ key: 'description', label: 'Description', placeholder: 'This action cannot be undone.' },
					{ key: 'message', label: 'Message', placeholder: 'Are you sure?' },
					{ key: 'type', label: 'Type', placeholder: 'dialog | confirm', default: 'dialog' },
				],
			},
		},
	},
});
const emit = defineEmits(['resolve', 'dismiss', 'action']);
const renderedDialogs = ref([]);
const removalTimers = new Map();

watch(
	() => props.dialogs,
	(dialogs) => syncRenderedDialogs(dialogs),
	{ immediate: true, deep: true },
);

onBeforeUnmount(() => {
	if (typeof window !== 'undefined') {
		for (const timer of removalTimers.values()) window.clearTimeout(timer);
	}
	removalTimers.clear();
});

/**
 * Resolve a dialog, notify the owner immediately, and let the mounted item animate out.
 *
 * @param {{ id: string, dialog: Record<string, unknown> }} item Rendered stack item.
 * @param {unknown} [value] Value passed to the dialog resolver.
 * @returns {void}
 */
function resolve(item, value = true) {
	if (item.closing) return;
	emit('resolve', { id: item.id, value });
	closeDialogItem(item.id);
}

/**
 * Dismiss a dialog, notify the owner immediately, and let the mounted item animate out.
 *
 * @param {{ id: string, dialog: Record<string, unknown> }} item Rendered stack item.
 * @param {unknown} [value] Value passed to the dialog resolver.
 * @returns {void}
 */
function dismiss(item, value = false) {
	if (item.closing) return;
	emit('dismiss', { id: item.id, value });
	closeDialogItem(item.id);
}

/**
 * Route custom body actions through the standard resolve and dismiss lifecycle.
 *
 * @param {{ id: string, dialog: Record<string, unknown> }} item Rendered stack item.
 * @param {unknown} payload Custom action payload from a dialog body.
 * @returns {void}
 */
function onDialogAction(item, payload) {
	const detail = {
		id: item.id,
		dialog: item.dialog,
		...(payload && typeof payload === 'object' ? payload : { action: payload }),
	};
	if (detail.action === 'resolve') resolve(item, detail.value);
	else if (detail.action === 'dismiss') dismiss(item, detail.value);
	emit('action', detail);
}

/**
 * Keep the local rendered list aligned with caller-owned dialogs without skipping leave effects.
 *
 * @param {Array<Record<string, unknown> & { id: string }>} dialogs Caller-owned dialog records.
 * @returns {void}
 */
function syncRenderedDialogs(dialogs) {
	const incomingIds = new Set();

	for (const dialog of dialogs) {
		incomingIds.add(dialog.id);
		const item = renderedDialogs.value.find((entry) => entry.id === dialog.id);

		if (item) {
			item.dialog = dialog;
			if (item.closing) reopenDialogItem(item);
		} else {
			renderedDialogs.value.push({
				id: dialog.id,
				dialog,
				open: true,
				closing: false,
			});
		}
	}

	for (const item of renderedDialogs.value) {
		if (!incomingIds.has(item.id)) closeDialogItem(item.id);
	}
}

/**
 * Re-open an item if the owner restores the same dialog id before removal completes.
 *
 * @param {{ id: string, open: boolean, closing: boolean }} item Rendered stack item.
 * @returns {void}
 */
function reopenDialogItem(item) {
	clearRemovalTimer(item.id);
	item.open = true;
	item.closing = false;
}

/**
 * Start the close transition for a rendered dialog and schedule its final removal.
 *
 * @param {string} id Dialog id to close.
 * @returns {void}
 */
function closeDialogItem(id) {
	const item = renderedDialogs.value.find((entry) => entry.id === id);
	if (!item || item.closing) return;
	item.closing = true;
	item.open = false;
	scheduleDialogRemoval(id);
}

/**
 * Remove a dialog after the component's close transition has had time to finish.
 *
 * @param {string} id Dialog id to remove.
 * @returns {void}
 */
function scheduleDialogRemoval(id) {
	clearRemovalTimer(id);
	if (typeof window === 'undefined') {
		removeDialogItem(id);
		return;
	}
	removalTimers.set(id, window.setTimeout(() => removeDialogItem(id), DIALOG_REMOVAL_DELAY_MS));
}

/**
 * Cancel a pending removal timer for a rendered dialog.
 *
 * @param {string} id Dialog id associated with the timer.
 * @returns {void}
 */
function clearRemovalTimer(id) {
	const timer = removalTimers.get(id);
	if (!timer || typeof window === 'undefined') return;
	window.clearTimeout(timer);
	removalTimers.delete(id);
}

/**
 * Remove a dialog from the local rendered list once its leave transition is complete.
 *
 * @param {string} id Dialog id to remove.
 * @returns {void}
 */
function removeDialogItem(id) {
	clearRemovalTimer(id);
	renderedDialogs.value = renderedDialogs.value.filter((item) => item.id !== id);
}

/**
 * Convert a native dialog close into a dismiss event unless this stack already initiated it.
 *
 * @param {{ id: string, closing: boolean }} item Rendered stack item.
 * @returns {void}
 */
function onDialogClose(item) {
	if (item.closing) return;
	dismiss(item);
}

/**
 * Resolve the button variant for a confirmation action.
 *
 * @param {Record<string, unknown>} dialog Dialog options.
 * @returns {string}
 */
function confirmVariant(dialog) {
	return dialog.tone === 'danger' ? 'danger' : 'primary';
}

/**
 * Resolve the custom component body, if one was supplied.
 *
 * @param {Record<string, unknown>} dialog Dialog options.
 * @returns {unknown}
 */
function dialogComponent(dialog) {
	return dialog.component || null;
}
</script>

<template>
	<DomDialog
		v-for="item in renderedDialogs"
		:key="item.id"
		:model-value="item.open"
		:title="item.dialog.title || ''"
		:description="item.dialog.description || ''"
		:static="item.dialog.static || null"
		:backdrop="item.dialog.backdrop !== false"
		:footer="item.dialog.footer !== false"
		@close="onDialogClose(item)"
		@close-complete="removeDialogItem(item.id)"
	>
		<slot :dialog="item.dialog" :resolve="(value = true) => resolve(item, value)" :dismiss="(value = false) => dismiss(item, value)">
			<component
				:is="dialogComponent(item.dialog)"
				v-if="dialogComponent(item.dialog)"
				v-bind="item.dialog.props || {}"
				@action="onDialogAction(item, $event)"
				@resolve="resolve(item, $event)"
				@dismiss="dismiss(item, $event)"
				@close="dismiss(item)"
			/>
			<DomDialogSchemaForm
				v-else-if="item.dialog.formSchema"
				:schema="item.dialog.formSchema"
				:model-value="item.dialog.formValues || {}"
				:submit-text="item.dialog.confirmText || 'Submit'"
				:cancel-text="item.dialog.cancelText || 'Cancel'"
				:invalid-message="item.dialog.invalidMessage || undefined"
				@resolve="resolve(item, $event)"
				@dismiss="dismiss(item, $event)"
			/>
			<p v-else-if="item.dialog.message" class="text-sm text-muted-fg">
				{{ item.dialog.message }}
			</p>
		</slot>

		<template v-if="item.dialog.footer !== false" #footer>
			<slot name="footer" :dialog="item.dialog" :resolve="(value = true) => resolve(item, value)" :dismiss="(value = false) => dismiss(item, value)">
				<DomButton
					v-if="item.dialog.showCancel || item.dialog.type === 'confirm'"
					variant="secondary"
					@click="dismiss(item)"
				>
					{{ item.dialog.cancelText || 'Cancel' }}
				</DomButton>
				<DomButton :variant="confirmVariant(item.dialog)" @click="resolve(item)">
					{{ item.dialog.confirmText || 'OK' }}
				</DomButton>
			</slot>
		</template>
	</DomDialog>
</template>
