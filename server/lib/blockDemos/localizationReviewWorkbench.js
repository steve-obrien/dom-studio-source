import { createHash } from 'node:crypto';

const localeOptions = Object.freeze([
	{ value: 'fr-FR', label: 'French', description: 'France · Camille Laurent', shortLabel: 'FR', reviewer: 'Camille Laurent', initials: 'CL' },
	{ value: 'de-DE', label: 'German', description: 'Germany · Jonas Weber', shortLabel: 'DE', reviewer: 'Jonas Weber', initials: 'JW' },
	{ value: 'es-ES', label: 'Spanish', description: 'Spain · Lucia Romero', shortLabel: 'ES', reviewer: 'Lucia Romero', initials: 'LR' },
	{ value: 'ja-JP', label: 'Japanese', description: 'Japan · Aiko Tanaka', shortLabel: 'JA', reviewer: 'Aiko Tanaka', initials: 'AT' },
]);

const statusOptions = Object.freeze([
	{ value: 'all', label: 'All strings', description: 'Every string in this locale.' },
	{ value: 'needs-review', label: 'Needs review', description: 'Translated strings awaiting approval.' },
	{ value: 'issues', label: 'Has QA issues', description: 'Strings blocked by open checks.' },
	{ value: 'approved', label: 'Approved', description: 'Strings ready for publishing.' },
]);

const glossaryOptions = Object.freeze([
	{ value: 'payment-attempt', label: 'Payment attempt', description: 'Use neutral recovery language and avoid assigning blame.' },
	{ value: 'receipt', label: 'Receipt', description: 'Use the finance-approved customer-facing noun.' },
	{ value: 'tax-id', label: 'Tax ID', description: 'Use the market-specific business identifier.' },
	{ value: 'workspace', label: 'Workspace', description: 'Keep the product noun consistent across activation flows.' },
	{ value: 'upgrade', label: 'Upgrade', description: 'Keep the call to action direct and product-led.' },
	{ value: 'audit-log', label: 'Audit log', description: 'Use the compliance-approved administrative term.' },
]);

