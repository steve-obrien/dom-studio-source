import { createHash } from 'node:crypto';

const collectionOptions = Object.freeze([
	{ value: 'all', label: 'All assets', description: 'Every active asset in the workspace.' },
	{ value: 'product', label: 'Product', description: 'Interface, launch, and product-story assets.' },
	{ value: 'campaigns', label: 'Campaigns', description: 'Paid, lifecycle, and event creative.' },
	{ value: 'brand', label: 'Brand', description: 'Logos, photography, and approved identity files.' },
	{ value: 'uploads', label: 'Uploads', description: 'Recently ingested files awaiting review.' },
]);

const typeOptions = Object.freeze([
	{ value: 'all', label: 'All file types', description: 'Images, video, and documents.' },
	{ value: 'image', label: 'Images', description: 'JPEG, PNG, and WebP files.' },
	{ value: 'video', label: 'Video', description: 'Motion assets and product clips.' },
	{ value: 'document', label: 'Documents', description: 'PDF and vector source files.' },
]);

const statusOptions = Object.freeze([
	{ value: 'active', label: 'Active assets', description: 'Approved and review-ready files.' },
	{ value: 'approved', label: 'Approved', description: 'Safe to insert into published content.' },
	{ value: 'review', label: 'Needs review', description: 'Missing accessibility or licensing evidence.' },
	{ value: 'archived', label: 'Archived', description: 'Hidden from normal publishing flows.' },
]);

const sortOptions = Object.freeze([
	{ value: 'recent', label: 'Recently updated', description: 'Newest edits and uploads first.' },
	{ value: 'usage', label: 'Most used', description: 'Promote proven publishing assets.' },
	{ value: 'name', label: 'Name', description: 'Sort alphabetically by title.' },
	{ value: 'size', label: 'Largest files', description: 'Find heavy files before publishing.' },
]);

let assets = createInitialAssets();
let assetSequence = 9000;
let receiptSequence = 4100;

/**
 * Returns filters, collection counts, upload constraints, and the active editor.
 *
 * @returns {Record<string, unknown>} Media library bootstrap payload.
 */
export function getMediaAssetLibraryBootstrap() {
	return cloneValue({
		collectionOptions: collectionOptions.map((option) => ({
			...option,
			count: countCollection(option.value),
		})),
		typeOptions,
		statusOptions,
		sortOptions,
		currentUser: {
			name: 'Maya Chen',
			initials: 'MC',
			role: 'Content designer',
		},
		uploadPolicy: {
			accept: 'image/*,video/mp4,.pdf',
			maxFiles: 1,
			maxSizeBytes: 25 * 1024 * 1024,
			processing: ['virus scan', 'metadata extraction', 'duplicate detection'],
		},
		provider: {
			name: 'Atlas Media',
			mode: 'Process-local demo API',
		},
	});
}

/**
 * Lists active or archived assets using server-owned filter and sort rules.
 *
 * @param {Record<string, unknown>} input Query-string values from the API request.
 * @returns {Record<string, unknown>} Filtered asset list and result metadata.
 */
export function listMediaAssets(input = {}) {
	const collection = normalizeOption(input.collection, collectionOptions, 'all');
	const type = normalizeOption(input.type, typeOptions, 'all');
	const status = normalizeOption(input.status, statusOptions, 'active');
	const sort = normalizeOption(input.sort, sortOptions, 'recent');
	const query = normalizeText(input.query, 120).toLowerCase();
	const rows = [...assets.values()]
		.filter((asset) => matchesArchiveState(asset, status))
		.filter((asset) => collection === 'all' || asset.collection === collection)
		.filter((asset) => type === 'all' || assetType(asset) === type)
		.filter((asset) => status === 'active' || status === 'archived' || statusFromAsset(asset) === status)
		.filter((asset) => matchesAssetQuery(asset, query))
		.sort((left, right) => compareAssets(left, right, sort));

	return cloneValue({
		assets: rows.map(serializeAsset),
		meta: {
			collection,
			type,
			status,
			sort,
			query,
			total: rows.length,
			requestedAt: new Date().toISOString(),
		},
	});
}

