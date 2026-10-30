<script setup>
import { computed, ref, watch } from 'vue';
import DomField from '../field/DomField.vue';
import { fieldProps } from '../field/fieldProps.js';
import { useField } from '../field/useField.js';

defineOptions({
	__doc: {
		name: 'File upload',
		tag: '<DomFileUpload>',
		description: 'A generic local file picker and dropzone for forms. Uploading, persistence, and media APIs stay parent-owned.',
		icon: 'M12 16V4M8 8l4-4 4 4M5 16v3h14v-3',
		events: [
			{ name: 'update:modelValue', payload: 'Array<File | DomUploadedFile>', description: 'Fired when the local file list changes.' },
			{ name: 'add', payload: 'Array<File>', description: 'Fired with accepted local File objects.' },
			{ name: 'remove', payload: '{ file, index }', description: 'Fired when a file row is removed.' },
			{ name: 'reject', payload: 'Array<DomFileUploadRejection>', description: 'Fired when files fail accept, size, or count checks.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the native file input receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the native file input loses focus.' },
		],
		playground: {
			initial: {
				label: 'Receipt',
				description: 'Attach images or PDFs. Uploading is handled by the parent.',
				accept: 'image/*,.pdf',
				maxFiles: 3,
			},
		},
	},
});

const props = defineProps({
	...fieldProps,
	modelValue: {
		type: Array,
		default: () => [],
		_edit: { description: 'Selected local files or existing uploaded file metadata.' },
	},
	accept: {
		type: String,
		default: '',
		_edit: { description: 'Native accept string, such as image/*,.pdf.' },
	},
	multiple: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow multiple files.' },
	},
	maxFiles: {
		type: Number,
		default: 0,
		_edit: { description: 'Maximum file count. Use 0 for no explicit limit.' },
	},
	maxSize: {
		type: Number,
		default: 0,
		_edit: { description: 'Maximum file size in bytes. Use 0 for no explicit limit.' },
	},
	browseLabel: {
		type: String,
		default: 'Choose files',
		_edit: { description: 'Browse button label.' },
	},
	emptyTitle: {
		type: String,
		default: 'Drop files here',
		_edit: { description: 'Title shown when no files are selected.' },
	},
	emptyDescription: {
		type: String,
		default: 'or browse from your device',
		_edit: { description: 'Helper copy shown in the dropzone.' },
	},
});

const emit = defineEmits(['update:modelValue', 'add', 'remove', 'reject', 'focus', 'blur']);
const field = useField(props, emit, { idPrefix: 'dom-file-upload' });
const input = ref(null);
const dragging = ref(false);
const lastRejections = ref([]);

const files = computed(() => toArray(field.value.value).map(normalizeFileRecord));
const hasFiles = computed(() => files.value.length > 0);
const disabled = computed(() => field.disabled.value || field.readOnly.value);
const rejectionErrors = computed(() => uniqueMessages(
	lastRejections.value.map((rejection) => {
		const name = rejection.file?.name;
		return name ? `${name}: ${rejection.message}` : rejection.message;
	}),
));
const displayedErrors = computed(() => uniqueMessages([
	...field.errors.value,
	...rejectionErrors.value,
]));
const fieldAttrs = computed(() => ({
	...field.fieldAttrs.value,
	errors: displayedErrors.value,
	invalid: field.invalid.value || rejectionErrors.value.length > 0,
	errorId: displayedErrors.value.length ? `${field.id.value}-error` : field.fieldAttrs.value.errorId,
}));
const describedBy = computed(() => [
	field.descriptionId.value,
	fieldAttrs.value.errorId,
].filter(Boolean).join(' '));
const dropzoneClass = computed(() => [
	'rounded-lg border border-dashed bg-canvas px-4 py-5 text-center shadow-sm transition',
	fieldAttrs.value.invalid ? 'border-destructive' : 'border-border',
	dragging.value && !disabled.value && 'border-primary bg-primary/5',
	disabled.value ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/45 hover:bg-secondary/40',
]);

watch(() => props.modelValue, () => {
	lastRejections.value = [];
});

function toArray(value) {
	if (!value) return [];
	if (Array.isArray(value)) return value.filter(Boolean);
	return [value].filter(Boolean);
}

function uniqueMessages(messages) {
	const seen = new Set();
	return messages
		.map((message) => String(message || '').trim())
		.filter((message) => {
			if (!message || seen.has(message)) return false;
			seen.add(message);
			return true;
		});
}

function isNativeFile(value) {
	return typeof File !== 'undefined' && value instanceof File;
}

function normalizeFileRecord(file) {
	if (isNativeFile(file)) {
		return {
			raw: file,
			name: file.name,
			size: file.size,
			type: file.type,
			local: true,
		};
	}

	if (file && typeof file === 'object') {
		return {
			raw: file,
			name: file.name || file.filename || file.id || 'Untitled file',
			size: file.size,
			type: file.type || file.mimeType || '',
			url: file.url || file.previewUrl || '',
			local: false,
		};
	}

	return {
		raw: file,
		name: String(file),
		size: null,
		type: '',
		local: false,
	};
}

function openPicker() {
	if (disabled.value) return;
	input.value?.click();
}

function onInputChange(event) {
	acceptFiles(Array.from(event.target.files || []));
	event.target.value = '';
}

function onDragEnter() {
	if (!disabled.value) dragging.value = true;
}

function onDragLeave(event) {
	if (!event.currentTarget.contains(event.relatedTarget)) dragging.value = false;
}

function onDrop(event) {
	dragging.value = false;
	if (disabled.value) return;
	acceptFiles(Array.from(event.dataTransfer?.files || []));
}