const releaseDefinitions = [
	{
		id: 'checkout-2026-08',
		name: 'Checkout release',
		description: 'Payment, receipt, and retry flows',
		dueLabel: 'Ships Aug 06',
		version: 'checkout.2026-08.1',
		appliedTerms: ['payment-attempt', 'receipt', 'tax-id'],
		segments: [
			{
				id: 'payment-confirmed-title',
				key: 'checkout.confirmation.title',
				title: 'Payment confirmation title',
				area: 'Checkout',
				source: 'Your payment is confirmed',
				context: 'Page heading after a successful card authorization. It appears above the receipt summary on desktop and mobile.',
				maxLength: 42,
				glossary: [{ term: 'payment', guidance: 'Use the finance-approved noun for customer-facing checkout flows.' }],
				targets: {
					'fr-FR': 'Votre paiement est confirmé',
					'de-DE': 'Ihre Zahlung wurde bestätigt',
					'es-ES': 'Tu pago está confirmado',
					'ja-JP': 'お支払いが確認されました',
				},
				suggestions: {
					'fr-FR': 'Votre paiement est confirmé',
					'de-DE': 'Ihre Zahlung wurde bestätigt',
					'es-ES': 'Tu pago está confirmado',
					'ja-JP': 'お支払いが確認されました',
				},
			},
			{
				id: 'payment-retry-body',
				key: 'checkout.retry.body',
				title: 'Retry payment message',
				area: 'Checkout',
				source: 'We could not process this payment. Check the card details or try another method.',
				context: 'Shown after a failed authorization when the customer can recover without contacting support.',
				maxLength: 112,
				glossary: [
					{ term: 'try another method', guidance: 'Keep the wording neutral. Do not imply fraud or user error.' },
					{ term: 'card details', guidance: 'Translate as payment-card information, not profile details.' },
				],
				targets: {
					'fr-FR': 'Nous ne pouvons pas traiter ce paiement. Verifiez la carte ou essayez un autre moyen.',
					'de-DE': 'Wir konnten diese Zahlung nicht verarbeiten. Prüfen Sie die Kartendaten oder versuchen Sie eine andere Methode.',
					'es-ES': 'No pudimos procesar este pago. Revisa la tarjeta o prueba otro método.',
					'ja-JP': 'この支払いを処理できませんでした。カード情報を確認するか、別の方法をお試しください。',
				},
				suggestions: {
					'fr-FR': 'Nous n’avons pas pu traiter ce paiement. Vérifiez la carte ou essayez un autre moyen.',
					'de-DE': 'Wir konnten diese Zahlung nicht verarbeiten. Prüfen Sie die Kartendaten oder wählen Sie eine andere Zahlungsmethode.',
					'es-ES': 'No pudimos procesar este pago. Revisa los datos de la tarjeta o prueba otro método de pago.',
					'ja-JP': 'このお支払いを処理できませんでした。カード情報を確認するか、別のお支払い方法をお試しください。',
				},
			},
			{
				id: 'receipt-tax-id-helper',
				key: 'receipt.taxId.helper',
				title: 'Tax ID helper text',
				area: 'Receipt',
				source: 'Add a tax ID if this receipt should include business billing details.',
				context: 'Optional helper text in receipt settings before a customer downloads an invoice.',
				maxLength: 96,
				glossary: [{ term: 'tax ID', guidance: 'Use the market-specific business tax identifier.' }],
				targets: {
					'fr-FR': 'Ajoutez un identifiant fiscal pour afficher les informations de facturation de l’entreprise.',
					'de-DE': 'Fügen Sie eine Steuer-ID hinzu, wenn der Beleg Geschäftsdaten enthalten soll.',
					'es-ES': 'Añade un NIF si el recibo debe incluir los datos de facturación de la empresa.',
					'ja-JP': '領収書に事業者の請求情報を含める場合は、税務IDを追加してください。',
				},
				suggestions: {
					'fr-FR': 'Ajoutez un identifiant fiscal pour afficher les informations de facturation de l’entreprise.',
					'de-DE': 'Fügen Sie eine Steuer-ID hinzu, wenn der Beleg Geschäftsdaten enthalten soll.',
					'es-ES': 'Añade un NIF si el recibo debe incluir los datos de facturación de la empresa.',
					'ja-JP': '領収書に事業者の請求情報を含める場合は、税務IDを追加してください。',
				},
			},
			{
				id: 'receipt-download-action',
				key: 'receipt.download.action',
				title: 'Download receipt action',
				area: 'Receipt',
				source: 'Download receipt',
				context: 'Primary action shown beneath the order total after payment completes.',
				maxLength: 28,
				glossary: [{ term: 'receipt', guidance: 'Use the finance-approved noun, not invoice.' }],
				targets: {
					'fr-FR': 'Télécharger le reçu',
					'de-DE': 'Beleg herunterladen',
					'es-ES': 'Descargar recibo',
					'ja-JP': '領収書をダウンロード',
				},
				suggestions: {},
			},
			{
				id: 'upgrade-receipts-action',
				key: 'upgrade.receipts.action',
				title: 'Custom receipts upgrade',
				area: 'Paywall',
				source: 'Upgrade to unlock custom receipts',
				context: 'Button label in a compact paywall shown inside receipt settings.',
				maxLength: 38,
				glossary: [{ term: 'upgrade', guidance: 'Keep the call to action direct and product-led.' }],
				targets: {
					'fr-FR': 'Passez au niveau supérieur',
					'de-DE': 'Upgrade für eigene Belege',
					'es-ES': 'Mejora para recibos personalizados',
					'ja-JP': 'カスタム領収書を利用する',
				},
				suggestions: {},
			},
		],
	},
	{
		id: 'activation-2026-08',
		name: 'Activation refresh',
		description: 'Onboarding, invites, and workspace setup',
		dueLabel: 'Ships Aug 12',
		version: 'activation.2026-08.0',
		appliedTerms: ['workspace'],
		segments: [
			createSimpleSegment('workspace-name', 'activation.workspace.name', 'Workspace name', 'Name your workspace', 'Setup', 48),
			createSimpleSegment('invite-team', 'activation.invite.title', 'Invite teammates title', 'Invite your team', 'Invites', 42),
			createSimpleSegment('first-project', 'activation.project.action', 'Create project action', 'Create your first project', 'Setup', 44),
			createSimpleSegment('skip-setup', 'activation.skip.action', 'Skip setup action', 'I will do this later', 'Setup', 38),
		],
	},
	{
		id: 'audit-2026-08',
		name: 'Admin audit pack',
		description: 'Security logs and compliance copy',
		dueLabel: 'Ships Aug 18',
		version: 'audit.2026-08.0',
		appliedTerms: ['audit-log'],
		segments: [
			createSimpleSegment('audit-title', 'audit.title', 'Audit log title', 'Audit log', 'Security', 32),
			createSimpleSegment('export-action', 'audit.export.action', 'Export action', 'Export audit events', 'Security', 38),
			createSimpleSegment('retention-note', 'audit.retention.note', 'Retention note', 'Events are retained for 365 days.', 'Compliance', 68),
		],
	},
];

