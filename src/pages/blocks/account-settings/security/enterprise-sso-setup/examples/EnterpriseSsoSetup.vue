<script setup>
import { computed, ref } from 'vue';
import {
	DomAccordion,
	DomBadge,
	DomButton,
	DomCodeInput,
	DomDialog,
	DomRadioGroup,
	DomStatusPill,
	DomTagCombobox,
	DomTextInput,
} from '../../../../../lib/vue';
import MappingRow from '../components/MappingRow.vue';
import SetupStep from '../components/SetupStep.vue';

const providers = [
	{
		label: 'SAML 2.0',
		value: 'saml',
		description: 'Best for Okta, Entra ID, OneLogin, Google Workspace, and most enterprise IdPs.',
		metadata: 'XML metadata',
		status: 'Recommended',
	},
	{
		label: 'OpenID Connect',
		value: 'oidc',
		description: 'Use when your IdP supports client credentials, discovery URLs, and modern OAuth policy.',
		metadata: 'Issuer URL',
		status: 'Advanced',
	},
];

const domainOptions = [
	{ label: 'northstar.example', value: 'northstar.example', description: 'Verified by DNS TXT record', status: 'verified' },
	{ label: 'northstar-analytics.example', value: 'northstar-analytics.example', description: 'DNS record detected, waiting for propagation', status: 'pending' },
	{ label: 'contractors.northstar.example', value: 'contractors.northstar.example', description: 'Eligible for optional contractor access', status: 'available' },
	{ label: 'northstar.io', value: 'northstar.io', description: 'Owned by another workspace', status: 'blocked' },
];

const groupOptions = [
	{ label: 'Okta - Product admins', value: 'okta-product-admins', description: '42 people with administrator access', status: 'synced' },
	{ label: 'Okta - Analysts', value: 'okta-analysts', description: '188 people mapped to member seats', status: 'synced' },
	{ label: 'Okta - Finance reviewers', value: 'okta-finance-reviewers', description: '19 people need app-role review', status: 'review' },
	{ label: 'Okta - Contractors', value: 'okta-contractors', description: '71 people excluded until domain policy is final', status: 'blocked' },
];

const mappingRows = [
	{ source: 'Okta - Product admins', target: 'Workspace admin', count: '42 users', status: 'synced' },
	{ source: 'Okta - Analysts', target: 'Member + viewer seat', count: '188 users', status: 'synced' },
	{ source: 'Okta - Finance reviewers', target: 'Billing reviewer', count: '19 users', status: 'review' },
];

const checklistItems = [
	{
		title: 'Preserve emergency administrator access',
		content: 'Keep at least two break-glass admins outside forced SSO until the first successful production login and support handoff are confirmed.',
	},
	{
		title: 'Notify affected users before forced login',
		content: 'Send a preview email with the activation date, approved domains, recovery contact, and what changes at the next sign-in.',
	},
	{
		title: 'Keep password fallback time-boxed',
		content: 'Allow fallback for a short migration window, then require SSO for verified company domains after the customer confirms adoption.',
	},
];

const provider = ref('saml');
const domains = ref(['northstar.example', 'northstar-analytics.example']);
const groups = ref(['okta-product-admins', 'okta-analysts', 'okta-finance-reviewers']);
const entityId = ref('http://www.okta.com/exk2d9sso');
const ssoUrl = ref('https://northstar.okta.com/app/dom-studio/sso/saml');
const metadataXml = ref(`<EntityDescriptor entityID="http://www.okta.com/exk2d9sso">
	<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
		<SingleSignOnService Binding="HTTP-Redirect" Location="https://northstar.okta.com/app/dom-studio/sso/saml" />
	</IDPSSODescriptor>
</EntityDescriptor>`);
const testDialogOpen = ref(false);
const testState = ref('ready');