/**
 * Returns one asset with its publishing metadata and usage evidence.
 *
 * @param {string} assetId Stable asset identifier.
 * @returns {Record<string, unknown>} Asset payload or API error.
 */
export function getMediaAsset(assetId) {
	const asset = assets.get(String(assetId));
	if (!asset) return notFound('Media asset');
	return { asset: cloneValue(serializeAsset(asset)) };
}

/**
 * Updates title, accessibility, licensing, and tag metadata with optimistic locking.
 *
 * @param {string} assetId Stable asset identifier.
 * @param {Record<string, unknown>} input Editable metadata and optimistic revision.
 * @returns {Record<string, unknown>} Updated asset or API error.
 */
export function updateMediaAsset(assetId, input = {}) {
	const asset = assets.get(String(assetId));
	if (!asset) return notFound('Media asset');
	if (asset.archivedAt) return conflict('Restore this asset before editing its metadata.');
	const revisionError = validateRevision(asset, input.revision);
	if (revisionError) return revisionError;
	const title = normalizeText(input.title, 90);
	if (!title) return validation('Enter a clear asset title.');
	const alt = normalizeText(input.alt, 240);
	const license = normalizeText(input.license, 80);
	if (!license) return validation('Choose a licensing state.');
	const tags = normalizeTags(input.tags);

	asset.title = title;
	asset.alt = alt;
	asset.license = license;
	asset.tags = tags;
	asset.status = publishingStatus(asset);
	asset.reviewNote = reviewNoteForAsset(asset);
	asset.revision += 1;
	asset.updatedAt = new Date().toISOString();
	asset.activity.unshift({
		id: `activity-${asset.id}-${asset.revision}`,
		label: 'Metadata updated',
		detail: 'Maya Chen reviewed accessibility, licensing, and search metadata.',
		createdAt: asset.updatedAt,
	});

	return {
		asset: cloneValue(serializeAsset(asset)),
		message: asset.status === 'Approved'
			? 'Metadata saved. This asset is approved for publishing.'
			: `Metadata saved. ${asset.reviewNote}`,
	};
}

/**
 * Simulates a validated upload pipeline and creates a review-ready asset record.
 *
 * @param {Record<string, unknown>} input Browser file metadata and failure controls.
 * @returns {Record<string, unknown>} Uploaded asset or recoverable provider error.
 */
export function uploadMediaAsset(input = {}) {
	if (input.simulateFailure === true) {
		return serviceUnavailable('The malware scanner did not respond. Retry the upload; no asset record was created.');
	}
	const name = normalizeFileName(input.name);
	if (!name) return validation('Choose a file before uploading.');
	const mimeType = normalizeMimeType(input.mimeType, name);
	if (!isSupportedMimeType(mimeType)) return validation('Upload an image, MP4 video, or PDF document.');
	const size = Number(input.size || 0);
	if (!Number.isFinite(size) || size <= 0) return validation('The selected file has no readable size.');
	if (size > 25 * 1024 * 1024) return validation('Files must be 25 MB or smaller.');

	const now = new Date().toISOString();
	const id = `asset-upload-${++assetSequence}`;
	const asset = {
		id,
		name,
		title: titleFromFileName(name),
		collection: 'uploads',
		mimeType,
		size,
		width: mimeType.startsWith('image/') ? 1800 : null,
		height: mimeType.startsWith('image/') ? 1200 : null,
		duration: mimeType.startsWith('video/') ? 28 : null,
		status: 'Review',
		alt: '',
		license: 'Pending review',
		owner: 'Maya Chen',
		usage: 0,
		tags: ['upload'],
		thumbnailUrl: uploadPreviewForMime(mimeType),
		publicUrl: `/media/demo/${id}/${encodeURIComponent(name)}`,
		updatedAt: now,
		createdAt: now,
		revision: 1,
		archivedAt: null,
		reviewNote: mimeType.startsWith('image/')
			? 'Add alt text and confirm the license before publishing.'
			: 'Confirm licensing and accessibility metadata before publishing.',
		placements: [],
		activity: [{
			id: `activity-${id}-1`,
			label: 'Upload processed',
			detail: 'Virus scan passed and technical metadata was extracted.',
			createdAt: now,
		}],
	};
	assets.set(id, asset);

	return {
		asset: cloneValue(serializeAsset(asset)),
		message: 'Upload processed. Review the metadata before publishing.',
		pipeline: {
			virusScan: 'passed',
			duplicateCheck: 'clear',
			metadataExtraction: 'complete',
		},
	};
}

