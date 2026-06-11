<script setup>
import { computed, ref } from 'vue';
import {
	DomButton,
	DomDialog,
	DomListbox,
	DomTagCombobox,
	DomTextInput,
	DomToggle,
	DomToggleButtonGroup,
	DomTooltip,
	DomTreeView,
} from '@getdom/studio/vue';
import NavigationStatusPill from '../components/NavigationStatusPill.vue';
import PreviewMenuItem from '../components/PreviewMenuItem.vue';

const icons = {
	home: 'M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z',
	folder: 'M4 6h6l2 2h8v10H4V6Z',
	file: 'M6 4h8l4 4v12H6V4Zm8 0v5h5',
	chart: 'M5 19V5m0 14h14M9 16v-5m4 5V8m4 8v-7',
	card: 'M4 7h16v10H4V7Zm0 3h16M8 14h3',
	bolt: 'M13 3 5 14h6l-1 7 9-12h-6l1-6Z',
	lock: 'M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6V10Zm6 4v2',
};

const visibilityOptions = [
	{
		label: 'Everyone',
		value: 'everyone',
		description: 'Visible to signed-in users with access to the app shell.',
		count: 'Default',
	},
	{
		label: 'Role gated',
		value: 'role-gated',
		description: 'Visible only when the user matches selected roles or plan rules.',
		count: 'Policy',
	},
	{
		label: 'Admins only',
		value: 'admins',
		description: 'Visible to owners and admin roles for sensitive workspace areas.',
		count: 'Locked',
	},
	{
		label: 'Hidden draft',
		value: 'hidden',
		description: 'Kept in the draft tree but excluded from the published menu.',
		count: 'Draft',
	},
];

const visibilityLabelByValue = Object.fromEntries(visibilityOptions.map((option) => [option.value, option.label]));

const audienceOptions = [
	{ label: 'All users', value: 'all-users', description: 'Default app audience' },
	{ label: 'Workspace admins', value: 'workspace-admins', description: 'Owner and admin roles' },
	{ label: 'Billing managers', value: 'billing-managers', description: 'Can manage invoices and plans' },
	{ label: 'Support agents', value: 'support-agents', description: 'Can view customer tools' },
	{ label: 'Beta testers', value: 'beta-testers', description: 'Feature-flagged preview group' },
	{ label: 'Enterprise plan', value: 'enterprise-plan', description: 'Plan-gated customers' },
];

const previewModeOptions = [
	{ label: 'Desktop', value: 'desktop' },
	{ label: 'Mobile', value: 'mobile' },
	{ label: 'Portal', value: 'portal' },
];

const navItems = ref([
	{
		id: 'overview',
		label: 'Overview',
		url: '/app',
		icon: icons.home,
		visibility: 'everyone',
		visibilityLabel: 'Everyone',
		audience: ['all-users'],
		featureFlag: '',
		requiresAuth: true,
		description: 'Primary landing route after sign in.',
		open: true,
		children: [
			{
				id: 'dashboard',
				label: 'Dashboard',
				url: '/app/dashboard',
				icon: icons.chart,
				visibility: 'everyone',
				visibilityLabel: 'Everyone',
				audience: ['all-users'],
				featureFlag: '',
				requiresAuth: true,
				description: 'Team summary, recent activity, and shortcuts.',
			},
			{
				id: 'reports',
				label: 'Reports',
				url: '/app/reports',
				icon: icons.file,
				visibility: 'role-gated',
				visibilityLabel: 'Role gated',
				audience: ['workspace-admins', 'enterprise-plan'],
				featureFlag: 'reports_v2',
				requiresAuth: true,
				description: 'Saved reports and scheduled exports.',
			},
		],
	},
	{
		id: 'operations',
		label: 'Operations',
		url: '/app/ops',
		icon: icons.folder,
		visibility: 'role-gated',
		visibilityLabel: 'Role gated',
		audience: ['workspace-admins', 'support-agents'],
		featureFlag: '',
		requiresAuth: true,
		description: 'Internal queues and customer workflows.',
		open: true,
		children: [
			{
				id: 'customers',
				label: 'Customers',
				url: '/app/ops/customers',
				icon: icons.file,
				visibility: 'role-gated',
				visibilityLabel: 'Role gated',
				audience: ['support-agents', 'workspace-admins'],
				featureFlag: '',
				requiresAuth: true,
				description: 'Customer records, health, and activity.',
			},
			{
				id: 'automation',
				label: 'Automation',
				url: '/app/ops/automation',
				icon: icons.bolt,
				visibility: 'hidden',
				visibilityLabel: 'Hidden draft',
				audience: ['beta-testers'],
				featureFlag: 'automation_builder',
				requiresAuth: true,
				description: 'Draft workflow builder for beta teams.',
			},
		],
	},
	{
		id: 'billing',
		label: 'Billing',
		url: '/app/billing',
		icon: icons.card,
		visibility: 'admins',
		visibilityLabel: 'Admins only',
		audience: ['workspace-admins', 'billing-managers'],
		featureFlag: '',
		requiresAuth: true,
		description: 'Plans, invoices, payment methods, and usage.',
	},
]);

