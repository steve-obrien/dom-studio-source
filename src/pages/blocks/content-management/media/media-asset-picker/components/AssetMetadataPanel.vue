<script setup>
import { reactive, watch } from 'vue';
import {
	DomAlert,
	DomButton,
	DomSelect,
	DomStatusPill,
	DomTagCombobox,
	DomTextareaInput,
	DomTextInput,
} from '@getdom/studio/vue';

const props = defineProps({
	asset: {
		type: Object,
		default: null,
	},
	busy: {
		type: Boolean,
		default: false,
	},
	feedback: {
		type: Object,
		default: null,
	},
});

const emit = defineEmits(['save', 'preview', 'request-archive', 'restore', 'floating-interaction']);

const licenseOptions = [
	{ value: 'Company owned', label: 'Company owned', description: 'Created by the organization with reusable rights.' },
	{ value: 'Customer approved', label: 'Customer approved', description: 'Consent is recorded for this publishing context.' },
	{ value: 'Partner approved', label: 'Partner approved', description: 'Partner terms cover the intended placement.' },
	{ value: 'Licensed through 2027', label: 'Licensed through 2027', description: 'External rights are active through the stated term.' },
	{ value: 'Pending review', label: 'Pending review', description: 'Blocks insertion until rights are confirmed.' },
];

const draft = reactive({
	title: '',
	alt: '',
	license: 'Pending review',
	tags: [],
});

watch(() => props.asset, syncDraft, { immediate: true });

/**
 * Copies server-backed metadata into the editable inspector draft.
 *
 * @param {Record<string, unknown>|null} asset Active media asset.
 */
function syncDraft(asset) {
	draft.title = String(asset?.title || '');
	draft.alt = String(asset?.alt || '');
	draft.license = String(asset?.license || 'Pending review');
	draft.tags = Array.isArray(asset?.tags) ? [...asset.tags] : [];
}

/**
 * Emits the complete editable metadata contract to the parent workspace.
 */
function saveMetadata() {
	if (!props.asset) return;
	emit('save', {
		title: draft.title,
		alt: draft.alt,
		license: draft.license,
		tags: [...draft.tags],
		revision: props.asset.revision,
	});
}

/**
 * Applies a teleported license choice and asks a containing drawer to remain open.
 *
 * @param {string} value Selected license value.
 */
function updateLicense(value) {
	draft.license = String(value || 'Pending review');
	window.setTimeout(notifyFloatingInteraction, 0);
}

/**
 * Notifies the parent after the floating select has completed its click cycle.
 */
function notifyFloatingInteraction() {
	emit('floating-interaction');
}

/**
 * Maps server publishing state to a semantic DOM Studio status tone.
 *
 * @param {string} status Asset status.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	if (status === 'Approved') return 'success';
	if (status === 'Archived') return 'neutral';
	return 'warning';
}

/**
 * Formats file bytes into a concise binary-size label.
 *
 * @param {number} bytes File size in bytes.
 * @returns {string} Human-readable file size.
 */
