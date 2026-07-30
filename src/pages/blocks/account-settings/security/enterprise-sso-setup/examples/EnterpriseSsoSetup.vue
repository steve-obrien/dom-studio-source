<script setup>
import { computed, ref, watch } from 'vue';
import {
	DomAccordion,
	DomBadge,
	DomButton,
	DomCard,
	DomCodeInput,
	DomDialog,
	DomProgress,
	DomRadioGroup,
	DomStatusPill,
	DomTabs,
	DomTagCombobox,
	DomTextInput,
	DomToggle,
} from '../../../../../lib/vue';
import MappingRow from '../components/MappingRow.vue';
import SetupStep from '../components/SetupStep.vue';

const stages = [
	{ key: 'connection', label: 'Connection', number: 1 },
	{ key: 'access', label: 'Access', number: 2 },
	{ key: 'rollout', label: 'Activate', number: 3 },
];

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
		description: 'Use for discovery URLs, client credentials, modern OAuth policy, and rotating signing keys.',
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

const roleOptions = [
	{ label: 'Workspace admin', value: 'workspace-admin', description: 'Full product and organization administration.' },
	{ label: 'Member + viewer seat', value: 'member-viewer', description: 'Standard access with a viewer billing seat.' },
	{ label: 'Billing reviewer', value: 'billing-reviewer', description: 'Invoices, plans, and financial approval access.' },
	{ label: 'No workspace access', value: 'excluded', description: 'Keep the IdP group outside this rollout.' },
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

const activeStage = ref('connection');
const provider = ref('saml');
const domains = ref(['northstar.example', 'northstar-analytics.example']);
const groups = ref(['okta-product-admins', 'okta-analysts', 'okta-finance-reviewers']);
const mappingRows = ref([
	{ id: 'okta-product-admins', source: 'Okta - Product admins', target: 'workspace-admin', count: '42 users', status: 'synced' },
	{ id: 'okta-analysts', source: 'Okta - Analysts', target: 'member-viewer', count: '188 users', status: 'synced' },
	{ id: 'okta-finance-reviewers', source: 'Okta - Finance reviewers', target: 'billing-reviewer', count: '19 users', status: 'review' },
]);
const entityId = ref('http://www.okta.com/exk2d9sso');
const ssoUrl = ref('https://northstar.okta.com/app/dom-studio/sso/saml');
const metadataXml = ref(`<EntityDescriptor entityID="http://www.okta.com/exk2d9sso">
	<IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
		<SingleSignOnService Binding="HTTP-Redirect" Location="https://northstar.okta.com/app/dom-studio/sso/saml" />
	</IDPSSODescriptor>
</EntityDescriptor>`);
const preserveFallback = ref(true);
const notifyAdmins = ref(true);
const requireSso = ref(false);
const draftState = ref('saved');
const copyState = ref('ready');
const testState = ref('ready');
const activationState = ref('draft');
const testDialogOpen = ref(false);
const activationDialogOpen = ref(false);

const activeProvider = computed(getActiveProvider);
const verifiedDomainCount = computed(getVerifiedDomainCount);
const pendingDomainCount = computed(getPendingDomainCount);
const visibleMappingRows = computed(getVisibleMappingRows);
const mappingReviewCount = computed(getMappingReviewCount);
const selectedBlockedGroups = computed(getSelectedBlockedGroups);
const connectionReady = computed(getConnectionReady);
const mappingReady = computed(getMappingReady);
const canTest = computed(getCanTest);
const canActivate = computed(getCanActivate);
const completionPercent = computed(getCompletionPercent);
const setupStatus = computed(getSetupStatus);
const serviceCallbackLabel = computed(getServiceCallbackLabel);
const serviceCallbackUrl = computed(getServiceCallbackUrl);
const entityLabel = computed(getEntityLabel);
const endpointLabel = computed(getEndpointLabel);
const metadataLabel = computed(getMetadataLabel);
const metadataDescription = computed(getMetadataDescription);

watch(
	[provider, domains, groups, mappingRows, entityId, ssoUrl, metadataXml, preserveFallback, notifyAdmins, requireSso],
	markDraftDirty,
	{ deep: true },
);

/**
 * Return the option record matching a selected value.
 *
 * @param {Array<Record<string, unknown>>} options Candidate options.
 * @param {string} value Selected option value.
 * @returns {Record<string, unknown>|null} Matching option or null.
 */
function findOption(options, value) {
	for (const option of options) {
		if (option.value === value) return option;
	}
	return null;
}

/**
 * Return the selected identity provider record.
 *
 * @returns {Record<string, unknown>} Active provider option.
 */
function getActiveProvider() {
	return findOption(providers, provider.value) || providers[0];
}

/**
 * Resolve the ownership state for a selected company domain.
 *
 * @param {string} value Domain value.
 * @returns {string} Domain status.
 */
function domainStatus(value) {
	return findOption(domainOptions, value)?.status || 'custom';
}

/**
 * Count selected domains with completed ownership verification.
 *
 * @returns {number} Verified domain count.
 */
function getVerifiedDomainCount() {
	let count = 0;
	for (const domain of domains.value) {
		if (domainStatus(domain) === 'verified') count += 1;
	}
	return count;
}

/**
 * Count selected domains still waiting for DNS verification.
 *
 * @returns {number} Pending domain count.
 */
function getPendingDomainCount() {
	let count = 0;
	for (const domain of domains.value) {
		if (domainStatus(domain) === 'pending') count += 1;
	}
	return count;
}

/**
 * Keep mapping rows aligned with the groups included in this rollout.
 *
 * @returns {Array<Record<string, string>>} Visible role mappings.
 */
function getVisibleMappingRows() {
	const rows = [];
	for (const row of mappingRows.value) {
		if (groups.value.includes(row.id)) rows.push(row);
	}
	return rows;
}

/**
 * Count visible role mappings that require an administrator decision.
 *
 * @returns {number} Mapping review count.
 */
function getMappingReviewCount() {
	let count = 0;
	for (const row of visibleMappingRows.value) {
		if (row.status === 'review') count += 1;
	}
	return count;
}

/**
 * Count selected groups that cannot participate in the rollout.
 *
 * @returns {number} Blocked group count.
 */
function getSelectedBlockedGroups() {
	let count = 0;
	for (const group of groups.value) {
		if (findOption(groupOptions, group)?.status === 'blocked') count += 1;
	}
	return count;
}

/**
 * Determine whether provider, domain, and metadata setup is testable.
 *
 * @returns {boolean} Whether connection setup is complete.
 */
function getConnectionReady() {
	return Boolean(
		provider.value
		&& verifiedDomainCount.value
		&& entityId.value.trim()
		&& ssoUrl.value.trim()
		&& metadataXml.value.trim(),
	);
}

/**
 * Determine whether all selected IdP groups have approved workspace roles.
 *
 * @returns {boolean} Whether group mapping is complete.
 */
function getMappingReady() {
	return Boolean(
		visibleMappingRows.value.length
		&& !mappingReviewCount.value
		&& !selectedBlockedGroups.value,
	);
}

/**
 * Determine whether a safe connection test can run.
 *
 * @returns {boolean} Whether testing is available.
 */
function getCanTest() {
	return Boolean(
		connectionReady.value
		&& visibleMappingRows.value.length
		&& !selectedBlockedGroups.value,
	);
}

/**
 * Determine whether the reviewed configuration can be activated.
 *
 * @returns {boolean} Whether activation is available.
 */
function getCanActivate() {
	return Boolean(
		testState.value === 'passed'
		&& mappingReady.value
		&& preserveFallback.value
		&& notifyAdmins.value
		&& requireSso.value,
	);
}

/**
 * Calculate readiness from completed workflow gates rather than field presence.
 *
 * @returns {number} Setup completion percentage.
 */
function getCompletionPercent() {
	if (activationState.value === 'active') return 100;
	let score = 0;
	if (connectionReady.value) score += 50;
	if (visibleMappingRows.value.length) score += 10;
	if (mappingReady.value) score += 15;
	if (testState.value === 'passed') score += 25;
	return score;
}

/**
 * Resolve the global setup status shown beside the page title.
 *
 * @returns {{ tone: string, label: string }} Status pill presentation.
 */
function getSetupStatus() {
	if (activationState.value === 'active') return { tone: 'success', label: 'SSO active' };
	if (testState.value === 'passed') return { tone: 'warning', label: 'Ready to activate' };
	if (canTest.value) return { tone: 'info', label: 'Draft ready to test' };
	return { tone: 'neutral', label: 'Draft setup' };
}

/**
 * Return the callback label for the selected protocol.
 *
 * @returns {string} Callback field label.
 */
function getServiceCallbackLabel() {
	return provider.value === 'saml' ? 'ACS URL' : 'Redirect URI';
}

/**
 * Return the application callback URL for the selected protocol.
 *
 * @returns {string} Callback URL.
 */
function getServiceCallbackUrl() {
	return provider.value === 'saml'
		? 'https://app.example.com/sso/saml/acs/northstar'
		: 'https://app.example.com/sso/oidc/callback/northstar';
}

/**
 * Return the provider identifier label for the selected protocol.
 *
 * @returns {string} Identifier field label.
 */
function getEntityLabel() {
	return provider.value === 'saml' ? 'IdP entity ID' : 'Issuer URL';
}

/**
 * Return the authorization endpoint label for the selected protocol.
 *
 * @returns {string} Endpoint field label.
 */
function getEndpointLabel() {
	return provider.value === 'saml' ? 'Single sign-on URL' : 'Authorization endpoint';
}

/**
 * Return the structured metadata label for the selected protocol.
 *
 * @returns {string} Metadata field label.
 */
function getMetadataLabel() {
	return provider.value === 'saml' ? 'Metadata XML' : 'Discovery document';
}

/**
 * Return server-storage guidance for the selected metadata format.
 *
 * @returns {string} Metadata helper text.
 */
function getMetadataDescription() {
	return provider.value === 'saml'
		? 'Paste signed IdP metadata. Store the certificate fingerprint and expiration on the server.'
		: 'Paste issuer metadata. Store supported scopes, claims, key rotation, and signing algorithms on the server.';
}

/**
 * Resolve the semantic state for a workflow stage.
 *
 * @param {string} stageKey Stage identifier.
 * @returns {string} Complete, current, attention, or pending status.
 */
function stageStatus(stageKey) {
	if (stageKey === 'connection') return connectionReady.value ? 'complete' : 'current';
	if (stageKey === 'access') {
		if (mappingReady.value) return 'complete';
		return mappingReviewCount.value || selectedBlockedGroups.value ? 'attention' : 'current';
	}
	if (activationState.value === 'active') return 'complete';
	if (testState.value === 'passed') return 'attention';
	return 'pending';
}

/**
 * Resolve a semantic tone for domain and group option metadata.
 *
 * @param {string} status Option status.
 * @returns {string} DOM Studio status tone.
 */
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

/**
 * Mark the saved draft stale and require a fresh connection test after edits.
 *
 * @returns {void}
 */
function markDraftDirty() {
	if (activationState.value === 'active') return;
	draftState.value = 'unsaved';
	if (testState.value === 'passed') testState.value = 'ready';
}

/**
 * Persist the current configuration as a draft in this example.
 *
 * @returns {void}
 */
function saveDraft() {
	draftState.value = 'saved';
}

/**
 * Copy generated service-provider values for the identity-provider setup.
 *
 * @returns {Promise<void>} Resolves after the clipboard attempt.
 */
async function copySetupValues() {
	const values = `${serviceCallbackLabel.value}: ${serviceCallbackUrl.value}\nService provider entity ID: urn:dom-studio:northstar`;
	copyState.value = 'copying';
	try {
		if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
		await navigator.clipboard.writeText(values);
		copyState.value = 'copied';
	} catch {
		copyState.value = 'unavailable';
	}
}

/**
 * Commit a new workspace role and clear its review status.
 *
 * @param {Record<string, string>} row Mapping row being edited.
 * @param {string} value Selected role identifier.
 * @returns {void}
 */
function updateMappingTarget(row, value) {
	row.target = value;
	row.status = value ? 'synced' : 'review';
}

/**
 * Move the workflow to a named setup stage.
 *
 * @param {string} stageKey Stage identifier.
 * @returns {void}
 */
function goToStage(stageKey) {
	activeStage.value = stageKey;
}

/**
 * Run the example connection assertion and show its results.
 *
 * @returns {void}
 */
function testConnection() {
	if (!canTest.value) return;
	testState.value = 'passed';
	draftState.value = 'saved';
	testDialogOpen.value = true;
}

/**
 * Close the test result and focus the activation stage.
 *
 * @returns {void}
 */
function reviewActivation() {
	testDialogOpen.value = false;
	activeStage.value = 'rollout';
}

/**
 * Open the final activation confirmation when every rollout gate passes.
 *
 * @returns {void}
 */
function openActivationDialog() {
	if (!canActivate.value) return;
	activationDialogOpen.value = true;
}

/**
 * Activate forced SSO for verified domains in this example.
 *
 * @returns {void}
 */
function activateSso() {
	if (!canActivate.value) return;
	activationState.value = 'active';
	draftState.value = 'saved';
	activationDialogOpen.value = false;
}
</script>

<template>
	<section class="min-h-screen bg-canvas px-4 py-6 text-canvas-fg sm:px-6 lg:px-8" data-testid="enterprise-sso-setup-block">
		<div class="mx-auto w-full max-w-6xl">
			<header class="grid gap-5 border-b border-border pb-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
				<div>
					<div class="flex flex-wrap items-center gap-2">
						<DomStatusPill :tone="setupStatus.tone" :label="setupStatus.label" />
						<DomBadge tone="primary" variant="outline">Enterprise</DomBadge>
						<DomStatusPill
							:tone="draftState === 'saved' ? 'success' : 'warning'"
							:label="draftState === 'saved' ? 'Draft saved' : 'Unsaved changes'"
						/>
					</div>
					<p class="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-fg">Account settings · Security</p>
					<h1 class="mt-2 text-3xl font-bold tracking-tight text-canvas-fg">Enterprise SSO setup</h1>
					<p class="mt-3 max-w-3xl text-sm leading-6 text-muted-fg">
						Connect an identity provider, review workspace access, and test the rollout before requiring SSO for verified company domains.
					</p>
				</div>

				<div class="space-y-4">
					<DomProgress
						:value="completionPercent"
						label="Setup readiness"
						:tone="activationState === 'active' ? 'success' : 'primary'"
						size="sm"
						show-value
					/>
					<div class="flex flex-wrap justify-end gap-2">
						<DomButton type="button" variant="secondary" @click="goToStage('rollout')">Review rollout</DomButton>
						<DomButton type="button" :disabled="draftState === 'saved'" @click="saveDraft">Save draft</DomButton>
					</div>
				</div>
			</header>

			<DomCard padding="none" class="mt-6">
				<DomTabs
					v-model="activeStage"
					:tabs="stages"
					variant="page"
					class="[&_[role=tab]]:shrink-0"
				>
					<template #tab="{ tab }">
						<SetupStep
							:number="tab.number"
							:title="tab.label"
							:status="stageStatus(tab.key)"
						/>
					</template>

					<template #connection>
						<div class="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
							<div class="divide-y divide-border">
								<section class="p-5 sm:p-6">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p class="text-xs font-semibold uppercase text-muted-fg">Connection</p>
											<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Choose an identity protocol</h2>
										</div>
										<DomStatusPill
											:tone="connectionReady ? 'success' : 'info'"
											:label="connectionReady ? 'Connection complete' : 'Configuration needed'"
										/>
									</div>

									<DomRadioGroup
										v-model="provider"
										label="Protocol"
										description="Choose the protocol the customer identity provider expects."
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

								<section class="p-5 sm:p-6">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div>
											<p class="text-xs font-semibold uppercase text-muted-fg">Login routing</p>
											<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Company domains</h2>
											<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
												People using these domains will be routed through {{ activeProvider.label }} after activation.
											</p>
										</div>
										<div class="flex flex-wrap gap-2">
											<DomStatusPill tone="success" :label="`${verifiedDomainCount} verified`" />
											<DomStatusPill v-if="pendingDomainCount" tone="warning" :label="`${pendingDomainCount} pending`" />
										</div>
									</div>

									<DomTagCombobox
										v-model="domains"
										label="Domains"
										description="Add verified company domains or begin a DNS ownership check."
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
												<DomStatusPill :tone="statusTone(item.status)" :label="item.status" size="sm" />
											</span>
										</template>
									</DomTagCombobox>
								</section>

								<section class="p-5 sm:p-6">
									<div>
										<p class="text-xs font-semibold uppercase text-muted-fg">Provider metadata</p>
										<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">IdP configuration</h2>
										<p class="mt-2 text-sm leading-6 text-muted-fg">
											Paste server-issued metadata and keep certificate validation, expiry, and key rotation in the backend.
										</p>
									</div>

									<div class="mt-5 grid gap-5 lg:grid-cols-2">
										<div class="space-y-4">
											<DomTextInput v-model="entityId" :label="entityLabel" placeholder="https://idp.example.com/entity" />
											<DomTextInput v-model="ssoUrl" :label="endpointLabel" type="url" placeholder="https://idp.example.com/sso" />
										</div>
										<DomCodeInput
											v-model="metadataXml"
											:label="metadataLabel"
											:description="metadataDescription"
											lang="html"
											:editor="false"
											:rows="9"
										/>
									</div>
								</section>
							</div>

							<aside class="border-t border-border bg-secondary/25 p-5 lg:border-l lg:border-t-0 sm:p-6">
								<p class="text-xs font-semibold uppercase text-muted-fg">Service provider values</p>
								<h2 class="mt-1 text-lg font-bold tracking-tight text-canvas-fg">Add these to {{ activeProvider.label }}</h2>
								<p class="mt-2 text-sm leading-6 text-muted-fg">Generated values are organization-specific and safe to copy into the IdP administrator console.</p>

								<dl class="mt-6 divide-y divide-border border-y border-border text-sm">
									<div class="py-4">
										<dt class="text-xs font-medium text-muted-fg">{{ serviceCallbackLabel }}</dt>
										<dd class="mt-2 break-all font-mono text-xs leading-5 text-canvas-fg">{{ serviceCallbackUrl }}</dd>
									</div>
									<div class="py-4">
										<dt class="text-xs font-medium text-muted-fg">{{ provider === 'saml' ? 'Service provider entity ID' : 'Client identifier' }}</dt>
										<dd class="mt-2 break-all font-mono text-xs leading-5 text-canvas-fg">urn:dom-studio:northstar</dd>
									</div>
								</dl>

								<DomButton
									type="button"
									variant="secondary"
									class="mt-5 w-full"
									:loading="copyState === 'copying'"
									@click="copySetupValues"
								>
									{{ copyState === 'copied' ? 'Setup values copied' : copyState === 'unavailable' ? 'Clipboard unavailable' : 'Copy setup values' }}
								</DomButton>
								<DomButton type="button" class="mt-2 w-full" @click="goToStage('access')">Continue to access mapping</DomButton>
							</aside>
						</div>
					</template>

					<template #access>
						<div class="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
							<section class="p-5 sm:p-6">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p class="text-xs font-semibold uppercase text-muted-fg">Provisioning</p>
										<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Map IdP groups to workspace roles</h2>
										<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
											Review imported groups and choose the least-privileged role each group needs before testing access.
										</p>
									</div>
									<DomStatusPill
										:tone="mappingReady ? 'success' : 'warning'"
										:label="mappingReady ? 'Mappings approved' : `${mappingReviewCount || selectedBlockedGroups} needs review`"
									/>
								</div>

								<DomTagCombobox
									v-model="groups"
									label="Groups included in rollout"
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
											<DomStatusPill :tone="statusTone(item.status)" :label="item.status" size="sm" />
										</span>
									</template>
								</DomTagCombobox>

								<div class="mt-5 border-t border-border">
									<MappingRow
										v-for="row in visibleMappingRows"
										:key="row.id"
										:model-value="row.target"
										:source="row.source"
										:count="row.count"
										:status="row.status"
										:options="roleOptions"
										@update:model-value="updateMappingTarget(row, $event)"
									/>
								</div>
							</section>

							<aside class="border-t border-border bg-secondary/25 p-5 lg:border-l lg:border-t-0 sm:p-6">
								<p class="text-xs font-semibold uppercase text-muted-fg">Access review</p>
								<h2 class="mt-1 text-lg font-bold tracking-tight text-canvas-fg">Rollout impact</h2>
								<dl class="mt-5 divide-y divide-border border-y border-border text-sm">
									<div class="flex items-center justify-between gap-3 py-3">
										<dt class="text-muted-fg">Included groups</dt>
										<dd class="font-semibold text-canvas-fg">{{ visibleMappingRows.length }}</dd>
									</div>
									<div class="flex items-center justify-between gap-3 py-3">
										<dt class="text-muted-fg">People affected</dt>
										<dd class="font-semibold text-canvas-fg">249</dd>
									</div>
									<div class="flex items-center justify-between gap-3 py-3">
										<dt class="text-muted-fg">Mappings to review</dt>
										<dd>
											<DomStatusPill
												:tone="mappingReviewCount ? 'warning' : 'success'"
												:label="mappingReviewCount ? String(mappingReviewCount) : 'None'"
											/>
										</dd>
									</div>
								</dl>
								<p class="mt-5 text-xs leading-5 text-muted-fg">
									Changing a reviewed role invalidates any earlier connection test so the activation decision always reflects the current access policy.
								</p>
								<DomButton type="button" class="mt-5 w-full" @click="goToStage('rollout')">Continue to test</DomButton>
							</aside>
						</div>
					</template>

					<template #rollout>
						<div class="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
							<div class="divide-y divide-border">
								<section class="p-5 sm:p-6">
									<div>
										<p class="text-xs font-semibold uppercase text-muted-fg">Rollout safety</p>
										<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Activation controls</h2>
										<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
											Confirm recovery and communication safeguards before requiring SSO for company domains.
										</p>
									</div>

									<div class="mt-5 grid gap-5">
										<DomToggle
											v-model="preserveFallback"
											label="Preserve password fallback during rollout"
											description="Keep two break-glass administrators outside forced SSO during the migration window."
										/>
										<DomToggle
											v-model="notifyAdmins"
											label="Notify administrators before activation"
											description="Send the activation date, affected domains, recovery contact, and next-sign-in behavior."
										/>
										<DomToggle
											v-model="requireSso"
											label="Require SSO for verified domains"
											description="After activation, route people with verified company domains through the configured identity provider."
										/>
									</div>
								</section>

								<section class="p-5 sm:p-6">
									<p class="text-xs font-semibold uppercase text-muted-fg">Implementation guidance</p>
									<h2 class="mt-1 text-xl font-bold tracking-tight text-canvas-fg">Before enforcement</h2>
									<DomAccordion :items="checklistItems" multiple class="mt-5" />
								</section>
							</div>

							<aside class="border-t border-border bg-secondary/25 p-5 lg:border-l lg:border-t-0 sm:p-6">
								<p class="text-xs font-semibold uppercase text-muted-fg">Connection test</p>
								<div class="mt-4 border-y border-border py-5">
									<DomStatusPill
										:tone="testState === 'passed' ? 'success' : canTest ? 'info' : 'neutral'"
										:label="testState === 'passed' ? 'Assertion accepted' : canTest ? 'Ready to test' : 'Configuration incomplete'"
									/>
									<h2 class="mt-3 text-lg font-bold tracking-tight text-canvas-fg">
										{{ testState === 'passed' ? 'Claims matched the draft' : 'Run an administrator assertion' }}
									</h2>
									<p class="mt-2 text-sm leading-6 text-muted-fg">
										{{ testState === 'passed' ? 'Email, name, groups, certificate fingerprint, and recipient URL were accepted.' : 'The test checks claims and recipient values without activating forced login.' }}
									</p>
								</div>

								<DomButton type="button" variant="secondary" class="mt-5 w-full" :disabled="!canTest" @click="testConnection">
									{{ testState === 'passed' ? 'Run test again' : 'Test connection' }}
								</DomButton>
								<DomButton
									type="button"
									class="mt-2 w-full"
									:disabled="!canActivate || activationState === 'active'"
									@click="openActivationDialog"
								>
									{{ activationState === 'active' ? 'SSO is active' : 'Activate SSO' }}
								</DomButton>

								<div v-if="!canActivate && activationState !== 'active'" class="mt-5 space-y-2 text-xs leading-5 text-muted-fg">
									<p v-if="testState !== 'passed'">Run a successful connection test.</p>
									<p v-if="!mappingReady">Resolve every group-role review.</p>
									<p v-if="!requireSso">Confirm that verified domains should require SSO.</p>
								</div>
							</aside>
						</div>
					</template>
				</DomTabs>
			</DomCard>
		</div>

		<DomDialog
			v-model="testDialogOpen"
			title="SSO test passed"
			description="The assertion matched this draft configuration. Review the exact activation scope before enforcing login."
		>
			<dl class="divide-y divide-border border-y border-border text-sm">
				<div class="py-4">
					<dt class="font-semibold text-canvas-fg">Matched claims</dt>
					<dd class="mt-1 text-muted-fg">Email, name, groups, certificate fingerprint, and recipient URL were accepted.</dd>
				</div>
				<div class="py-4">
					<dt class="font-semibold text-canvas-fg">Activation scope</dt>
					<dd class="mt-1 text-muted-fg">{{ verifiedDomainCount }} verified domain and {{ visibleMappingRows.length }} mapped groups.</dd>
				</div>
			</dl>
			<template #footer>
				<DomButton type="button" variant="secondary" data-close>Keep editing</DomButton>
				<DomButton type="button" @click="reviewActivation">Review activation</DomButton>
			</template>
		</DomDialog>

		<DomDialog
			v-model="activationDialogOpen"
			title="Activate enterprise SSO?"
			description="This changes the next sign-in for people using verified company domains. Password fallback remains available to emergency administrators."
		>
			<dl class="divide-y divide-border border-y border-border text-sm">
				<div class="flex items-center justify-between gap-4 py-3">
					<dt class="text-muted-fg">Protocol</dt>
					<dd class="font-semibold text-canvas-fg">{{ activeProvider.label }}</dd>
				</div>
				<div class="flex items-center justify-between gap-4 py-3">
					<dt class="text-muted-fg">Verified domains</dt>
					<dd class="font-semibold text-canvas-fg">{{ verifiedDomainCount }}</dd>
				</div>
				<div class="flex items-center justify-between gap-4 py-3">
					<dt class="text-muted-fg">Mapped groups</dt>
					<dd class="font-semibold text-canvas-fg">{{ visibleMappingRows.length }}</dd>
				</div>
			</dl>
			<template #footer>
				<DomButton type="button" variant="secondary" data-close>Cancel</DomButton>
				<DomButton type="button" @click="activateSso">Activate SSO</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