/**
 * Archives one asset and removes it from normal publishing results.
 *
 * @param {string} assetId Stable asset identifier.
 * @param {Record<string, unknown>} input Optimistic revision and audit reason.
 * @returns {Record<string, unknown>} Archived asset or API error.
 */
export function archiveMediaAsset(assetId, input = {}) {
	const asset = assets.get(String(assetId));
	if (!asset) return notFound('Media asset');
	if (asset.archivedAt) return conflict('This asset is already archived.');
	const revisionError = validateRevision(asset, input.revision);
	if (revisionError) return revisionError;
	const reason = normalizeText(input.reason, 160);
	if (!reason) return validation('Add a reason before archiving this asset.');
	asset.archivedAt = new Date().toISOString();
	asset.revision += 1;
	asset.updatedAt = asset.archivedAt;
	asset.activity.unshift({
		id: `activity-${asset.id}-${asset.revision}`,
		label: 'Asset archived',
		detail: reason,
		createdAt: asset.updatedAt,
	});
	return {
		asset: cloneValue(serializeAsset(asset)),
		message: 'Asset archived and removed from publishing results.',
	};
}

/**
 * Restores one archived asset to the active review workflow.
 *
 * @param {string} assetId Stable asset identifier.
 * @param {Record<string, unknown>} input Optimistic revision.
 * @returns {Record<string, unknown>} Restored asset or API error.
 */
export function restoreMediaAsset(assetId, input = {}) {
	const asset = assets.get(String(assetId));
	if (!asset) return notFound('Media asset');
	if (!asset.archivedAt) return conflict('This asset is already active.');
	const revisionError = validateRevision(asset, input.revision);
	if (revisionError) return revisionError;
	asset.archivedAt = null;
	asset.revision += 1;
	asset.updatedAt = new Date().toISOString();
	asset.status = publishingStatus(asset);
	asset.reviewNote = reviewNoteForAsset(asset);
	asset.activity.unshift({
		id: `activity-${asset.id}-${asset.revision}`,
		label: 'Asset restored',
		detail: 'The asset returned to the active media library.',
		createdAt: asset.updatedAt,
	});
	return {
		asset: cloneValue(serializeAsset(asset)),
		message: 'Asset restored to the active media library.',
	};
}

/**
 * Validates a picker selection, records usage, and returns immutable insertion proof.
 *
 * @param {Record<string, unknown>} input Selected asset ids and destination context.
 * @returns {Record<string, unknown>} Insertion receipt or validation error.
 */