const selectedItemId = ref('reports');
const previewMode = ref('desktop');
const draftStatus = ref('unsaved');
const publishDialogOpen = ref(false);
const lastPublishedAt = ref('Not published from this draft');
const changedIds = ref(['reports', 'automation']);

const selectedItem = computed(() => findItem(navItems.value, selectedItemId.value) || navItems.value[0]);
const selectedPath = computed(() => itemPath(navItems.value, selectedItemId.value).map((item) => item.label).join(' / '));
const totalItemCount = computed(() => countItems(navItems.value));
const hiddenItemCount = computed(() => flattenItems(navItems.value).filter((item) => item.visibility === 'hidden').length);
const gatedItemCount = computed(() => flattenItems(navItems.value).filter((item) => item.visibility !== 'everyone').length);
const publishPayload = computed(() => ({
	draftId: 'nav_draft_0924',
	status: draftStatus.value,
	selectedItemId: selectedItemId.value,
	previewMode: previewMode.value,
	items: flattenItems(navItems.value).map((item, index) => ({
		id: item.id,
		label: item.label,
		url: item.url,
		visibility: item.visibility,
		audience: item.audience,
		featureFlag: item.featureFlag || null,
		requiresAuth: item.requiresAuth,
		sortOrder: (index + 1) * 10,
	})),
	changedIds: changedIds.value,
}));

function findItem(items, id) {
	for (const item of items) {
		if (item.id === id) return item;
		const child = findItem(item.children || [], id);
		if (child) return child;
	}
	return null;
}

function itemPath(items, id, parents = []) {
	for (const item of items) {
		const nextParents = [...parents, item];
		if (item.id === id) return nextParents;
		const childPath = itemPath(item.children || [], id, nextParents);
		if (childPath.length) return childPath;
	}
	return [];
}

function flattenItems(items) {
	return items.flatMap((item) => [item, ...flattenItems(item.children || [])]);
}

function countItems(items) {
	return flattenItems(items).length;
}

function markChanged(id = selectedItemId.value) {
	if (!changedIds.value.includes(id)) changedIds.value = [...changedIds.value, id];
	draftStatus.value = 'unsaved';
}

function onTreeItemsUpdate(items) {
	navItems.value = syncVisibilityLabels(items);
	markChanged(selectedItemId.value);
}

function syncVisibilityLabels(items) {
	return items.map((item) => ({
		...item,
		visibilityLabel: visibilityLabelByValue[item.visibility] || item.visibility,
		children: item.children ? syncVisibilityLabels(item.children) : undefined,
	}));
}

function updateVisibility(value) {
	selectedItem.value.visibility = value;
	selectedItem.value.visibilityLabel = visibilityLabelByValue[value] || value;
	if (value === 'everyone') selectedItem.value.audience = ['all-users'];
	if (value === 'hidden') selectedItem.value.requiresAuth = true;
	markChanged();
}

function selectItem(id) {
	selectedItemId.value = id;
}

function publishDraft() {
	draftStatus.value = 'published';
	changedIds.value = [];
	lastPublishedAt.value = 'Published just now by Maya Chen';
	publishDialogOpen.value = false;
}

function statusTone(value) {
	if (value === 'everyone') return 'success';
	if (value === 'hidden') return 'warning';
	if (value === 'admins') return 'destructive';
	return 'primary';
}
</script>