let releases = createInitialReleases();
let activitySequence = 0;
let publicationSequence = 8200;

/**
 * Returns release, locale, filter, glossary, and reviewer options for the workbench.
 *
 * @returns {Record<string, unknown>} Localization workbench bootstrap payload.
 */
export function getLocalizationReviewBootstrap() {
	return cloneValue({
		releases: [...releases.values()].map(serializeReleaseSummary),
		localeOptions,
		statusOptions,
		glossaryOptions,
		currentUser: { name: 'Camille Laurent', initials: 'CL', role: 'French reviewer' },
		provider: { name: 'Atlas Translate', mode: 'Demo translation service' },
	});
}

/**
 * Returns one release localized for the requested reviewer locale.
 *
 * @param {string} releaseId Release identifier.
 * @param {string} locale Requested locale code.
 * @returns {Record<string, unknown>} Release payload or API error.
 */
export function getLocalizationReviewRelease(releaseId, locale = 'fr-FR') {
	const release = releases.get(String(releaseId));
	if (!release) return notFound('Localization release');
	const normalizedLocale = normalizeLocale(locale);
	return { release: serializeRelease(release, normalizedLocale) };
}

/**
 * Saves one translated string and reruns server-owned quality checks.
 *
 * @param {string} releaseId Release identifier.
 * @param {string} segmentId Segment identifier.
 * @param {Record<string, unknown>} input Translation, locale, note, and optimistic revision.
 * @returns {Record<string, unknown>} Updated release or API error.
 */
export function saveLocalizationTranslation(releaseId, segmentId, input = {}) {
	const context = findContext(releaseId, segmentId, input.locale);
	if (context.error) return context;
	const revisionError = validateRevision(context.release, input.revision);
	if (revisionError) return revisionError;
	if (context.localeState.publication) return conflict('Published locale packs are locked. Create a new release to change this translation.');
	const target = normalizeText(input.target, 600);
	if (!target) return validation('Enter a translation before saving.');

	context.segmentState.target = target;
	context.segmentState.note = normalizeText(input.note, 300);
	context.segmentState.status = 'needs-review';
	context.segmentState.version += 1;
	context.segmentState.updatedAt = new Date().toISOString();
	context.segmentState.checks = runQualityChecks(context.segment, context.locale, target);
	commitRelease(context.release, 'Saved translation', `${context.segment.key} · ${context.locale}`);
	return {
		release: serializeRelease(context.release, context.locale),
		message: context.segmentState.checks.length
			? `Translation saved with ${context.segmentState.checks.length} open quality check${context.segmentState.checks.length === 1 ? '' : 's'}.`
			: 'Translation saved and quality checks passed.',
	};
}

/**
 * Returns a translation-memory suggestion without mutating the saved target.
 *
 * @param {string} releaseId Release identifier.
 * @param {string} segmentId Segment identifier.
 * @param {Record<string, unknown>} input Locale and optional provider failure simulation.
 * @returns {Record<string, unknown>} Suggested translation or provider error.
 */
export function requestLocalizationSuggestion(releaseId, segmentId, input = {}) {
	const context = findContext(releaseId, segmentId, input.locale);
	if (context.error) return context;
	if (input.simulateFailure === true) return { error: 'Translation memory is temporarily unavailable. Your saved work is unaffected.', status: 503 };
	const suggestion = context.segment.suggestions[context.locale]
		|| context.segmentState.target
		|| context.segment.source;
	return {
		suggestion: {
			target: suggestion,
			confidence: context.segment.suggestions[context.locale] ? 94 : 78,
			source: context.segment.suggestions[context.locale] ? 'Approved translation memory' : 'Closest locale match',
		},
	};
}