const activeProvider = computed(() => providers.find((item) => item.value === provider.value) || providers[0]);
const verifiedDomainCount = computed(() => domains.value.filter((domain) => domainStatus(domain) === 'verified').length);
const selectedReviewGroups = computed(() => groups.value.filter((group) => groupStatus(group) === 'review').length);
const selectedBlockedGroups = computed(() => groups.value.filter((group) => groupStatus(group) === 'blocked').length);
const completionPercent = computed(() => {
	let score = 22;
	if (provider.value) score += 18;
	if (verifiedDomainCount.value) score += 20;
	if (entityId.value && ssoUrl.value) score += 18;
	if (groups.value.length && !selectedBlockedGroups.value) score += 14;
	if (testState.value === 'passed') score += 8;
	return Math.min(score, 100);
});
const canTest = computed(() => Boolean(provider.value && verifiedDomainCount.value && entityId.value && ssoUrl.value && metadataXml.value));
const setupStatus = computed(() => {
	if (testState.value === 'passed') return { tone: 'success', label: 'Test passed' };
	if (canTest.value) return { tone: 'warning', label: 'Ready to test' };
	return { tone: 'neutral', label: 'Draft setup' };
});
const serviceCallbackLabel = computed(() => provider.value === 'saml' ? 'ACS URL' : 'Redirect URI');
const serviceCallbackUrl = computed(() => (
	provider.value === 'saml'
		? 'https://app.example.com/sso/saml/acs/northstar'
		: 'https://app.example.com/sso/oidc/callback/northstar'
));
const entityLabel = computed(() => provider.value === 'saml' ? 'IdP entity ID' : 'Issuer URL');
const endpointLabel = computed(() => provider.value === 'saml' ? 'Single sign-on URL' : 'Authorization endpoint');
const metadataLabel = computed(() => provider.value === 'saml' ? 'Metadata XML' : 'Discovery document');
const metadataDescription = computed(() => (
	provider.value === 'saml'
		? 'Paste signed IdP metadata. Store the certificate fingerprint and expiration on the server.'
		: 'Paste the discovery response or issuer metadata. Store supported scopes, claims, and key rotation details on the server.'
));

function domainStatus(value) {
	return domainOptions.find((option) => option.value === value)?.status || 'custom';
}

function groupStatus(value) {
	return groupOptions.find((option) => option.value === value)?.status || 'custom';
}

function statusTone(status) {
	return {
		verified: 'success',
		pending: 'warning',
		available: 'neutral',
		blocked: 'danger',
		synced: 'success',
		review: 'warning',
		custom: 'info',
	}[status] || 'neutral';
}

function testConnection() {
	if (!canTest.value) return;
	testState.value = 'passed';
	testDialogOpen.value = true;
}
</script>

