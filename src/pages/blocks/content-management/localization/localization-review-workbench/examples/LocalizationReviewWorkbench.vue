<script setup>
import { computed, ref } from 'vue';
import {
	DomBadge,
	DomButton,
	DomDialog,
	DomListbox,
	DomStatusPill,
	DomTagCombobox,
	DomTabs,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';
import LocaleProgressRail from '../components/LocaleProgressRail.vue';
import QualityCheckList from '../components/QualityCheckList.vue';
import TranslationSegmentCard from '../components/TranslationSegmentCard.vue';

const batchOptions = [
	{
		label: 'Checkout release',
		value: 'checkout',
		description: 'Payment, receipt, and retry flows',
		segments: 18,
		due: 'Ships Jun 18',
	},
	{
		label: 'Activation refresh',
		value: 'activation',
		description: 'Onboarding, invites, and workspace setup',
		segments: 24,
		due: 'Ships Jun 24',
	},
	{
		label: 'Admin audit pack',
		value: 'audit',
		description: 'Security logs and compliance copy',
		segments: 12,
		due: 'Ships Jul 02',
	},
];

const localeSeed = [
	{ label: 'French', value: 'fr-FR', owner: 'Camille', approved: 2, issues: 2, progress: 67 },
	{ label: 'German', value: 'de-DE', owner: 'Jonas', approved: 1, issues: 3, progress: 42 },
	{ label: 'Spanish', value: 'es-ES', owner: 'Lucia', approved: 3, issues: 1, progress: 78 },
	{ label: 'Japanese', value: 'ja-JP', owner: 'Aiko', approved: 1, issues: 2, progress: 48 },
];

const termOptions = [
	{ label: 'Workspace', value: 'workspace', description: 'Never translate as office or space' },
	{ label: 'Payment attempt', value: 'payment-attempt', description: 'Use approved billing glossary term' },
	{ label: 'Upgrade', value: 'upgrade', description: 'Keep action-oriented and product-led' },
	{ label: 'Receipt', value: 'receipt', description: 'Use finance-approved noun' },
	{ label: 'Tax ID', value: 'tax-id', description: 'Localize by country convention' },
	{ label: 'Retry', value: 'retry', description: 'Avoid blaming the customer' },
];

const viewOptions = [
	{ label: 'Review', value: 'review' },
	{ label: 'Context', value: 'context' },
	{ label: 'Payload', value: 'payload' },
];

const reviewTabs = [
	{ key: 'segments', label: 'Segments' },
	{ key: 'qa', label: 'QA checks' },
	{ key: 'handoff', label: 'Handoff' },
];

const segments = ref([
	{
		id: 'seg-001',
		key: 'checkout.hero.title',
		title: 'Payment confirmation title',
		area: 'Checkout',
		source: 'Your payment is confirmed',
		context: 'Shown after a successful card authorization on the checkout confirmation page.',
		maxLength: 42,
		glossary: [
			{ term: 'confirmed', note: 'Use wording that implies the payment has settled enough for the order to proceed.' },
			{ term: 'payment', note: 'Use the finance-approved noun for customer-facing checkout flows.' },
		],
		memory: ['Checkout title', 'High visibility'],
		targets: {
			'fr-FR': 'Votre paiement est confirme',
			'de-DE': 'Ihre Zahlung ist bestaetigt',
			'es-ES': 'Tu pago esta confirmado',
			'ja-JP': 'お支払いが確認されました',
		},
		statuses: {
			'fr-FR': 'approved',
			'de-DE': 'needs-review',
			'es-ES': 'approved',
			'ja-JP': 'needs-review',
		},
		qa: {
			'fr-FR': [],
			'de-DE': [{ id: 'tone', title: 'Tone review', detail: 'German copy should be slightly more formal for payment confirmation.', severity: 'Medium', resolved: false }],
			'es-ES': [],
			'ja-JP': [{ id: 'length', title: 'Mobile length', detail: 'May wrap on compact receipt cards. Confirm with the mobile preview.', severity: 'Low', resolved: false }],
		},
	},
	{
		id: 'seg-002',
		key: 'checkout.retry.body',
		title: 'Retry payment body',
		area: 'Checkout',
		source: 'We could not process this payment. Check the card details or try another method.',
		context: 'Displayed after a failed authorization when the customer can recover without contacting support.',
		maxLength: 112,
		glossary: [
			{ term: 'try another method', note: 'Keep neutral. Do not imply fraud or user error.' },
			{ term: 'card details', note: 'Translate as payment card information, not account profile information.' },
		],
		memory: ['Recovery copy', 'Risk safe'],
		targets: {
			'fr-FR': 'Nous ne pouvons pas traiter ce paiement. Verifiez la carte ou essayez un autre moyen.',
			'de-DE': 'Wir konnten diese Zahlung nicht verarbeiten. Pruefen Sie die Kartendaten oder versuchen Sie eine andere Methode.',
			'es-ES': 'No pudimos procesar este pago. Revisa la tarjeta o prueba otro metodo.',
			'ja-JP': 'この支払いを処理できませんでした。カード情報を確認するか、別の方法をお試しください。',
		},
		statuses: {
			'fr-FR': 'needs-review',
			'de-DE': 'needs-review',
			'es-ES': 'approved',
			'ja-JP': 'needs-review',
		},
		qa: {
			'fr-FR': [{ id: 'accent', title: 'Accent missing', detail: 'Verifier should include the approved accent marks before release.', severity: 'High', resolved: false }],
			'de-DE': [{ id: 'length', title: 'Length warning', detail: 'The translated message is 18 percent longer than source.', severity: 'Medium', resolved: false }],
			'es-ES': [],
			'ja-JP': [{ id: 'tone', title: 'Tone check', detail: 'Confirm the retry instruction is direct enough for checkout recovery.', severity: 'Low', resolved: false }],
		},
	},
	{
		id: 'seg-003',
		key: 'receipt.taxId.helper',
		title: 'Tax ID helper text',
		area: 'Receipt',
		source: 'Add a tax ID if this receipt should include business billing details.',
		context: 'Shown in an optional receipt settings drawer before the customer downloads an invoice.',
		maxLength: 96,
		glossary: [
			{ term: 'tax ID', note: 'Use local business tax identifier language for each market.' },
		],
		memory: ['Billing settings', 'Optional field'],
		targets: {
			'fr-FR': 'Ajoutez un identifiant fiscal si ce recu doit inclure des informations de facturation.',
			'de-DE': 'Fuegen Sie eine Steuer-ID hinzu, wenn dieser Beleg Geschaeftsdaten enthalten soll.',
			'es-ES': 'Agrega un ID fiscal si este recibo debe incluir datos de facturacion.',
			'ja-JP': 'この領収書に事業者の請求情報を含める場合は、税務IDを追加してください。',
		},
		statuses: {
			'fr-FR': 'needs-review',
			'de-DE': 'needs-review',
			'es-ES': 'needs-review',
			'ja-JP': 'approved',
		},
		qa: {
			'fr-FR': [{ id: 'term', title: 'Glossary term', detail: 'Use the approved local term for tax ID in French finance flows.', severity: 'Medium', resolved: false }],
			'de-DE': [{ id: 'umlaut', title: 'Encoding review', detail: 'Replace ASCII fallback characters before publishing.', severity: 'High', resolved: false }],
			'es-ES': [{ id: 'market', title: 'Market wording', detail: 'Confirm whether ID fiscal or NIF is correct for this locale pack.', severity: 'Medium', resolved: false }],
			'ja-JP': [],
		},
	},
	{
		id: 'seg-004',
		key: 'upgrade.prompt.cta',
		title: 'Upgrade prompt CTA',
		area: 'Paywall',
		source: 'Upgrade to unlock custom receipts',
		context: 'Button label in a compact paywall shown inside receipt settings.',
		maxLength: 38,
		glossary: [
			{ term: 'upgrade', note: 'Use product-led upgrade wording, not an enterprise sales phrase.' },
			{ term: 'custom receipts', note: 'Keep receipt customization as the feature being unlocked.' },
		],
		memory: ['CTA', 'Paid feature'],
		targets: {
			'fr-FR': 'Passez au niveau superieur',
			'de-DE': 'Upgrade fuer eigene Belege',
			'es-ES': 'Mejora para recibos personalizados',
			'ja-JP': 'カスタム領収書を利用する',
		},
		statuses: {
			'fr-FR': 'approved',
			'de-DE': 'approved',
			'es-ES': 'approved',
			'ja-JP': 'needs-review',
		},
		qa: {
			'fr-FR': [],
			'de-DE': [],
			'es-ES': [{ id: 'cta', title: 'CTA strength', detail: 'Marketing asked whether this should use a stronger paid-plan verb.', severity: 'Low', resolved: false }],
			'ja-JP': [{ id: 'feature', title: 'Missing upgrade concept', detail: 'Translation explains the feature but not the upgrade action.', severity: 'Medium', resolved: false }],
		},
	},
]);

const selectedBatch = ref('checkout');
const selectedLocale = ref('fr-FR');
const activeSegmentId = ref('seg-002');
const activeView = ref('review');
const activeTab = ref('segments');
const statusFilter = ref('open');
const appliedTerms = ref(['payment-attempt', 'receipt']);
const publishDialogOpen = ref(false);
const published = ref(false);

const localeStats = computed(() => localeSeed.map((locale) => {
	const localeSegments = segments.value;
	const approved = localeSegments.filter((segment) => segment.statuses[locale.value] === 'approved').length;
	const issueCount = localeSegments.reduce((total, segment) => total + unresolvedChecksFor(segment, locale.value).length, 0);

	return {
		...locale,
		approved,
		issues: issueCount,
		progress: Math.round((approved / localeSegments.length) * 100),
	};
}));

const selectedLocaleRecord = computed(() => localeStats.value.find((locale) => locale.value === selectedLocale.value) || localeStats.value[0]);
const selectedBatchRecord = computed(() => batchOptions.find((batch) => batch.value === selectedBatch.value) || batchOptions[0]);
const activeSegment = computed(() => segments.value.find((segment) => segment.id === activeSegmentId.value) || segments.value[0]);
const activeChecks = computed(() => unresolvedChecksFor(activeSegment.value, selectedLocale.value));
const allLocaleChecks = computed(() => segments.value.flatMap((segment) => unresolvedChecksFor(segment, selectedLocale.value).map((check) => ({ ...check, segment }))));
const approvedCount = computed(() => segments.value.filter((segment) => segment.statuses[selectedLocale.value] === 'approved').length);
const readyToPublish = computed(() => approvedCount.value === segments.value.length && allLocaleChecks.value.length === 0);
const filteredSegments = computed(() => {
	if (statusFilter.value === 'approved') return segments.value.filter((segment) => segment.statuses[selectedLocale.value] === 'approved');
	if (statusFilter.value === 'issues') return segments.value.filter((segment) => unresolvedChecksFor(segment, selectedLocale.value).length);
	if (statusFilter.value === 'open') return segments.value.filter((segment) => segment.statuses[selectedLocale.value] !== 'approved');
	return segments.value;
});
const releasePayload = computed(() => ({
	batch: selectedBatch.value,
	locale: selectedLocale.value,
	appliedTerms: appliedTerms.value,
	segments: segments.value.map((segment) => ({
		key: segment.key,
		target: segment.targets[selectedLocale.value],
		status: segment.statuses[selectedLocale.value],
		qaOpen: unresolvedChecksFor(segment, selectedLocale.value).length,
	})),
}));

function unresolvedChecksFor(segment, locale) {
	return (segment.qa?.[locale] || []).filter((check) => !check.resolved);
}

function selectLocale(locale) {
	selectedLocale.value = locale;
	published.value = false;
}

function updateTarget(segment, value) {
	segment.targets[selectedLocale.value] = value;
	if (segment.statuses[selectedLocale.value] === 'approved') {
		segment.statuses[selectedLocale.value] = 'needs-review';
	}
	published.value = false;
}

function resolveCheck(segment, checkId) {
	const checks = segment.qa?.[selectedLocale.value] || [];
	const check = checks.find((item) => item.id === checkId);
	if (check) check.resolved = true;
	published.value = false;
}

function approveSegment(segment) {
	if (unresolvedChecksFor(segment, selectedLocale.value).length) return;
	segment.statuses[selectedLocale.value] = 'approved';
	published.value = false;
}

function publishLocale() {
	if (!readyToPublish.value) return;
	published.value = true;
	publishDialogOpen.value = false;
}
</script>

<template>
	<div class="min-h-screen bg-canvas p-4 text-canvas-fg sm:p-6">
		<div class="mx-auto flex max-w-7xl flex-col gap-5">
			<header class="rounded-lg border border-border skin-card p-4">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div class="max-w-3xl">
						<div class="flex flex-wrap items-center gap-2">
							<DomStatusPill :tone="readyToPublish ? 'success' : 'warning'" :pulse="!readyToPublish">
								{{ readyToPublish ? 'Ready to publish' : 'Review in progress' }}
							</DomStatusPill>
							<DomBadge variant="outline">{{ selectedBatchRecord.due }}</DomBadge>
						</div>
						<h1 class="mt-3 text-2xl font-semibold tracking-tight text-canvas-fg sm:text-3xl">
							Localization review workbench
						</h1>
						<p class="mt-2 text-sm leading-6 text-muted-fg">
							Review translated product strings with source context, glossary guidance, QA checks, and a release payload that can sync back to your translation service.
						</p>
					</div>
					<div class="grid gap-3 sm:grid-cols-[minmax(0,16rem)_auto]">
						<DomListbox
							v-model="selectedBatch"
							:options="batchOptions"
							label="Release batch"
							chrome="none"
						>
							<template #option="{ option }">
								<span class="flex min-w-0 items-center justify-between gap-3">
									<span class="min-w-0">
										<span class="block truncate font-semibold">{{ option.label }}</span>
										<span class="block truncate text-xs opacity-75">{{ option.description }}</span>
									</span>
									<span class="shrink-0 rounded-full bg-canvas/15 px-2 py-0.5 text-[11px] font-semibold">
										{{ option.segments }}
									</span>
								</span>
							</template>
						</DomListbox>
						<DomButton @click="publishDialogOpen = true">
							Review publish
						</DomButton>
					</div>
				</div>
			</header>

			<LocaleProgressRail
				:locales="localeStats"
				:selected-locale="selectedLocale"
				@select="selectLocale"
			/>

			<section class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<div class="min-w-0 rounded-lg border border-border skin-card p-4">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<p class="text-sm font-semibold text-canvas-fg">{{ selectedLocaleRecord.label }} locale pack</p>
							<p class="mt-1 text-sm text-muted-fg">
								{{ approvedCount }} of {{ segments.length }} approved, {{ allLocaleChecks.length }} open QA checks
							</p>
						</div>
						<div class="flex flex-wrap items-center gap-3">
							<DomToggleButtonGroup
								v-model="activeView"
								:options="viewOptions"
								size="sm"
								label="Review mode"
								chrome="none"
							/>
							<DomToggleButtonGroup
								v-model="statusFilter"
								:options="[
									{ label: 'Open', value: 'open' },
									{ label: 'Issues', value: 'issues' },
									{ label: 'Approved', value: 'approved' },
								]"
								size="sm"
								label="Segment filter"
								chrome="none"
							/>
						</div>
					</div>

					<div class="mt-5">
						<DomTabs v-model="activeTab" :tabs="reviewTabs">
							<template #segments>
								<div class="grid gap-3">
									<TranslationSegmentCard
										v-for="segment in filteredSegments"
										:key="segment.id"
										:segment="segment"
										:target="segment.targets[selectedLocale]"
										:status="segment.statuses[selectedLocale]"
										:checks="segment.qa[selectedLocale] || []"
										:active="segment.id === activeSegmentId"
										@select="activeSegmentId = segment.id"
										@update-target="updateTarget(segment, $event)"
										@approve="approveSegment(segment)"
									/>
									<div v-if="!filteredSegments.length" class="rounded-lg border border-dashed border-border p-8 text-center">
										<p class="text-sm font-semibold text-canvas-fg">No matching segments</p>
										<p class="mt-1 text-sm text-muted-fg">Change the filter to continue reviewing this locale.</p>
									</div>
								</div>
							</template>
							<template #qa>
								<div class="grid gap-3">
									<div
										v-for="item in allLocaleChecks"
										:key="`${item.segment.id}-${item.id}`"
										class="rounded-lg border border-border bg-canvas p-4"
									>
										<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
											<div>
												<p class="text-sm font-semibold text-canvas-fg">{{ item.segment.title }}</p>
												<p class="mt-1 text-xs text-muted-fg">{{ item.segment.key }}</p>
											</div>
											<DomBadge :tone="item.severity === 'High' ? 'danger' : item.severity === 'Medium' ? 'warning' : 'neutral'">
												{{ item.severity }}
											</DomBadge>
										</div>
										<p class="mt-3 text-sm leading-6 text-muted-fg">{{ item.detail }}</p>
										<DomButton class="mt-4" size="sm" variant="secondary" @click="resolveCheck(item.segment, item.id)">
											Mark resolved
										</DomButton>
									</div>
									<div v-if="!allLocaleChecks.length" class="rounded-lg border border-dashed border-border p-8 text-center">
										<p class="text-sm font-semibold text-canvas-fg">All QA checks resolved</p>
										<p class="mt-1 text-sm text-muted-fg">Approve the remaining segments before publishing this locale.</p>
									</div>
								</div>
							</template>
							<template #handoff>
								<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
									<div class="rounded-lg border border-border bg-canvas p-4">
										<p class="text-sm font-semibold text-canvas-fg">Translation memory tags</p>
										<p class="mt-1 text-sm text-muted-fg">Attach the glossary terms used while reviewing this release.</p>
										<DomTagCombobox
											v-model="appliedTerms"
											class="mt-4"
											:options="termOptions"
											label="Applied terms"
											placeholder="Add glossary terms..."
											clearable
										>
											<template #item="{ item }">
												<div class="min-w-0">
													<p class="truncate font-semibold">{{ item.label }}</p>
													<p class="truncate text-xs text-muted-fg">{{ item.description }}</p>
												</div>
											</template>
										</DomTagCombobox>
									</div>
									<div class="rounded-lg border border-border bg-canvas p-4">
										<p class="text-sm font-semibold text-canvas-fg">Release payload preview</p>
										<pre class="mt-3 max-h-72 overflow-auto rounded-lg bg-secondary p-3 text-xs leading-5 text-canvas-fg">{{ JSON.stringify(releasePayload, null, 2) }}</pre>
									</div>
								</div>
							</template>
						</DomTabs>
					</div>
				</div>

				<aside class="flex min-w-0 flex-col gap-4">
					<div class="rounded-lg border border-border skin-card p-4">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm font-semibold text-canvas-fg">Active segment</p>
								<p class="mt-1 text-xs text-muted-fg">{{ activeSegment.key }}</p>
							</div>
							<DomBadge variant="outline">{{ activeSegment.area }}</DomBadge>
						</div>
						<div class="mt-4 rounded-lg bg-secondary p-3">
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Context</p>
							<p class="mt-2 text-sm leading-6 text-canvas-fg">{{ activeSegment.context }}</p>
						</div>
						<div v-if="activeView === 'context'" class="mt-4 rounded-lg border border-border bg-canvas p-3">
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Source string</p>
							<p class="mt-2 text-sm leading-6 text-canvas-fg">{{ activeSegment.source }}</p>
						</div>
						<div v-else-if="activeView === 'payload'" class="mt-4 rounded-lg border border-border bg-canvas p-3">
							<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Segment payload</p>
							<pre class="mt-2 overflow-auto text-xs leading-5 text-canvas-fg">{{ JSON.stringify({
	key: activeSegment.key,
	target: activeSegment.targets[selectedLocale],
	status: activeSegment.statuses[selectedLocale],
}, null, 2) }}</pre>
						</div>
					</div>

					<div class="rounded-lg border border-border skin-card p-4">
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-semibold text-canvas-fg">QA for selected segment</p>
							<DomBadge :tone="activeChecks.length ? 'warning' : 'success'">
								{{ activeChecks.length }}
							</DomBadge>
						</div>
						<div class="mt-4">
							<QualityCheckList
								:checks="activeSegment.qa[selectedLocale] || []"
								@resolve="resolveCheck(activeSegment, $event)"
							/>
						</div>
					</div>
				</aside>
			</section>
		</div>

		<DomDialog
			v-model="publishDialogOpen"
			title="Publish locale pack"
			:description="readyToPublish ? 'This locale is approved and ready to sync.' : 'Resolve QA checks and approve all segments before publishing.'"
		>
			<div class="grid gap-3 text-sm">
				<div class="flex items-center justify-between rounded-lg bg-secondary p-3">
					<span class="text-muted-fg">Locale</span>
					<span class="font-semibold text-canvas-fg">{{ selectedLocaleRecord.label }}</span>
				</div>
				<div class="flex items-center justify-between rounded-lg bg-secondary p-3">
					<span class="text-muted-fg">Approved segments</span>
					<span class="font-semibold text-canvas-fg">{{ approvedCount }} / {{ segments.length }}</span>
				</div>
				<div class="flex items-center justify-between rounded-lg bg-secondary p-3">
					<span class="text-muted-fg">Open QA checks</span>
					<span class="font-semibold" :class="allLocaleChecks.length ? 'text-warning-fg' : 'text-success'">{{ allLocaleChecks.length }}</span>
				</div>
				<p v-if="published" class="rounded-lg border border-success/25 bg-success/10 p-3 text-success">
					Locale payload queued for translation-service sync.
				</p>
			</div>
			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton :disabled="!readyToPublish" @click="publishLocale">
					Publish {{ selectedLocaleRecord.label }}
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