/**
 * Resolves a reviewer-owned quality check for one segment.
 *
 * @param {string} releaseId Release identifier.
 * @param {string} segmentId Segment identifier.
 * @param {string} checkId Quality-check identifier.
 * @param {Record<string, unknown>} input Locale and optimistic revision.
 * @returns {Record<string, unknown>} Updated release or API error.
 */
export function resolveLocalizationCheck(releaseId, segmentId, checkId, input = {}) {
	const context = findContext(releaseId, segmentId, input.locale);
	if (context.error) return context;
	const revisionError = validateRevision(context.release, input.revision);
	if (revisionError) return revisionError;
	const check = context.segmentState.checks.find((item) => item.id === String(checkId));
	if (!check) return notFound('Quality check');
	if (!check.resolvable) return validation('Update and save the translation to resolve this automated check.');
	check.resolved = true;
	check.resolvedAt = new Date().toISOString();
	commitRelease(context.release, 'Resolved reviewer check', `${context.segment.key} · ${check.title}`);
	return {
		release: serializeRelease(context.release, context.locale),
		message: 'Reviewer check resolved.',
	};
}

/**
 * Approves a saved translation after all server-owned checks pass.
 *
 * @param {string} releaseId Release identifier.
 * @param {string} segmentId Segment identifier.
 * @param {Record<string, unknown>} input Locale and optimistic revision.
 * @returns {Record<string, unknown>} Updated release or API error.
 */
export function approveLocalizationSegment(releaseId, segmentId, input = {}) {
	const context = findContext(releaseId, segmentId, input.locale);
	if (context.error) return context;
	const revisionError = validateRevision(context.release, input.revision);
	if (revisionError) return revisionError;
	if (!context.segmentState.target.trim()) return validation('Save a translation before approving this segment.');
	const openChecks = context.segmentState.checks.filter((check) => !check.resolved);
	if (openChecks.length) return validation(`Resolve ${openChecks.length} open quality check${openChecks.length === 1 ? '' : 's'} before approval.`);
	context.segmentState.status = 'approved';
	context.segmentState.approvedAt = new Date().toISOString();
	context.segmentState.approvedBy = reviewerForLocale(context.locale).reviewer;
	commitRelease(context.release, 'Approved translation', `${context.segment.key} · ${context.locale}`);
	return {
		release: serializeRelease(context.release, context.locale),
		message: 'Translation approved and the next open string is ready.',
	};
}

/**
 * Saves release-level reviewer notes and applied glossary terms.
 *
 * @param {string} releaseId Release identifier.
 * @param {Record<string, unknown>} input Locale, terms, note, and optimistic revision.
 * @returns {Record<string, unknown>} Updated release or API error.
 */
export function saveLocalizationHandoff(releaseId, input = {}) {
	const release = releases.get(String(releaseId));
	if (!release) return notFound('Localization release');
	const locale = normalizeLocale(input.locale);
	const revisionError = validateRevision(release, input.revision);
	if (revisionError) return revisionError;
	const allowedTerms = new Set(glossaryOptions.map((term) => term.value));
	release.handoff[locale] = {
		appliedTerms: Array.isArray(input.appliedTerms)
			? [...new Set(input.appliedTerms.map(String).filter((term) => allowedTerms.has(term)))].slice(0, 12)
			: [],
		reviewerNote: normalizeText(input.reviewerNote, 500),
		updatedAt: new Date().toISOString(),
	};
	commitRelease(release, 'Saved locale handoff', `${locale} · ${release.handoff[locale].appliedTerms.length} glossary terms`);
	return {
		release: serializeRelease(release, locale),
		message: 'Locale handoff notes saved.',
	};
}

/**
 * Publishes a complete locale pack and returns immutable synchronization proof.
 *
 * @param {string} releaseId Release identifier.
 * @param {Record<string, unknown>} input Locale, acknowledgement, and optimistic revision.
 * @returns {Record<string, unknown>} Published release, receipt, or readiness error.
 */