<template>
	<section class="min-h-screen bg-canvas p-4 text-canvas-fg sm:p-6 lg:p-8" data-testid="enterprise-sso-setup-block">
		<div class="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
			<aside class="lg:sticky lg:top-6 lg:self-start">
				<div class="space-y-5 rounded-3xl border border-border skin-card p-5">
					<div>
						<div class="flex items-center gap-2">
							<DomStatusPill :tone="setupStatus.tone" :label="setupStatus.label" />
							<DomBadge tone="primary" variant="outline">Enterprise</DomBadge>
						</div>
						<h1 class="mt-4 text-2xl font-bold tracking-tight text-canvas-fg">Enterprise SSO setup</h1>
						<p class="mt-2 text-sm leading-6 text-muted-fg">
							Configure secure login for verified company domains, map IdP groups, and test rollout safety before forcing access.
						</p>
					</div>

					<div>
						<div class="flex items-center justify-between text-xs font-semibold uppercase text-muted-fg">
							<span>Setup readiness</span>
							<span>{{ completionPercent }}%</span>
						</div>
						<div class="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
							<div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${completionPercent}%` }"></div>
						</div>
					</div>

					<nav aria-label="SSO setup progress" class="relative">
						<div class="absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-border" aria-hidden="true"></div>
						<div class="relative space-y-1">
							<SetupStep number="1" title="Choose protocol" description="Select the IdP connection type." status="complete" />
							<SetupStep number="2" title="Verify domains" description="Confirm which email domains must use SSO." :status="verifiedDomainCount ? 'complete' : 'current'" />
							<SetupStep number="3" title="Exchange metadata" description="Paste IdP metadata and copy app callback values." :status="entityId && ssoUrl ? 'complete' : 'current'" />
							<SetupStep number="4" title="Map groups" description="Assign IdP groups to workspace roles." :status="groups.length ? 'complete' : 'pending'" />
							<SetupStep number="5" title="Test rollout" description="Run a safe assertion before activation." :status="testState === 'passed' ? 'complete' : 'pending'" />
						</div>
					</nav>
				</div>
			</aside>

			<div class="space-y-5">
				<section class="rounded-3xl border border-border skin-popover p-4 sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Connection</p>
							<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Identity provider</h2>
						</div>
						<DomBadge tone="success" variant="outline">{{ serviceCallbackLabel }} generated</DomBadge>
					</div>

					<DomRadioGroup
						v-model="provider"
						label="Protocol"
						description="Choose the protocol your customer's identity provider expects."
						:options="providers"
						class="mt-5"
					>
						<template #option="{ option }">
							<span class="flex min-w-0 flex-1 flex-col gap-1">
								<span class="flex min-w-0 flex-wrap items-center gap-2">
									<span class="font-semibold">{{ option.label }}</span>
									<DomBadge :tone="option.value === 'saml' ? 'primary' : 'neutral'" size="sm" variant="outline">{{ option.status }}</DomBadge>
								</span>
								<span class="text-xs leading-5 text-muted-fg">{{ option.description }}</span>
							</span>
						</template>
					</DomRadioGroup>
				</section>

				<section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
					<div class="rounded-3xl border border-border skin-card p-4 sm:p-5">
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase text-muted-fg">Domains</p>
								<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Company login domains</h2>
								<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
									Users with these email domains will be routed through {{ activeProvider.label }} after activation.
								</p>
							</div>
							<DomStatusPill :tone="verifiedDomainCount ? 'success' : 'warning'" :label="`${verifiedDomainCount} verified`" />
						</div>

						<DomTagCombobox
							v-model="domains"
							label="Domains"
							description="Add verified company domains or start a DNS ownership check for pending domains."
							:options="domainOptions"
							allow-custom
							clearable
							class="mt-5"
						>
							<template #item="{ item }">
								<span class="flex min-w-0 items-center justify-between gap-3">
									<span class="min-w-0">
										<span class="block truncate text-sm font-semibold">{{ item.label }}</span>
										<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
									</span>
									<DomBadge :tone="statusTone(item.status)" size="sm" variant="outline">{{ item.status }}</DomBadge>
								</span>
							</template>
							<template #tag="{ item, label, remove }">
								<span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-fg ring-1 ring-border">
									<span class="size-1.5 rounded-full" :class="statusTone(item.status) === 'success' ? 'bg-success' : statusTone(item.status) === 'warning' ? 'bg-warning' : 'bg-muted-fg'"></span>
									<span class="truncate">{{ label }}</span>
									<button
										type="button"
										class="-mr-1 grid size-4 place-items-center rounded-full text-muted-fg hover:bg-canvas hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
										:aria-label="`Remove ${label}`"
										@click.stop="remove"
									>
										<svg viewBox="0 0 16 16" class="size-3" fill="none" aria-hidden="true">
											<path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
										</svg>
									</button>
								</span>
							</template>
						</DomTagCombobox>
					</div>

					<div class="rounded-3xl border border-border skin-card p-4">
						<p class="text-xs font-semibold uppercase text-muted-fg">Service provider values</p>
						<div class="mt-4 space-y-4">
							<div>
								<p class="text-xs font-medium text-muted-fg">{{ serviceCallbackLabel }}</p>
								<p class="mt-1 break-all rounded-2xl bg-canvas p-3 font-mono text-xs leading-5 text-canvas-fg ring-1 ring-border">{{ serviceCallbackUrl }}</p>
							</div>
							<div>
								<p class="text-xs font-medium text-muted-fg">{{ provider === 'saml' ? 'Service provider entity ID' : 'Client identifier' }}</p>
								<p class="mt-1 break-all rounded-2xl bg-canvas p-3 font-mono text-xs leading-5 text-canvas-fg ring-1 ring-border">urn:dom-studio:northstar</p>
							</div>
							<DomButton type="button" variant="secondary" size="sm">Copy setup values</DomButton>
						</div>
					</div>
				</section>

				<section class="rounded-3xl border border-border skin-popover p-4 sm:p-5">
					<div class="grid gap-4 lg:grid-cols-2">
						<div class="space-y-4">
							<div>
								<p class="text-xs font-semibold uppercase text-muted-fg">Metadata</p>
								<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">IdP configuration</h2>
							</div>
							<DomTextInput v-model="entityId" :label="entityLabel" placeholder="https://idp.example.com/entity" />
							<DomTextInput v-model="ssoUrl" :label="endpointLabel" type="url" placeholder="https://idp.example.com/sso" />
						</div>

						<DomCodeInput
							v-model="metadataXml"
							:label="metadataLabel"
							:description="metadataDescription"
							lang="html"
							:editor="false"
							:rows="10"
						/>
					</div>
				</section>

				<section class="rounded-3xl border border-border skin-card p-4 sm:p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Provisioning</p>
							<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Group role mapping</h2>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
								Preview which IdP groups become admins, members, or reviewers before access is enforced.
							</p>
						</div>
						<DomStatusPill :tone="selectedReviewGroups ? 'warning' : 'success'" :label="selectedReviewGroups ? `${selectedReviewGroups} needs review` : 'Mappings synced'" />
					</div>

					<DomTagCombobox
						v-model="groups"
						label="Synced groups"
						description="Choose imported IdP groups to include in the initial rollout."
						:options="groupOptions"
						class="mt-5"
					>
						<template #item="{ item }">
							<span class="flex min-w-0 items-center justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate text-sm font-semibold">{{ item.label }}</span>
									<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
								</span>
								<DomBadge :tone="statusTone(item.status)" size="sm" variant="outline">{{ item.status }}</DomBadge>
							</span>
						</template>
					</DomTagCombobox>

					<div class="mt-5 space-y-3">
						<MappingRow
							v-for="row in mappingRows"
							:key="row.source"
							v-bind="row"
						/>
					</div>
				</section>

				<section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
					<div class="rounded-3xl border border-border skin-popover p-4 sm:p-5">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Rollout safety</p>
							<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Activation checklist</h2>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
								Keep recovery access and communication policy visible before you require SSO for all verified domains.
							</p>
						</div>
						<DomAccordion :items="checklistItems" multiple class="mt-5" />
					</div>

					<div class="rounded-3xl border border-border skin-card p-4">
						<p class="text-xs font-semibold uppercase text-muted-fg">Test result</p>
						<div class="mt-4 grid place-items-center rounded-[2rem] bg-canvas p-6 text-center ring-1 ring-border">
							<div class="grid size-14 place-items-center rounded-full" :class="testState === 'passed' ? 'bg-success/15 text-success' : 'bg-secondary text-muted-fg'">
								<svg viewBox="0 0 24 24" class="size-7" fill="none" aria-hidden="true">
									<path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
									<path d="m9 12 2 2 4-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<p class="mt-4 text-sm font-semibold text-canvas-fg">{{ testState === 'passed' ? 'Assertion accepted' : 'Waiting for test' }}</p>
							<p class="mt-2 text-xs leading-5 text-muted-fg">
								{{ testState === 'passed' ? 'NameID, email, groups, and certificate fingerprint matched the draft setup.' : 'Run a test with an admin account before activation.' }}
							</p>
						</div>
						<DomButton type="button" class="mt-4 w-full" :disabled="!canTest" @click="testConnection">
							Test connection
						</DomButton>
					</div>
				</section>
			</div>
		</div>

		<DomDialog
			v-model="testDialogOpen"
			title="SSO test passed"
			description="The test assertion matched this draft configuration. Keep activation server-owned and require a privileged admin action before enforcing login."
		>
			<div class="space-y-3 text-sm">
				<div class="rounded-2xl border border-border bg-canvas p-4">
					<p class="font-semibold text-canvas-fg">Matched claims</p>
					<p class="mt-2 text-muted-fg">email, name, groups, certificate fingerprint, and recipient URL were accepted.</p>
				</div>
				<div class="rounded-2xl border border-border bg-canvas p-4">
					<p class="font-semibold text-canvas-fg">Recommended next step</p>
					<p class="mt-2 text-muted-fg">Notify admins, preserve fallback access, then activate forced SSO for verified domains.</p>
				</div>
			</div>
			<template #footer>
				<DomButton type="button" variant="secondary" data-close>Keep editing</DomButton>
				<DomButton type="button" data-close>Review activation</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
