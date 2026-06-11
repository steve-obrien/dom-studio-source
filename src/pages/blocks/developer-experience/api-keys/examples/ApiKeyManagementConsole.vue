<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomCard, DomNativeSelect, DomTabs, DomToggle } from '@getdom/studio/vue';

const environmentOptions = [
	{ label: 'Production', value: 'Production' },
	{ label: 'Staging', value: 'Staging' },
	{ label: 'Development', value: 'Development' },
];

const tabs = [
	{ key: 'scopes', label: 'Scopes' },
	{ key: 'activity', label: 'Activity' },
];

const scopeGroups = [
	{
		title: 'Core data',
		scopes: [
			{ key: 'read:customers', label: 'Read customers', description: 'List and inspect customer profiles.' },
			{ key: 'write:customers', label: 'Write customers', description: 'Create and update customer records.' },
		],
	},
	{
		title: 'Commerce',
		scopes: [
			{ key: 'read:billing', label: 'Read billing', description: 'View invoices, plans, and payment state.' },
			{ key: 'write:checkout', label: 'Write checkout', description: 'Create checkout sessions and payment links.' },
		],
	},
	{
		title: 'Operations',
		scopes: [
			{ key: 'read:events', label: 'Read events', description: 'Inspect delivery logs and webhook attempts.' },
			{ key: 'admin:keys', label: 'Manage keys', description: 'Create, rotate, and revoke API credentials.' },
		],
	},
];

const apiKeys = [
	{
		id: 'key_live_checkout',
		name: 'Production checkout',
		prefix: 'dom_live_9f2a',
		environment: 'Production',
		status: 'Active',
		createdAt: 'May 18, 2026',
		lastUsedAt: '2 minutes ago',
		expiresAt: 'Aug 18, 2026',
		owner: 'Maya Chen',
		requests: 48200,
		limit: 75000,
		errorRate: '0.04%',
		origins: ['https://app.northstar.example', 'https://checkout.northstar.example'],
		scopes: ['read:customers', 'write:checkout', 'read:billing', 'read:events'],
		events: [
			{ label: 'Checkout session created', actor: 'Production API', time: '2 minutes ago' },
			{ label: 'Allowed origin added', actor: 'Maya Chen', time: 'Today 09:42' },
			{ label: 'Key rotated', actor: 'Security bot', time: 'May 18, 2026' },
		],
	},
	{
		id: 'key_stage_integrations',
		name: 'Staging integrations',
		prefix: 'dom_test_a81c',
		environment: 'Staging',
		status: 'Active',
		createdAt: 'Jun 02, 2026',
		lastUsedAt: '31 minutes ago',
		expiresAt: 'Sep 02, 2026',
		owner: 'Jon Bell',
		requests: 11840,
		limit: 25000,
		errorRate: '0.22%',
		origins: ['https://staging.northstar.example'],
		scopes: ['read:customers', 'write:customers', 'read:events'],
		events: [
			{ label: 'Webhook replay requested', actor: 'Jon Bell', time: '31 minutes ago' },
			{ label: 'Scope updated', actor: 'Maya Chen', time: 'Yesterday' },
			{ label: 'Key created', actor: 'Jon Bell', time: 'Jun 02, 2026' },
		],
	},
	{
		id: 'key_dev_cli',
		name: 'Local CLI tooling',
		prefix: 'dom_dev_44bc',
		environment: 'Development',
		status: 'Review',
		createdAt: 'Apr 26, 2026',
		lastUsedAt: '6 days ago',
		expiresAt: 'Jun 26, 2026',
		owner: 'Ari Grant',
		requests: 2400,
		limit: 10000,
		errorRate: '1.18%',
		origins: ['http://localhost:5173'],
		scopes: ['read:customers', 'read:events'],
		events: [
			{ label: 'Error spike detected', actor: 'Monitoring', time: '6 days ago' },
			{ label: 'Expiration reminder sent', actor: 'Security bot', time: 'Jun 01, 2026' },
			{ label: 'Key created', actor: 'Ari Grant', time: 'Apr 26, 2026' },
		],
	},
];

const selectedEnvironment = ref('Production');
const selectedKeyId = ref(apiKeys[0].id);
const activeTab = ref('scopes');
const newKeyName = ref('Mobile app launch');
const newKeyEnvironment = ref('Production');
const newKeySecret = ref('dom_live_sk_2YwP9uQ8rV4mH6kL1sN7xT3c');
const showSecret = ref(false);
const selectedScopes = ref([...apiKeys[0].scopes]);