<template>
	<div class="w-full overflow-hidden border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div class="min-w-0">
					<p class="text-xs font-semibold uppercase text-muted-fg">Navigation CMS</p>
					<h3 class="mt-2 text-2xl font-semibold">App navigation builder</h3>
					<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
						Edit nested menu structure, route metadata, feature gates, and audience rules before publishing a versioned app menu.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<NavigationStatusPill :tone="draftStatus === 'published' ? 'success' : 'warning'">
						{{ draftStatus === 'published' ? 'Published' : 'Unsaved draft' }}
					</NavigationStatusPill>
					<DomTooltip text="Publish creates a versioned navigation draft that your app shell can fetch at runtime.">
						<DomButton size="sm" @click="publishDialogOpen = true">Review publish</DomButton>
					</DomTooltip>
				</div>
			</div>

			<div class="mt-5 grid gap-3 md:grid-cols-3">
				<div class="border-l-4 border-primary bg-primary/10 px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Menu items</p>
					<p class="mt-1 text-2xl font-semibold">{{ totalItemCount }}</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Drag the tree or select a row to edit metadata.</p>
				</div>
				<div class="border-l-4 border-warning bg-warning/10 px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Gated links</p>
					<p class="mt-1 text-2xl font-semibold">{{ gatedItemCount }}</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">Role, admin, or draft-only routes need policy checks.</p>
				</div>
				<div class="border-l-4 border-success bg-success/10 px-4 py-3">
					<p class="text-xs font-medium text-muted-fg">Publish state</p>
					<p class="mt-1 text-lg font-semibold">{{ changedIds.length }} changed</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">{{ lastPublishedAt }}</p>
				</div>
			</div>
		</header>

		<main class="grid gap-0 xl:grid-cols-[minmax(19rem,0.9fr)_minmax(0,1.35fr)]">
			<section class="border-b border-border p-4 sm:p-5 xl:border-b-0 xl:border-r">
				<div class="flex items-start justify-between gap-3">
					<div>
						<h4 class="font-semibold">Menu hierarchy</h4>
						<p class="mt-1 text-sm leading-6 text-muted-fg">Keyboard navigable tree with nested drag/drop reordering.</p>
					</div>
					<NavigationStatusPill tone="neutral">{{ hiddenItemCount }} hidden</NavigationStatusPill>
				</div>

				<DomTreeView
					v-model="selectedItemId"
					v-model:items="navItems"
					class="mt-4"
					label="App navigation hierarchy"
					:open-values="['overview', 'operations']"
					variant="finder"
					density="comfortable"
					@update:items="onTreeItemsUpdate"
					@select="selectItem($event.value)"
				>
					<template #item="{ item, selected }">
						<span class="flex min-w-0 flex-1 items-center justify-between gap-3">
							<span class="min-w-0">
								<span class="block truncate text-sm font-semibold" :class="selected ? 'text-fg' : 'text-muted-fg'">{{ item.label }}</span>
								<span class="mt-0.5 block truncate text-xs text-muted-fg">{{ item.url }}</span>
							</span>
							<span
								class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
								:class="{
									'bg-success/10 text-success': item.visibility === 'everyone',
									'bg-primary/10 text-primary': item.visibility === 'role-gated',
									'bg-warning/10 text-warning': item.visibility === 'hidden',
									'bg-destructive/10 text-destructive': item.visibility === 'admins'
								}"
							>
								{{ item.visibilityLabel }}
							</span>
						</span>
					</template>
				</DomTreeView>

				<div class="mt-4 border border-dashed border-border bg-secondary/40 p-4 text-sm leading-6 text-muted-fg">
					<p class="font-medium text-fg">Selected path</p>
					<p class="mt-1">{{ selectedPath }}</p>
				</div>
			</section>

			<section class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<div class="border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<p class="text-xs font-semibold uppercase text-muted-fg">Selected item</p>
							<h4 class="mt-1 text-xl font-semibold">{{ selectedItem.label }}</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedItem.description }}</p>
						</div>
						<NavigationStatusPill :tone="statusTone(selectedItem.visibility)">
							{{ selectedItem.visibilityLabel }}
						</NavigationStatusPill>
					</div>

					<div class="mt-5 grid gap-4">
						<div class="grid gap-4 md:grid-cols-2">
							<DomTextInput
								v-model="selectedItem.label"
								label="Menu label"
								placeholder="Reports"
								@update:model-value="markChanged()"
							/>
							<DomTextInput
								v-model="selectedItem.url"
								label="Route path"
								placeholder="/app/reports"
								@update:model-value="markChanged()"
							/>
						</div>

						<DomTextInput
							v-model="selectedItem.description"
							label="Internal description"
							placeholder="Explain where this item sends people"
							@update:model-value="markChanged()"
						/>

						<DomListbox
							:model-value="selectedItem.visibility"
							label="Visibility rule"
							:options="visibilityOptions"
							@update:model-value="updateVisibility"
						>
							<template #option="{ option }">
								<span class="flex items-start justify-between gap-3">
									<span>
										<span class="block font-semibold">{{ option.label }}</span>
										<span class="mt-0.5 block text-xs leading-5 opacity-80">{{ option.description }}</span>
									</span>
									<span class="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-semibold">{{ option.count }}</span>
								</span>
							</template>
						</DomListbox>

						<DomTagCombobox
							v-model="selectedItem.audience"
							label="Audience tags"
							:options="audienceOptions"
							placeholder="Add roles, plans, or cohorts..."
							clearable
							@change="markChanged()"
						>
							<template #item="{ item }">
								<span class="block">
									<span class="block text-sm font-semibold">{{ item.label }}</span>
									<span class="block text-xs text-muted-fg">{{ item.description }}</span>
								</span>
							</template>
						</DomTagCombobox>

						<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
							<DomTextInput
								v-model="selectedItem.featureFlag"
								label="Feature flag key"
								placeholder="reports_v2"
								@update:model-value="markChanged()"
							/>
							<DomToggle
								v-model="selectedItem.requiresAuth"
								label="Requires sign in"
								@update:model-value="markChanged()"
							/>
						</div>
					</div>

					<div class="mt-5 grid gap-3 rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-6">
						<div class="flex items-center justify-between gap-3">
							<p class="font-semibold">Publish readiness</p>
							<NavigationStatusPill :tone="selectedItem.url.startsWith('/') ? 'success' : 'warning'">
								{{ selectedItem.url.startsWith('/') ? 'Route looks valid' : 'Check route' }}
							</NavigationStatusPill>
						</div>
						<ul class="grid gap-2 text-muted-fg">
							<li class="flex items-center gap-2">
								<span class="size-2 rounded-full" :class="selectedItem.label ? 'bg-success' : 'bg-warning'"></span>
								Label is ready for navigation display.
							</li>
							<li class="flex items-center gap-2">
								<span class="size-2 rounded-full" :class="selectedItem.visibility === 'everyone' || selectedItem.audience.length ? 'bg-success' : 'bg-warning'"></span>
								Audience rule has at least one selected cohort.
							</li>
							<li class="flex items-center gap-2">
								<span class="size-2 rounded-full" :class="selectedItem.requiresAuth ? 'bg-success' : 'bg-warning'"></span>
								Protected routes should still enforce server authorization.
							</li>
						</ul>
					</div>
				</div>

				<aside class="skin-raised p-4 sm:p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h4 class="font-semibold">Live preview</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Switch viewport targets before publishing.</p>
						</div>
					</div>

					<DomToggleButtonGroup
						v-model="previewMode"
						class="mt-4"
						label="Preview mode"
						:options="previewModeOptions"
						size="sm"
						@update:model-value="markChanged()"
					/>

					<div
						class="mt-4 overflow-hidden border border-border bg-background shadow-lg"
						:class="previewMode === 'mobile' ? 'mx-auto max-w-[18rem] rounded-lg p-2' : 'rounded-lg'"
					>
						<div class="border-b border-border px-4 py-3">
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-sm font-semibold">Acme Workspace</p>
									<p class="text-xs text-muted-fg">{{ previewMode }} menu preview</p>
								</div>
								<span class="size-2 rounded-full bg-success" aria-hidden="true"></span>
							</div>
						</div>
						<nav class="grid gap-1 p-2" aria-label="Preview navigation">
							<PreviewMenuItem
								v-for="item in navItems"
								:key="item.id"
								:item="item"
								:selected-id="selectedItemId"
								@select="selectItem"
							/>
						</nav>
					</div>

					<div class="mt-4 rounded-lg border border-border bg-background p-4">
						<p class="text-sm font-semibold">Draft payload</p>
						<pre class="mt-3 max-h-64 overflow-auto rounded-md bg-secondary p-3 text-xs leading-5 text-muted-fg">{{ JSON.stringify(publishPayload, null, 2) }}</pre>
					</div>
				</aside>
			</section>
		</main>

		<DomDialog
			v-model="publishDialogOpen"
			title="Publish navigation draft?"
			description="Create a versioned menu that your app shell can fetch and cache."
		>
			<div class="space-y-3 text-sm leading-6 text-muted-fg">
				<p>
					This draft contains <strong class="text-fg">{{ changedIds.length }}</strong> changed item{{ changedIds.length === 1 ? '' : 's' }} across
					<strong class="text-fg">{{ totalItemCount }}</strong> navigation records.
				</p>
				<div class="rounded-lg border border-border bg-secondary/50 p-3">
					<p class="font-semibold text-fg">Backend checks to run</p>
					<ul class="mt-2 list-disc space-y-1 pl-5">
						<li>Validate every route and parent ID.</li>
						<li>Confirm feature flags exist in the current workspace.</li>
						<li>Recompute role visibility before writing the published version.</li>
					</ul>
				</div>
			</div>
			<template #footer>
				<DomButton variant="secondary" size="sm" @click="publishDialogOpen = false">Keep editing</DomButton>
				<DomButton size="sm" @click="publishDraft">Publish version</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