export function publishLocalizationLocale(releaseId, input = {}) {
	const release = releases.get(String(releaseId));
	if (!release) return notFound('Localization release');
	const locale = normalizeLocale(input.locale);
	const localeState = release.locales[locale];
	if (localeState.publication) {
		return {
			release: serializeRelease(release, locale),
			receipt: cloneValue(localeState.publication),
			message: 'This locale pack is already published.',
		};
	}
	const revisionError = validateRevision(release, input.revision);
	if (revisionError) return revisionError;
	const readiness = calculateReadiness(release, locale);
	if (!readiness.ready) {
		return {
			error: 'Approve every translation and resolve all quality checks before publishing.',
			status: 422,
			readiness,
		};
	}
	if (input.acknowledged !== true) return validation('Confirm that the locale pack and reviewer handoff are ready to sync.');
	const publishedAt = new Date().toISOString();
	const checksum = createHash('sha256')
		.update(`${release.id}:${locale}:${release.revision}:${publishedAt}:${Object.values(localeState.segments).map((state) => state.target).join('|')}`)
		.digest('hex');
	localeState.publication = {
		id: `loc_${++publicationSequence}`,
		status: 'published',
		provider: 'Atlas Translate',
		bundle: `${release.version}.${locale}`,
		publishedAt,
		checksum,
		files: [`${locale}.json`, `${locale}.po`],
	};
	commitRelease(release, 'Published locale pack', `${locale} · ${localeState.publication.bundle}`);
	return {
		release: serializeRelease(release, locale),
		receipt: cloneValue(localeState.publication),
		message: 'Locale bundle published and synchronized successfully.',
	};
}

/**
 * Creates the complete process-local release map used by the demo API.
 *
 * @returns {Map<string, Record<string, unknown>>} Seeded releases.
 */
function createInitialReleases() {
	return new Map(releaseDefinitions.map((definition) => {
		const release = {
			...cloneValue(definition),
			revision: 1,
			locales: {},
			handoff: {},
			activity: [
				{ id: `${definition.id}-2`, actor: 'Atlas Translate', action: 'Imported translation memory', detail: `${definition.segments.length} strings matched against the approved catalogue.`, time: 'Today at 09:12' },
				{ id: `${definition.id}-1`, actor: 'Mina Cook', action: 'Created localization release', detail: `${definition.name} is ready for reviewer assignment.`, time: 'Yesterday' },
			],
		};
		for (const locale of localeOptions) {
			release.locales[locale.value] = createLocaleState(release, locale.value);
			release.handoff[locale.value] = {
				appliedTerms: [...definition.appliedTerms],
				reviewerNote: '',
				updatedAt: '',
			};
		}
		return [release.id, release];
	}));
}

/**
 * Creates one locale's translation, approval, and quality state.
 *
 * @param {Record<string, unknown>} release Release definition.
 * @param {string} locale Locale code.
 * @returns {Record<string, unknown>} Locale state.
 */
function createLocaleState(release, locale) {
	const segments = {};
	release.segments.forEach((segment, index) => {
		const target = segment.targets[locale] || segment.source;
		const needsReview = release.id === 'checkout-2026-08' && locale === 'fr-FR'
			? ['payment-retry-body', 'receipt-tax-id-helper'].includes(segment.id)
			: index >= Math.max(1, release.segments.length - 2);
		segments[segment.id] = {
			target,
			status: needsReview ? 'needs-review' : 'approved',
			version: 1,
			note: '',
			updatedAt: '2026-08-01T08:54:00.000Z',
			approvedAt: needsReview ? '' : '2026-08-01T08:52:00.000Z',
			approvedBy: needsReview ? '' : reviewerForLocale(locale).reviewer,
			checks: runQualityChecks(segment, locale, target),
		};
	});
	return { segments, publication: null };
}

/**
 * Creates a compact release segment for secondary demo releases.
 *
 * @param {string} id Segment identifier.
 * @param {string} key Translation key.
 * @param {string} title Reviewer-facing title.
 * @param {string} source Source copy.
 * @param {string} area Product area.
 * @param {number} maxLength Character limit.
 * @returns {Record<string, unknown>} Segment definition.
 */