function acceptFiles(nextFiles) {
	if (disabled.value || !nextFiles.length) return;

	lastRejections.value = [];
	const accepted = [];
	const rejected = [];
	const current = props.multiple ? toArray(field.value.value) : [];
	const maxFiles = Number(props.maxFiles);
	const limit = props.multiple
		? Number.isFinite(maxFiles) && maxFiles > 0 ? maxFiles : Infinity
		: 1;
	let available = Math.max(0, limit - current.length);

	for (const file of nextFiles) {
		const rejection = rejectionForFile(file);
		if (rejection) {
			rejected.push(rejection);
			continue;
		}
		if (available <= 0) {
			rejected.push(rejectionPayload(file, 'max-files', `Add ${limit} file${limit === 1 ? '' : 's'} or fewer.`));
			continue;
		}

		accepted.push(file);
		available -= 1;
	}

	if (accepted.length) {
		const value = props.multiple ? [...current, ...accepted] : accepted.slice(0, 1);
		field.onInput(value);
		emit('add', accepted);
	}
	if (rejected.length) {
		lastRejections.value = rejected;
		emit('reject', rejected);
	}
}

function rejectionForFile(file) {
	const maxSize = Number(props.maxSize);
	if (Number.isFinite(maxSize) && maxSize > 0 && file.size > maxSize) {
		return rejectionPayload(file, 'max-size', `Use files smaller than ${formatSize(maxSize)}.`);
	}
	if (!matchesAccept(file)) {
		return rejectionPayload(file, 'accept', 'Choose an allowed file type.');
	}
	return null;
}

function rejectionPayload(file, reason, message) {
	return { file, reason, message };
}

function matchesAccept(file) {
	const accept = String(props.accept || '').trim();
	if (!accept) return true;

	const rules = accept.split(',').map((rule) => rule.trim().toLowerCase()).filter(Boolean);
	const name = String(file.name || '').toLowerCase();
	const type = String(file.type || '').toLowerCase();

	return rules.some((rule) => {
		if (rule.startsWith('.')) return name.endsWith(rule);
		if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
		return type === rule;
	});
}

function removeFile(index) {
	if (disabled.value) return;

	lastRejections.value = [];
	const current = toArray(field.value.value);
	const removed = current[index];
	const next = current.filter((_, itemIndex) => itemIndex !== index);
	field.onInput(next);
	emit('remove', { file: removed, index });
}

function formatSize(size) {
	const value = Number(size);
	if (!Number.isFinite(value) || value <= 0) return '';
	if (value < 1024) return `${value} B`;
	if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
	return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function fileKey(file, index) {
	return file.raw?.id || file.raw?.url || `${file.name}-${file.size || 0}-${index}`;
}
</script>

<template>
	<DomField v-bind="fieldAttrs" :chrome="chrome">
		<div class="space-y-3">
			<div
				:class="dropzoneClass"
				@dragenter.prevent="onDragEnter"
				@dragover.prevent="onDragEnter"
				@dragleave="onDragLeave"
				@drop.prevent="onDrop"
				@click="openPicker"
			>
				<input
					ref="input"
					:id="field.id.value"
					:name="field.htmlName.value"
					type="file"
					class="sr-only"
					:accept="accept || undefined"
					:multiple="multiple"
					:disabled="disabled || undefined"
					:required="required && !hasFiles || undefined"
					:aria-invalid="fieldAttrs.invalid || undefined"
					:aria-describedby="describedBy || undefined"
					:aria-errormessage="fieldAttrs.errorId || undefined"
					@change="onInputChange"
					@focus="field.onFocus"
					@blur="field.onBlur"
				/>
				<div class="mx-auto grid size-10 place-items-center rounded-full bg-secondary text-muted-fg" aria-hidden="true">
					<svg viewBox="0 0 24 24" class="size-5" fill="none">
						<path d="M12 15V5M8 9l4-4 4 4M5 16v3h14v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
				<p class="mt-3 text-sm font-semibold text-canvas-fg">{{ hasFiles ? browseLabel : emptyTitle }}</p>
				<p class="mt-1 text-sm text-muted-fg">{{ emptyDescription }}</p>
				<button
					type="button"
					class="mt-4 rounded-md border border-border bg-canvas px-3 py-1.5 text-sm font-medium text-canvas-fg shadow-sm transition hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
					:disabled="disabled || undefined"
					@click.stop="openPicker"
				>
					{{ browseLabel }}
				</button>
			</div>

			<ul v-if="hasFiles" class="divide-y divide-border overflow-hidden rounded-lg border border-border">
				<li v-for="(file, index) in files" :key="fileKey(file, index)" class="flex items-center gap-3 bg-canvas px-3 py-2">
					<div class="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-muted-fg" aria-hidden="true">
						<svg viewBox="0 0 24 24" class="size-4" fill="none">
							<path d="M7 4h7l3 3v13H7V4Zm7 0v4h4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
						</svg>
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-canvas-fg">{{ file.name }}</p>
						<p class="text-xs text-muted-fg">
							<span v-if="file.size">{{ formatSize(file.size) }}</span>
							<span v-if="file.size && file.type"> / </span>
							<span v-if="file.type">{{ file.type }}</span>
							<span v-if="!file.size && !file.type">{{ file.local ? 'Local file' : 'Existing file' }}</span>
						</p>
					</div>
					<button
						type="button"
						class="grid size-8 shrink-0 place-items-center rounded-md text-muted-fg transition hover:bg-secondary hover:text-canvas-fg disabled:cursor-not-allowed disabled:opacity-50"
						:disabled="disabled || undefined"
						:aria-label="`Remove ${file.name}`"
						@click="removeFile(index)"
					>
						<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
							<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
					</button>
				</li>
			</ul>
		</div>
	</DomField>
</template>