export function insertMediaAssets(input = {}) {
	const assetIds = normalizeIds(input.assetIds);
	if (!assetIds.length) return validation('Select at least one asset to insert.');
	if (assetIds.length > 6) return validation('Insert up to six assets at a time.');
	const selected = assetIds.map((id) => assets.get(id)).filter(Boolean);
	if (selected.length !== assetIds.length) return validation('One or more selected assets no longer exist. Refresh the library.');
	const issues = selected.flatMap(selectionIssues);
	if (issues.length) return validation('Some selected assets are not publish-ready.', issues);
	const now = new Date().toISOString();
	const destination = normalizeText(input.destination, 80) || 'Homepage hero';
	for (const asset of selected) {
		asset.usage += 1;
		asset.updatedAt = now;
		asset.placements.unshift(destination);
		asset.placements = asset.placements.slice(0, 4);
		asset.activity.unshift({
			id: `activity-${asset.id}-insert-${receiptSequence}`,
			label: 'Inserted into content',
			detail: destination,
			createdAt: now,
		});
	}
	const receipt = {
		id: `insert-${++receiptSequence}`,
		assetIds,
		destination,
		insertedAt: now,
		checksum: createHash('sha256')
			.update(`${assetIds.join('|')}:${destination}:${now}`)
			.digest('hex')
			.slice(0, 16),
	};
	return {
		receipt,
		assets: cloneValue(selected.map(serializeAsset)),
		message: `${selected.length} asset${selected.length === 1 ? '' : 's'} inserted into ${destination}.`,
	};
}

/**
 * Creates the seeded media library records used by the process-local demo API.
 *
 * @returns {Map<string, Record<string, unknown>>} Seeded asset map.
 */