function formatBytes(bytes) {
	const value = Number(bytes || 0);
	if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(value / 1024))} KB`;
}

/**
 * Formats image geometry, video duration, or document type for the inspector.
 *
 * @param {Record<string, unknown>} asset Media asset.
 * @returns {string} Technical metadata label.
 */
function technicalLabel(asset) {
	if (asset.width && asset.height) return `${asset.width} × ${asset.height}`;
	if (asset.duration) return `${asset.duration} seconds`;
	return String(asset.mimeType || 'Document');
}

/**
 * Formats an ISO timestamp as a compact local date and time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Localized timestamp.
 */
function formatWhen(value) {
	if (!value) return 'Not recorded';
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}
</script>

<template>
	<div v-if="asset" class="flex min-h-0 flex-1 flex-col bg-canvas text-canvas-fg">
		<div class="min-h-0 flex-1 overflow-y-auto">
			<button
				type="button"
				class="group relative block aspect-[16/10] w-full overflow-hidden bg-secondary text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
				:aria-label="`Open a larger preview of ${asset.title}`"
				@click="emit('preview', asset)"
			>
				<img :src="asset.thumbnailUrl" alt="" class="size-full object-cover transition duration-300 group-hover:scale-[1.02]" />
				<div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-12 text-white">
					<span class="truncate text-sm font-semibold">{{ asset.name }}</span>
					<span class="shrink-0 text-xs text-white/75">Open preview</span>
				</div>
			</button>

			<div class="space-y-5 p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Inspector</p>
						<h3 class="mt-1 truncate text-base font-semibold">{{ asset.title }}</h3>
					</div>
					<DomStatusPill :tone="statusTone(asset.status)" size="sm">{{ asset.status }}</DomStatusPill>
				</div>

				<DomAlert
					v-if="feedback"
					:variant="feedback.tone === 'danger' ? 'outline' : 'soft'"
					:tone="feedback.tone"
					:title="feedback.title"
					:description="feedback.description"
				/>

				<DomAlert
					v-if="asset.status === 'Review'"
					tone="warning"
					variant="outline"
					title="Publishing check"
					:description="asset.reviewNote"
				/>

				<div class="space-y-4">
					<DomTextInput v-model="draft.title" label="Asset title" />
					<DomTextareaInput
						v-model="draft.alt"
						label="Alt text"
						rows="3"
						:description="asset.type === 'image' ? 'Describe the meaningful content. Required before insertion.' : 'Describe the asset for search and accessibility context.'"
					/>
					<DomSelect
						:model-value="draft.license"
						label="License"
						:options="licenseOptions"
						width="w-[min(calc(100vw-2rem),22rem)]"
						@update:model-value="updateLicense"
					>
						<template #option="{ option }">
							<span class="block">
								<span class="block font-semibold">{{ option.label }}</span>
								<span class="mt-0.5 block text-xs opacity-75">{{ option.description }}</span>
							</span>
						</template>
					</DomSelect>
					<DomTagCombobox
						v-model="draft.tags"
						label="Search tags"
						placeholder="Add a tag"
						:allow-custom="true"
						:options="['campaign', 'commerce', 'dashboard', 'launch', 'onboarding', 'product', 'social']"
					/>
				</div>

				<dl class="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4 text-sm">
					<div>
						<dt class="text-xs text-muted-fg">File size</dt>
						<dd class="mt-1 font-medium">{{ formatBytes(asset.size) }}</dd>
					</div>
					<div>
						<dt class="text-xs text-muted-fg">Dimensions</dt>
						<dd class="mt-1 font-medium">{{ technicalLabel(asset) }}</dd>
					</div>
					<div>
						<dt class="text-xs text-muted-fg">Owner</dt>
						<dd class="mt-1 font-medium">{{ asset.owner }}</dd>
					</div>
					<div>
						<dt class="text-xs text-muted-fg">Usage</dt>
						<dd class="mt-1 font-medium">{{ asset.usage }} placements</dd>
					</div>
				</dl>

				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recent activity</p>
					<ul class="mt-3 space-y-3">
						<li v-for="item in asset.activity.slice(0, 3)" :key="item.id" class="grid grid-cols-[0.5rem_minmax(0,1fr)] gap-2 text-sm">
							<span class="mt-1.5 size-2 rounded-full bg-primary"></span>
							<span class="min-w-0">
								<span class="block font-medium">{{ item.label }}</span>
								<span class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ item.detail }} · {{ formatWhen(item.createdAt) }}</span>
							</span>
						</li>
					</ul>
				</div>
			</div>
		</div>

		<footer class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-canvas px-4 py-3">
			<DomButton
				v-if="asset.status === 'Archived'"
				variant="secondary"
				:loading="busy"
				@click="emit('restore', asset)"
			>
				Restore
			</DomButton>
			<DomButton v-else variant="danger" :disabled="busy" @click="emit('request-archive', asset)">Archive</DomButton>
			<DomButton v-if="asset.status !== 'Archived'" :loading="busy" @click="saveMetadata">Save metadata</DomButton>
		</footer>
	</div>

	<div v-else class="grid min-h-80 place-items-center p-6 text-center">
		<div class="max-w-56">
			<p class="text-sm font-semibold text-canvas-fg">Select an asset</p>
			<p class="mt-2 text-sm leading-6 text-muted-fg">Its publishing metadata, usage, and review history will appear here.</p>
		</div>
	</div>
</template>