function createSimpleSegment(id, key, title, source, area, maxLength) {
	return {
		id,
		key,
		title,
		source,
		area,
		maxLength,
		context: `${title} used in the ${area.toLowerCase()} product flow.`,
		glossary: [],
		targets: Object.fromEntries(localeOptions.map((locale) => [locale.value, source])),
		suggestions: {},
	};
}

/**
 * Runs deterministic server-owned checks against a translated string.
 *
 * @param {Record<string, unknown>} segment Segment definition.
 * @param {string} locale Locale code.
 * @param {string} target Translated string.
 * @returns {Array<Record<string, unknown>>} Open quality checks.
 */
function runQualityChecks(segment, locale, target) {
	const checks = [];
	if (target.length > segment.maxLength) {
		checks.push(createCheck('length', 'Character limit exceeded', `${target.length} characters exceeds the ${segment.maxLength}-character limit.`, 'High', false));
	}
	const placeholders = [...segment.source.matchAll(/\{[^}]+\}/g)].map((match) => match[0]);
	const missingPlaceholder = placeholders.find((placeholder) => !target.includes(placeholder));
	if (missingPlaceholder) {
		checks.push(createCheck('placeholder', 'Placeholder missing', `Keep ${missingPlaceholder} unchanged so runtime values can render.`, 'High', false));
	}
	if (locale === 'fr-FR' && /\b(Verifiez|confirme|recu)\b/i.test(target)) {
		checks.push(createCheck('orthography', 'French accents missing', 'Replace ASCII fallback characters with the approved accented spelling.', 'High', false));
	}
	if (locale === 'de-DE' && /\b(bestaetigt|Pruefen|Fuegen|Geschaeft)\b/i.test(target)) {
		checks.push(createCheck('orthography', 'German characters missing', 'Replace ASCII fallback characters before release.', 'High', false));
	}
	return checks;
}

/**
 * Creates one quality-check record.
 *
 * @param {string} id Check identifier.
 * @param {string} title Check title.
 * @param {string} detail Remediation guidance.
 * @param {string} severity Severity label.
 * @param {boolean} resolvable Whether a reviewer can resolve without editing.
 * @returns {Record<string, unknown>} Quality check.
 */
function createCheck(id, title, detail, severity, resolvable) {
	return { id, title, detail, severity, resolvable, resolved: false, resolvedAt: '' };
}

/**
 * Finds release, locale, segment definition, and locale state for a mutation.
 *
 * @param {string} releaseId Release identifier.
 * @param {string} segmentId Segment identifier.
 * @param {string} locale Locale code.
 * @returns {Record<string, unknown>} Mutation context or API error.
 */
function findContext(releaseId, segmentId, locale) {
	const release = releases.get(String(releaseId));
	if (!release) return notFound('Localization release');
	const normalizedLocale = normalizeLocale(locale);
	const segment = release.segments.find((item) => item.id === String(segmentId));
	if (!segment) return notFound('Translation segment');
	return {
		release,
		locale: normalizedLocale,
		localeState: release.locales[normalizedLocale],
		segment,
		segmentState: release.locales[normalizedLocale].segments[segment.id],
	};
}

/**
 * Serializes one release and selected locale into a client-safe workflow payload.
 *
 * @param {Record<string, unknown>} release Internal release state.
 * @param {string} locale Selected locale.
 * @returns {Record<string, unknown>} Serialized release.
 */
function serializeRelease(release, locale) {
	const selectedLocaleState = release.locales[locale];
	return cloneValue({
		id: release.id,
		name: release.name,
		description: release.description,
		dueLabel: release.dueLabel,
		version: release.version,
		revision: release.revision,
		locale,
		localeSummaries: localeOptions.map((option) => calculateLocaleSummary(release, option.value)),
		segments: release.segments.map((segment) => ({
			...segment,
			targets: undefined,
			suggestions: undefined,
			...selectedLocaleState.segments[segment.id],
			checks: selectedLocaleState.segments[segment.id].checks.filter((check) => !check.resolved),
		})),
		handoff: release.handoff[locale],
		activity: release.activity.slice(0, 20),
		readiness: calculateReadiness(release, locale),
		publication: selectedLocaleState.publication,
	});
}

/**
 * Serializes one release for the top-level rich select.
 *
 * @param {Record<string, unknown>} release Internal release state.
 * @returns {Record<string, unknown>} Release summary.
 */