function createInitialAssets() {
	const rows = [
		createAsset({
			id: 'asset-dashboard-hero',
			name: 'workspace-dashboard.jpg',
			title: 'Workspace dashboard hero',
			collection: 'product',
			mimeType: 'image/jpeg',
			size: 842120,
			width: 2400,
			height: 1600,
			status: 'Approved',
			alt: 'Dashboard screen showing project health metrics and tasks.',
			license: 'Company owned',
			owner: 'Maya Chen',
			usage: 12,
			tags: ['dashboard', 'product', 'launch'],
			photo: 'photo-1551288049-bebda4e38f71',
			placements: ['Homepage hero', 'Launch overview'],
			updatedAt: '2026-08-01T09:52:00.000Z',
		}),
		createAsset({
			id: 'asset-checkout-detail',
			name: 'checkout-detail.jpg',
			title: 'Checkout card detail',
			collection: 'product',
			mimeType: 'image/jpeg',
			size: 618220,
			width: 1800,
			height: 1200,
			status: 'Approved',
			alt: 'Payment review card beside a customer at a checkout counter.',
			license: 'Company owned',
			owner: 'Oscar Reed',
			usage: 8,
			tags: ['checkout', 'commerce'],
			photo: 'photo-1556742049-0cfed4f6a45d',
			placements: ['Checkout review'],
			updatedAt: '2026-08-01T08:42:00.000Z',
		}),
		createAsset({
			id: 'asset-launch-banner',
			name: 'launch-banner.jpg',
			title: 'Launch banner background',
			collection: 'campaigns',
			mimeType: 'image/jpeg',
			size: 1452100,
			width: 3200,
			height: 1400,
			status: 'Approved',
			alt: 'Blue and violet gradient artwork for the summer product launch.',
			license: 'Licensed through 2027',
			owner: 'Growth Studio',
			usage: 19,
			tags: ['launch', 'campaign', 'gradient'],
			photo: 'photo-1557683316-973673baf926',
			placements: ['Summer launch', 'Email header'],
			updatedAt: '2026-07-31T16:18:00.000Z',
		}),
		createAsset({
			id: 'asset-founder-video',
			name: 'founder-intro.mp4',
			title: 'Founder intro clip',
			collection: 'campaigns',
			mimeType: 'video/mp4',
			size: 18200000,
			width: 1920,
			height: 1080,
			duration: 42,
			status: 'Review',
			alt: 'Founder presenting the new workspace release.',
			license: 'Company owned',
			owner: 'Nina Patel',
			usage: 5,
			tags: ['founder', 'video', 'launch'],
			photo: 'photo-1556761175-b413da4baf72',
			placements: ['Launch article'],
			reviewNote: 'Add a caption file before publishing this video.',
			updatedAt: '2026-07-30T14:12:00.000Z',
		}),
		createAsset({
			id: 'asset-partner-logos',
			name: 'partner-logo-pack.pdf',
			title: 'Partner logo pack',
			collection: 'brand',
			mimeType: 'application/pdf',
			size: 246200,
			status: 'Approved',
			alt: 'Approved partner logo package for co-marketing pages.',
			license: 'Partner approved',
			owner: 'Brand Team',
			usage: 26,
			tags: ['logos', 'partners', 'brand'],
			photo: 'photo-1561070791-2526d30994b5',
			placements: ['Partner directory'],
			updatedAt: '2026-07-28T11:05:00.000Z',
		}),
		createAsset({
			id: 'asset-customer-quote',
			name: 'customer-quote.jpg',
			title: 'Customer quote tile',
			collection: 'brand',
			mimeType: 'image/jpeg',
			size: 512880,
			width: 1600,
			height: 1600,
			status: 'Approved',
			alt: 'Team collaborating around a laptop in a bright studio.',
			license: 'Customer approved',
			owner: 'Maya Chen',
			usage: 14,
			tags: ['customer', 'quote', 'team'],
			photo: 'photo-1522202176988-66273c2fd55f',
			placements: ['Customer stories'],
			updatedAt: '2026-07-27T13:45:00.000Z',
		}),
		createAsset({
			id: 'asset-profile-header',
			name: 'profile-header.jpg',
			title: 'Uploaded profile header',
			collection: 'uploads',
			mimeType: 'image/jpeg',
			size: 734240,
			width: 2100,
			height: 900,
			status: 'Review',
			alt: '',
			license: 'Pending review',
			owner: 'Alex Morgan',
			usage: 2,
			tags: ['profile', 'upload'],
			photo: 'photo-1517245386807-bb43f82c33c4',
			placements: [],
			reviewNote: 'Add alt text and confirm the license before publishing.',
			updatedAt: '2026-07-26T10:22:00.000Z',
		}),
		createAsset({
			id: 'asset-empty-state',
			name: 'empty-state.jpg',
			title: 'Empty state illustration',
			collection: 'product',
			mimeType: 'image/jpeg',
			size: 438460,
			width: 1400,
			height: 1000,
			status: 'Approved',
			alt: 'Bright office prepared for a new project workspace.',
			license: 'Company owned',
			owner: 'Oscar Reed',
			usage: 7,
			tags: ['empty-state', 'onboarding'],
			photo: 'photo-1497215728101-856f4ea42174',
			placements: ['Project empty state'],
			updatedAt: '2026-07-24T09:10:00.000Z',
		}),
		createAsset({
			id: 'asset-archived-office',
			name: 'office-v1.jpg',
			title: 'Office photography v1',
			collection: 'brand',
			mimeType: 'image/jpeg',
			size: 912440,
			width: 1800,
			height: 1200,
			status: 'Approved',
			alt: 'Modern office lounge with warm seating.',
			license: 'Company owned',
			owner: 'Brand Team',
			usage: 4,
			tags: ['office', 'archive'],
			photo: 'photo-1497366811353-6870744d04b2',
			placements: [],
			archivedAt: '2026-07-20T12:00:00.000Z',
			updatedAt: '2026-07-20T12:00:00.000Z',
		}),
	];
	return new Map(rows.map((asset) => [asset.id, asset]));
}

/**
 * Normalizes one seeded asset and adds stable operational metadata.
 *
 * @param {Record<string, unknown>} input Seed asset fields.
 * @returns {Record<string, unknown>} Complete asset record.
 */