const filteredKeys = computed(() => apiKeys.filter((key) => key.environment === selectedEnvironment.value));
const selectedKey = computed(() => apiKeys.find((key) => key.id === selectedKeyId.value) || filteredKeys.value[0] || apiKeys[0]);
const usagePercent = computed(() => Math.min(100, Math.round((selectedKey.value.requests / selectedKey.value.limit) * 100)));
const visibleSecret = computed(() => showSecret.value ? newKeySecret.value : newKeySecret.value.replace(/.(?=.{4})/g, '*'));
const selectedScopeCount = computed(() => selectedScopes.value.length);

watch(selectedEnvironment, () => {
	const firstKey = filteredKeys.value[0];
	if (firstKey) selectKey(firstKey);
});

function selectKey(key) {
	selectedKeyId.value = key.id;
	selectedScopes.value = [...key.scopes];
}

function toggleScope(scopeKey) {
	selectedScopes.value = selectedScopes.value.includes(scopeKey)
		? selectedScopes.value.filter((key) => key !== scopeKey)
		: [...selectedScopes.value, scopeKey];
}

function statusClasses(status) {
	return {
		Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Review: 'bg-warning/15 text-warning',
		Revoked: 'bg-destructive/15 text-destructive',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-border skin-raised px-4 py-4 sm:px-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Developer console</p>
				<h3 class="mt-1 text-xl font-semibold tracking-tight">API keys</h3>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<DomNativeSelect v-model="selectedEnvironment" :options="environmentOptions" class="w-40" />
				<DomButton size="sm">
					<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					</svg>
					New key
				</DomButton>
			</div>
		</header>

		<div class="grid min-h-[44rem] lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
			<aside class="border-b border-border skin-raised p-3 lg:border-b-0 lg:border-r">
				<div class="mb-3 grid grid-cols-3 gap-2 text-center">
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">12</p>
						<p class="text-[11px] text-muted-fg">Active</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">3</p>
						<p class="text-[11px] text-muted-fg">Expiring</p>
					</div>
					<div class="rounded-lg border border-border bg-background p-2">
						<p class="text-lg font-semibold">99.9%</p>
						<p class="text-[11px] text-muted-fg">Uptime</p>
					</div>
				</div>

				<div class="space-y-2">
					<button
						v-for="key in filteredKeys"
						:key="key.id"
						type="button"
						class="w-full rounded-lg border p-3 text-left transition hover:border-primary/50"
						:class="key.id === selectedKey.id ? 'border-primary/60 bg-primary/5' : 'border-border bg-background'"
						@click="selectKey(key)"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ key.name }}</p>
								<p class="mt-1 font-mono text-xs text-muted-fg">{{ key.prefix }}****</p>
							</div>
							<span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusClasses(key.status)">
								{{ key.status }}
							</span>
						</div>
						<div class="mt-3 flex items-center justify-between text-xs text-muted-fg">
							<span>{{ key.owner }}</span>
							<span>{{ key.lastUsedAt }}</span>
						</div>
					</button>
				</div>
			</aside>

			<main class="space-y-4 p-4 sm:p-5">
				<section class="grid gap-3 md:grid-cols-3">
					<DomCard class="p-4">
						<p class="text-xs font-medium text-muted-fg">Selected key</p>
						<p class="mt-2 truncate text-lg font-semibold">{{ selectedKey.name }}</p>
						<p class="mt-1 font-mono text-xs text-muted-fg">{{ selectedKey.prefix }}************</p>
					</DomCard>
					<DomCard class="p-4">
						<p class="text-xs font-medium text-muted-fg">Monthly usage</p>
						<p class="mt-2 text-lg font-semibold">{{ selectedKey.requests.toLocaleString() }} / {{ selectedKey.limit.toLocaleString() }}</p>
						<div class="mt-3 h-2 rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary" :style="{ width: `${usagePercent}%` }" />
						</div>
					</DomCard>
					<DomCard class="p-4">
						<p class="text-xs font-medium text-muted-fg">Health</p>
						<p class="mt-2 text-lg font-semibold">{{ selectedKey.errorRate }} errors</p>
						<p class="mt-1 text-xs text-muted-fg">Expires {{ selectedKey.expiresAt }}</p>
					</DomCard>
				</section>

				<section class="rounded-xl border border-border bg-background">
					<div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
						<div>
							<h4 class="font-semibold">Credential details</h4>
							<p class="mt-1 text-sm text-muted-fg">Review permissions, allowed origins, and recent changes before shipping.</p>
						</div>
						<div class="flex gap-2">
							<DomButton variant="ghost" size="sm">Rotate</DomButton>
							<DomButton variant="ghost" size="sm">Revoke</DomButton>
						</div>
					</div>

					<div class="border-b border-border px-4 pt-3">
						<DomTabs v-model="activeTab" :tabs="tabs" />
					</div>

					<div v-if="activeTab === 'scopes'" class="grid gap-3 p-4 md:grid-cols-3">
						<div v-for="group in scopeGroups" :key="group.title" class="rounded-lg border border-border skin-raised p-3">
							<h5 class="text-sm font-semibold">{{ group.title }}</h5>
							<div class="mt-3 space-y-3">
								<label v-for="scope in group.scopes" :key="scope.key" class="flex gap-3">
									<input
										type="checkbox"
										class="mt-1 size-4 rounded border-border text-primary"
										:checked="selectedScopes.includes(scope.key)"
										@change="toggleScope(scope.key)"
									>
									<span>
										<span class="block text-sm font-medium">{{ scope.label }}</span>
										<span class="block text-xs leading-5 text-muted-fg">{{ scope.description }}</span>
									</span>
								</label>
							</div>
						</div>
					</div>

					<div v-else class="divide-y divide-border p-4">
						<div v-for="event in selectedKey.events" :key="`${event.label}-${event.time}`" class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
							<div>
								<p class="text-sm font-medium">{{ event.label }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ event.actor }}</p>
							</div>
							<p class="shrink-0 text-xs text-muted-fg">{{ event.time }}</p>
						</div>
					</div>
				</section>

				<section class="grid gap-3 md:grid-cols-2">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h4 class="font-semibold">Allowed origins</h4>
						<div class="mt-3 space-y-2">
							<div v-for="origin in selectedKey.origins" :key="origin" class="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
								<code class="truncate text-xs">{{ origin }}</code>
								<span class="text-xs font-medium text-emerald-700 dark:text-emerald-300">Allowed</span>
							</div>
						</div>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h4 class="font-semibold">Rotation checklist</h4>
						<div class="mt-3 space-y-2 text-sm text-muted-fg">
							<p class="flex items-center gap-2"><span class="size-2 rounded-full bg-emerald-500" /> Create replacement key</p>
							<p class="flex items-center gap-2"><span class="size-2 rounded-full bg-primary" /> Update production secrets</p>
							<p class="flex items-center gap-2"><span class="size-2 rounded-full bg-muted-fg" /> Revoke old key after traffic stops</p>
						</div>
					</div>
				</section>
			</main>

			<aside class="border-t border-border skin-raised p-4 lg:border-l lg:border-t-0">
				<div class="rounded-xl border border-border bg-background p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<h4 class="font-semibold">Create key</h4>
							<p class="mt-1 text-xs text-muted-fg">{{ selectedScopeCount }} scopes selected</p>
						</div>
						<DomToggle v-model="showSecret" aria-label="Reveal generated secret" />
					</div>

					<label class="mt-4 block text-sm font-medium">
						Key name
						<input v-model="newKeyName" class="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" type="text">
					</label>

					<label class="mt-4 block text-sm font-medium">
						Environment
						<DomNativeSelect v-model="newKeyEnvironment" :options="environmentOptions" class="mt-2 w-full" />
					</label>

					<div class="mt-4 rounded-lg border border-dashed border-border bg-secondary/60 p-3">
						<p class="text-xs font-medium text-muted-fg">Generated secret</p>
						<p class="mt-2 break-all font-mono text-sm">{{ visibleSecret }}</p>
					</div>

					<div class="mt-4 grid grid-cols-2 gap-2">
						<DomButton variant="ghost" size="sm">Copy</DomButton>
						<DomButton size="sm">Create</DomButton>
					</div>
				</div>

				<div class="mt-4 rounded-xl border border-border bg-background p-4">
					<h4 class="font-semibold">Policy summary</h4>
					<div class="mt-3 space-y-3 text-sm">
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Max lifetime</span>
							<span class="font-medium">90 days</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">IP allowlist</span>
							<span class="font-medium">Required</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-fg">Audit retention</span>
							<span class="font-medium">1 year</span>
						</div>
					</div>
				</div>
			</aside>
		</div>
	</div>
</template>