function serializeReleaseSummary(release) {
	return {
		value: release.id,
		label: release.name,
		description: release.description,
		meta: `${release.segments.length} strings · ${release.dueLabel}`,
	};
}

/**
 * Calculates reviewer progress for one locale.
 *
 * @param {Record<string, unknown>} release Internal release state.
 * @param {string} locale Locale code.
 * @returns {Record<string, unknown>} Locale progress summary.
 */
function calculateLocaleSummary(release, locale) {
	const states = Object.values(release.locales[locale].segments);
	const approved = states.filter((state) => state.status === 'approved').length;
	const issues = states.reduce((total, state) => total + state.checks.filter((check) => !check.resolved).length, 0);
	const option = reviewerForLocale(locale);
	return {
		...option,
		approved,
		issues,
		total: states.length,
		progress: Math.round((approved / Math.max(states.length, 1)) * 100),
		published: Boolean(release.locales[locale].publication),
	};
}

/**
 * Calculates publish readiness and its individual server-owned gates.
 *
 * @param {Record<string, unknown>} release Internal release state.
 * @param {string} locale Locale code.
 * @returns {Record<string, unknown>} Readiness summary.
 */
function calculateReadiness(release, locale) {
	const summary = calculateLocaleSummary(release, locale);
	const checks = [
		{ id: 'translations', label: 'Every string has a saved translation', ready: Object.values(release.locales[locale].segments).every((state) => state.target.trim().length > 0) },
		{ id: 'qa', label: 'All quality checks are resolved', ready: summary.issues === 0 },
		{ id: 'approval', label: 'Every string is approved', ready: summary.approved === summary.total },
		{ id: 'handoff', label: 'At least one glossary term is attached', ready: release.handoff[locale].appliedTerms.length > 0 },
	];
	return {
		ready: checks.every((check) => check.ready),
		checks,
		approved: summary.approved,
		issues: summary.issues,
		total: summary.total,
	};
}

/**
 * Validates an optimistic client revision.
 *
 * @param {Record<string, unknown>} release Internal release state.
 * @param {unknown} revision Client revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateRevision(release, revision) {
	if (Number(revision) === release.revision) return null;
	return {
		error: 'This localization release changed in another session. Reload the latest version before saving.',
		status: 409,
		release: serializeRelease(release, 'fr-FR'),
	};
}

/**
 * Commits a release mutation and records an activity event.
 *
 * @param {Record<string, unknown>} release Internal release state.
 * @param {string} action Activity title.
 * @param {string} detail Activity detail.
 * @returns {void}
 */
function commitRelease(release, action, detail) {
	release.revision += 1;
	release.activity.unshift({
		id: `localization-activity-${++activitySequence}`,
		actor: action === 'Published locale pack' ? 'Atlas Translate' : 'Camille Laurent',
		action,
		detail,
		time: 'Just now',
	});
}

/**
 * Returns a supported locale code with a safe French fallback.
 *
 * @param {unknown} locale Candidate locale.
 * @returns {string} Supported locale code.
 */
function normalizeLocale(locale) {
	const value = String(locale || 'fr-FR');
	return localeOptions.some((option) => option.value === value) ? value : 'fr-FR';
}

/**
 * Returns reviewer metadata for a locale.
 *
 * @param {string} locale Locale code.
 * @returns {Record<string, unknown>} Reviewer option.
 */
function reviewerForLocale(locale) {
	return localeOptions.find((option) => option.value === locale) || localeOptions[0];
}

/**
 * Normalizes user-authored text to a bounded single value.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Creates a standard not-found API result.
 *
 * @param {string} label Missing record label.
 * @returns {Record<string, unknown>} API error.
 */
function notFound(label) {
	return { error: `${label} not found.`, status: 404 };
}

/**
 * Creates a standard validation API result.
 *
 * @param {string} error Validation message.
 * @returns {Record<string, unknown>} API error.
 */
function validation(error) {
	return { error, status: 422 };
}

/**
 * Creates a standard conflict API result.
 *
 * @param {string} error Conflict message.
 * @returns {Record<string, unknown>} API error.
 */
function conflict(error) {
	return { error, status: 409 };
}

/**
 * Creates a detached JSON-safe copy of a demo payload.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Cloned value.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