function createAsset(input) {
	const createdAt = input.createdAt || '2026-07-01T09:00:00.000Z';
	const updatedAt = input.updatedAt || createdAt;
	return {
		duration: null,
		width: null,
		height: null,
		archivedAt: null,
		revision: 1,
		reviewNote: input.status === 'Approved' ? 'Accessibility and licensing checks passed.' : 'Review metadata before publishing.',
		activity: [{
			id: `activity-${input.id}-seed`,
			label: input.status === 'Approved' ? 'Publishing checks passed' : 'Review requested',
			detail: input.reviewNote || (input.status === 'Approved'
				? 'Accessibility and licensing metadata were verified.'
				: 'This asset needs metadata review.'),
			createdAt: updatedAt,
		}],
		createdAt,
		...input,
		thumbnailUrl: unsplashImage(input.photo),
		publicUrl: unsplashImage(input.photo, 1800, 1200),
	};
}

/**
 * Serializes an internal asset into the API contract consumed by the block.
 *
 * @param {Record<string, unknown>} asset Internal asset record.
 * @returns {Record<string, unknown>} Public asset payload.
 */
function serializeAsset(asset) {
	return {
		id: asset.id,
		name: asset.name,
		title: asset.title,
		collection: asset.collection,
		collectionLabel: collectionOptions.find((option) => option.value === asset.collection)?.label || asset.collection,
		type: assetType(asset),
		mimeType: asset.mimeType,
		size: asset.size,
		width: asset.width,
		height: asset.height,
		duration: asset.duration,
		status: asset.archivedAt ? 'Archived' : asset.status,
		alt: asset.alt,
		license: asset.license,
		owner: asset.owner,
		usage: asset.usage,
		tags: [...asset.tags],
		thumbnailUrl: asset.thumbnailUrl,
		publicUrl: asset.publicUrl,
		updatedAt: asset.updatedAt,
		createdAt: asset.createdAt,
		revision: asset.revision,
		archivedAt: asset.archivedAt,
		reviewNote: asset.reviewNote,
		placements: [...asset.placements],
		activity: asset.activity.map((item) => ({ ...item })),
	};
}

/**
 * Returns whether an asset belongs in active or archived results.
 *
 * @param {Record<string, unknown>} asset Asset record.
 * @param {string} status Requested status filter.
 * @returns {boolean} True when archive state matches the query.
 */
function matchesArchiveState(asset, status) {
	return status === 'archived' ? Boolean(asset.archivedAt) : !asset.archivedAt;
}

/**
 * Returns the normalized review status used by status filters.
 *
 * @param {Record<string, unknown>} asset Asset record.
 * @returns {'approved'|'review'} Normalized status key.
 */
function statusFromAsset(asset) {
	return asset.status === 'Approved' ? 'approved' : 'review';
}

/**
 * Returns the user-facing file type bucket for one asset.
 *
 * @param {Record<string, unknown>} asset Asset record.
 * @returns {'image'|'video'|'document'} File type bucket.
 */
function assetType(asset) {
	if (String(asset.mimeType).startsWith('image/')) return 'image';
	if (String(asset.mimeType).startsWith('video/')) return 'video';
	return 'document';
}

/**
 * Checks an asset against a normalized text query.
 *
 * @param {Record<string, unknown>} asset Asset record.
 * @param {string} query Lowercase query text.
 * @returns {boolean} True when searchable metadata matches.
 */
function matchesAssetQuery(asset, query) {
	if (!query) return true;
	return [asset.title, asset.name, asset.owner, asset.alt, asset.license, ...asset.tags]
		.join(' ')
		.toLowerCase()
		.includes(query);
}

/**
 * Sorts two assets using the selected server-owned ordering.
 *
 * @param {Record<string, unknown>} left Left asset.
 * @param {Record<string, unknown>} right Right asset.
 * @param {string} sort Requested sort key.
 * @returns {number} Array sort comparison result.
 */
function compareAssets(left, right, sort) {
	if (sort === 'usage') return right.usage - left.usage;
	if (sort === 'name') return left.title.localeCompare(right.title);
	if (sort === 'size') return right.size - left.size;
	return String(right.updatedAt).localeCompare(String(left.updatedAt));
}

/**
 * Counts active assets in one collection for navigation metadata.
 *
 * @param {string} collection Collection filter value.
 * @returns {number} Active asset count.
 */
function countCollection(collection) {
	return [...assets.values()].filter((asset) => (
		!asset.archivedAt && (collection === 'all' || asset.collection === collection)
	)).length;
}

/**
 * Calculates publishing status after metadata edits.
 *
 * @param {Record<string, unknown>} asset Asset record.
 * @returns {'Approved'|'Review'} Publishing status.
 */
function publishingStatus(asset) {
	if (assetType(asset) === 'image' && !String(asset.alt || '').trim()) return 'Review';
	if (String(asset.license || '').toLowerCase().includes('pending')) return 'Review';
	if (assetType(asset) === 'video' && asset.id === 'asset-founder-video') return 'Review';
	return 'Approved';
}

/**
 * Explains the current publishing readiness of an asset.
 *
 * @param {Record<string, unknown>} asset Asset record.
 * @returns {string} Human-readable review note.
 */
function reviewNoteForAsset(asset) {
	if (assetType(asset) === 'image' && !String(asset.alt || '').trim()) return 'Add alt text before publishing.';
	if (String(asset.license || '').toLowerCase().includes('pending')) return 'Confirm the licensing state before publishing.';
	if (assetType(asset) === 'video' && asset.id === 'asset-founder-video') return 'Add a caption file before publishing this video.';
	return 'Accessibility and licensing checks passed.';
}

/**
 * Returns insertion blockers for a selected asset.
 *
 * @param {Record<string, unknown>} asset Selected asset record.
 * @returns {Array<Record<string, string>>} Blocking issues.
 */
function selectionIssues(asset) {
	const issues = [];
	if (asset.archivedAt) issues.push({ assetId: asset.id, message: `${asset.title} is archived.` });
	if (asset.status !== 'Approved') issues.push({ assetId: asset.id, message: `${asset.title} still needs review.` });
	if (assetType(asset) === 'image' && !String(asset.alt || '').trim()) issues.push({ assetId: asset.id, message: `${asset.title} is missing alt text.` });
	return issues;
}

/**
 * Validates an optimistic revision against the current record.
 *
 * @param {Record<string, unknown>} asset Asset record.
 * @param {unknown} revision Client revision.
 * @returns {Record<string, unknown>|null} Conflict error or null.
 */
function validateRevision(asset, revision) {
	const candidate = Number(revision);
	if (!Number.isInteger(candidate)) return validation('Include the asset revision when saving.');
	if (candidate !== asset.revision) {
		return conflict('This asset changed in another session. Refresh it before saving.', {
			asset: serializeAsset(asset),
		});
	}
	return null;
}

/**
 * Normalizes one select value against a supported option list.
 *
 * @param {unknown} value Candidate value.
 * @param {Array<Record<string, unknown>>} options Supported options.
 * @param {string} fallback Fallback value.
 * @returns {string} Supported value.
 */
function normalizeOption(value, options, fallback) {
	const candidate = String(value || fallback);
	return options.some((option) => option.value === candidate) ? candidate : fallback;
}

/**
 * Normalizes text to a trimmed bounded string.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum length.
 * @returns {string} Normalized text.
 */
function normalizeText(value, maxLength) {
	return String(value || '').trim().slice(0, maxLength);
}

/**
 * Normalizes a file name without allowing path traversal fragments.
 *
 * @param {unknown} value Candidate file name.
 * @returns {string} Safe file name.
 */
function normalizeFileName(value) {
	return normalizeText(value, 140).replace(/[\\/]/g, '-').replace(/^\.+/, '');
}

/**
 * Resolves a MIME type from explicit browser metadata or the file extension.
 *
 * @param {unknown} value Candidate MIME type.
 * @param {string} name Normalized file name.
 * @returns {string} MIME type.
 */
function normalizeMimeType(value, name) {
	const candidate = normalizeText(value, 80).toLowerCase();
	if (candidate) return candidate;
	if (/\.pdf$/i.test(name)) return 'application/pdf';
	if (/\.mp4$/i.test(name)) return 'video/mp4';
	if (/\.png$/i.test(name)) return 'image/png';
	if (/\.webp$/i.test(name)) return 'image/webp';
	return 'image/jpeg';
}

/**
 * Returns whether a MIME type is accepted by the demo upload policy.
 *
 * @param {string} mimeType MIME type.
 * @returns {boolean} True when supported.
 */
function isSupportedMimeType(mimeType) {
	return mimeType.startsWith('image/') || mimeType === 'video/mp4' || mimeType === 'application/pdf';
}

/**
 * Converts a file name into a readable metadata title.
 *
 * @param {string} name File name.
 * @returns {string} Generated title.
 */
function titleFromFileName(name) {
	const stem = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
	return stem ? stem.charAt(0).toUpperCase() + stem.slice(1) : 'Uploaded asset';
}

/**
 * Returns a real photo preview suitable for the simulated upload record.
 *
 * @param {string} mimeType MIME type.
 * @returns {string} Preview image URL.
 */
function uploadPreviewForMime(mimeType) {
	if (mimeType.startsWith('video/')) return unsplashImage('photo-1492724441997-5dc865305da7');
	if (mimeType === 'application/pdf') return unsplashImage('photo-1561070791-2526d30994b5');
	return unsplashImage('photo-1516321318423-f06f85e504b3');
}

/**
 * Builds an Unsplash image URL for realistic demo asset artwork.
 *
 * @param {string} photo Stable Unsplash photo identifier.
 * @param {number} width Requested width.
 * @param {number} height Requested height.
 * @returns {string} Image URL.
 */
function unsplashImage(photo, width = 1000, height = 700) {
	return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&h=${height}&q=82`;
}

/**
 * Normalizes user-supplied tags into a unique bounded list.
 *
 * @param {unknown} value Candidate tag list.
 * @returns {Array<string>} Normalized tags.
 */
function normalizeTags(value) {
	const values = Array.isArray(value) ? value : [];
	return [...new Set(values
		.map((tag) => normalizeText(tag, 32).toLowerCase())
		.filter(Boolean))]
		.slice(0, 8);
}

/**
 * Normalizes selected asset ids into a unique list.
 *
 * @param {unknown} value Candidate id list.
 * @returns {Array<string>} Stable unique ids.
 */
function normalizeIds(value) {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((id) => String(id || '').trim()).filter(Boolean))];
}

/**
 * Creates a structured validation error.
 *
 * @param {string} message Human-readable message.
 * @param {Array<Record<string, unknown>>} details Optional field or asset issues.
 * @returns {Record<string, unknown>} API error payload.
 */
function validation(message, details = []) {
	return { error: message, status: 422, details };
}

/**
 * Creates a structured optimistic-state conflict.
 *
 * @param {string} message Human-readable message.
 * @param {Record<string, unknown>} details Optional current server state.
 * @returns {Record<string, unknown>} API error payload.
 */
function conflict(message, details = {}) {
	return { error: message, status: 409, ...details };
}

/**
 * Creates a not-found API error.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} API error payload.
 */
function notFound(resource) {
	return { error: `${resource} not found.`, status: 404 };
}

/**
 * Creates a recoverable upstream-provider error.
 *
 * @param {string} message Human-readable retry guidance.
 * @returns {Record<string, unknown>} API error payload.
 */
function serviceUnavailable(message) {
	return { error: message, status: 503, retryable: true };
}

/**
 * Produces a JSON-safe deep clone for process-local API responses.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Cloned value.
 */
function cloneValue(value) {
	return JSON.parse(JSON.stringify(value));
}
