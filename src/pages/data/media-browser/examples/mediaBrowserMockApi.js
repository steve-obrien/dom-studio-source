let idCounter = 1000;

/**
 * Creates an isolated in-memory API that behaves like a server-backed media library.
 *
 * @returns {Record<string, Function>} API methods used by the Pinia demo store.
 */
export function createMediaBrowserMockApi() {
	const state = createInitialState();

	/**
	 * Lists the immediate children for a folder path.
	 *
	 * @param {{ rootId: string, path: string }} request Folder read request.
	 * @returns {Promise<Record<string, unknown>>} Folder response.
	 */
	async function listFolder(request) {
		await wait(260);
		const root = state.media.find((item) => item.ulid === request.rootId && item.type === 'root') || state.media[0];
		const path = normalizePath(request.path || '/');
		const folder = findFolderByPath(state, root.ulid, path) || root;
		const data = state.media
			.filter((item) => item.parent_id === folder.ulid)
			.map((item) => hydrateMediaItem(state, item))
			.sort(compareMediaRows);

		return {
			folder: hydrateMediaItem(state, folder),
			data,
			breadcrumbs: breadcrumbsForPath(state, root.ulid, path),
			meta: {
				rootId: root.ulid,
				path,
				total: data.length,
				requestedAt: new Date().toISOString(),
			},
		};
	}

	/**
	 * Creates a new folder under a parent folder.
	 *
	 * @param {{ rootId: string, parentId: string, path: string, name: string, tempUlid?: string }} request Create request.
	 * @returns {Promise<Record<string, unknown>>} Created folder response.
	 */
	async function createFolder(request) {
		await wait(360);
		const parent = state.media.find((item) => item.ulid === request.parentId) || findFolderByPath(state, request.rootId, request.path);
		const name = uniqueChildName(state, parent.ulid, request.name || 'New folder');
		const row = {
			ulid: request.tempUlid || nextId('media'),
			type: 'dir',
			path: joinPath(parent.path, name),
			parent_id: parent.ulid,
			root_id: request.rootId,
			file_uuid: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		state.media.push(row);

		return {
			data: hydrateMediaItem(state, row),
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'create-folder',
			},
		};
	}

	/**
	 * Renames a media row and rewrites descendant paths for folders.
	 *
	 * @param {{ ulid: string, name: string }} request Rename request.
	 * @returns {Promise<Record<string, unknown>>} Updated media response.
	 */
	async function renameMedia(request) {
		await wait(320);
		const row = state.media.find((item) => item.ulid === request.ulid);
		if (!row) throw new Error('Media row not found.');

		const previousPath = row.path;
		const parent = state.media.find((item) => item.ulid === row.parent_id);
		const nextName = uniqueChildName(state, row.parent_id, request.name || pathName(row.path), row.ulid);
		row.path = joinPath(parent?.path || '/', nextName);
		row.updatedAt = new Date().toISOString();

		if (row.type === 'file' && row.file_uuid) {
			const file = state.files.find((record) => record.ulid === row.file_uuid);
			if (file) file.name = nextName;
		}

		if (row.type === 'dir') updateDescendantPaths(state, row, previousPath);

		return {
			data: hydrateMediaItem(state, row),
			descendants: state.media
				.filter((item) => item.path.startsWith(`${row.path}/`))
				.map((item) => hydrateMediaItem(state, item)),
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'rename',
			},
		};
	}

	/**
	 * Moves media rows into another folder.
	 *
	 * @param {{ ulids: Array<string>, targetParentId: string }} request Move request.
	 * @returns {Promise<Record<string, unknown>>} Updated rows response.
	 */
	async function moveMedia(request) {
		await wait(380);
		const target = state.media.find((item) => item.ulid === request.targetParentId && ['root', 'dir'].includes(item.type));
		if (!target) throw new Error('Target folder not found.');

		const moved = [];
		for (const ulid of request.ulids || []) {
			const row = state.media.find((item) => item.ulid === ulid);
			if (!row || row.ulid === target.ulid || target.path.startsWith(`${row.path}/`)) continue;
			const previousPath = row.path;
			const name = uniqueChildName(state, target.ulid, pathName(row.path), row.ulid);
			row.parent_id = target.ulid;
			row.path = joinPath(target.path, name);
			row.updatedAt = new Date().toISOString();
			if (row.type === 'dir') updateDescendantPaths(state, row, previousPath);
			moved.push(hydrateMediaItem(state, row));
		}

		return {
			data: moved,
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'move',
				targetParentId: target.ulid,
			},
		};
	}

	/**
	 * Updates metadata on a joined file row.
	 *
	 * @param {{ fileUuid: string, meta: Record<string, unknown> }} request Metadata request.
	 * @returns {Promise<Record<string, unknown>>} Updated file response.
	 */
	async function updateFileMeta(request) {
		await wait(280);
		const file = state.files.find((record) => record.ulid === request.fileUuid);
		if (!file) throw new Error('File row not found.');
		file.meta = {
			...(file.meta || {}),
			...(request.meta || {}),
		};
		file.updatedAt = new Date().toISOString();

		return {
			data: { ...file },
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'update-file-meta',
			},
		};
	}

	/**
	 * Emulates a modern chunk upload batch and creates media rows on completion.
	 *
	 * @param {{ rootId: string, parentId: string, path: string, files: Array<Record<string, unknown>>, onProgress?: Function }} request Upload request.
	 * @returns {Promise<Record<string, unknown>>} Upload completion response.
	 */
	async function uploadBatch(request) {
		const files = Array.isArray(request.files) ? request.files : [];
		for (let step = 1; step <= 10; step += 1) {
			await wait(110);
			request.onProgress?.({
				overall: step * 10,
				files: files.map((file, index) => ({
					name: file.name,
					tempUlid: file.tempUlid,
					progress: Math.min(100, step * 10 + ((index % 3) * 3)),
				})),
			});
		}

		const parent = state.media.find((item) => item.ulid === request.parentId) || findFolderByPath(state, request.rootId, request.path);
		const created = [];
		for (const record of files) {
			const createdRow = createUploadedFile(state, request.rootId, parent, record);
			created.push(hydrateMediaItem(state, createdRow));
		}

		const visible = state.media
			.filter((item) => item.parent_id === parent.ulid)
			.map((item) => hydrateMediaItem(state, item))
			.sort(compareMediaRows);

		return {
			data: created,
			visible,
			meta: {
				requestedAt: new Date().toISOString(),
				action: 'upload-batch',
				total: files.length,
			},
		};
	}

	return {
		listFolder,
		createFolder,
		renameMedia,
		moveMedia,
		updateFileMeta,
		uploadBatch,
	};
}

/**
 * Creates the initial media and file rows for the demo.
 *
 * @returns {{ media: Array<Record<string, unknown>>, files: Array<Record<string, unknown>> }} Mock database state.
 */
function createInitialState() {
	const root = {
		ulid: 'media_root_brand',
		type: 'root',
		path: '/',
		parent_id: null,
		root_id: 'media_root_brand',
		file_uuid: null,
		createdAt: '2026-06-01T10:00:00.000Z',
		updatedAt: '2026-06-01T10:00:00.000Z',
	};
	const folders = [
		createFolderRow('media_images', 'Images', root.ulid, root.ulid),
		createFolderRow('media_documents', 'Documents', root.ulid, root.ulid),
		createFolderRow('media_campaign', 'Campaign', root.ulid, 'media_images', '/Images'),
		createFolderRow('media_brand', 'Brand assets', root.ulid, 'media_images', '/Images'),
		createFolderRow('media_people', 'People', root.ulid, 'media_images', '/Images'),
		createFolderRow('media_spaces', 'Office spaces', root.ulid, 'media_images', '/Images'),
		createFolderRow('media_events', 'Event photography', root.ulid, 'media_images', '/Images'),
	];
	const heroImage = unsplashImage('photo-1497366754035-f200968a6e72', 1600, 900);
	const productImage = unsplashImage('photo-1518005020951-eccb494ad742', 1400, 900);
	const campaignImage = unsplashImage('photo-1500530855697-b586d89ba3ee', 1400, 900);
	const galleryImages = createSeedImageRecords([
		{ id: 'file_workspace_planning', name: 'workspace-planning.jpg', photo: 'photo-1556761175-b413da4baf72', size: 734210, alt: 'Team planning campaign work around a table' },
		{ id: 'file_editorial_portrait', name: 'editorial-portrait.jpg', photo: 'photo-1500648767791-00dcc994a43e', size: 428940, alt: 'Editorial portrait with soft studio light' },
		{ id: 'file_studio_detail', name: 'studio-detail-shot.jpg', photo: 'photo-1518005020951-eccb494ad742', size: 512340, alt: 'Detailed product surface in a studio setting' },
		{ id: 'file_office_lounge', name: 'office-lounge.jpg', photo: 'photo-1497366811353-6870744d04b2', size: 912440, alt: 'Modern office lounge with warm seating' },
		{ id: 'file_retail_display', name: 'retail-display-long-name-example.jpg', photo: 'photo-1441986300917-64674bd600d8', size: 835120, alt: 'Retail display with clothing rails and natural light' },
		{ id: 'file_architecture_corner', name: 'architecture-corner.jpg', photo: 'photo-1494526585095-c41746248156', size: 688450, alt: 'Bright architectural interior corner' },
		{ id: 'file_workshop_notes', name: 'workshop-notes.jpg', photo: 'photo-1516321318423-f06f85e504b3', size: 492670, alt: 'Workshop notebook beside a laptop' },
		{ id: 'file_installation_view', name: 'installation-view.jpg', photo: 'photo-1511818966892-d7d671e672a2', size: 743180, alt: 'Interior installation view with soft lighting' },
	], 1400, 900);
	const files = [
		createFileRow('file_hero', 'hero-image.jpg', 'image/jpeg', 842120, heroImage, { alt: 'Sunlit workspace with product planning materials', width: 1600, height: 900 }, heroImage),
		createFileRow('file_product', 'product-shot.png', 'image/png', 412880, productImage, { alt: 'Architectural product composition with warm light', width: 1400, height: 900 }, productImage),
		createFileRow('file_guidelines', 'brand-guidelines.pdf', 'application/pdf', 2462022, '', { pages: 28 }, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'),
		createFileRow('file_notes', 'release-notes.txt', 'text/plain', 18320, '', { encoding: 'utf-8' }),
		createFileRow('file_campaign', 'summer-campaign.png', 'image/png', 665920, campaignImage, { alt: 'Landscape campaign image with water and greenery', width: 1400, height: 900 }, campaignImage),
		...galleryImages.files,
	];
	const media = [
		root,
		...folders,
		createFileMediaRow('media_hero', '/Images/hero-image.jpg', 'media_images', root.ulid, 'file_hero'),
		createFileMediaRow('media_product', '/Images/product-shot.png', 'media_images', root.ulid, 'file_product'),
		createFileMediaRow('media_guidelines', '/Documents/brand-guidelines.pdf', 'media_documents', root.ulid, 'file_guidelines'),
		createFileMediaRow('media_notes', '/release-notes.txt', root.ulid, root.ulid, 'file_notes'),
		createFileMediaRow('media_campaign_file', '/Images/Campaign/summer-campaign.png', 'media_campaign', root.ulid, 'file_campaign'),
		...galleryImages.media,
	];

	return { media, files };
}

/**
 * Creates paired file and media records for image demo seed data.
 *
 * @param {Array<{ id: string, name: string, photo: string, size: number, alt: string }>} records Seed image descriptors.
 * @param {number} width Requested Unsplash image width.
 * @param {number} height Requested Unsplash image height.
 * @returns {{ files: Array<Record<string, unknown>>, media: Array<Record<string, unknown>> }} Seed file and media records.
 */
function createSeedImageRecords(records, width, height) {
	const files = records.map((record) => {
		const imageUrl = unsplashImage(record.photo, width, height);
		return createFileRow(record.id, record.name, 'image/jpeg', record.size, imageUrl, {
			alt: record.alt,
			width,
			height,
		}, imageUrl);
	});
	const media = records.map((record) => createFileMediaRow(
		`media_${record.id.replace(/^file_/, '')}`,
		`/Images/${record.name}`,
		'media_images',
		'media_root_brand',
		record.id,
	));

	return { files, media };
}

/**
 * Creates a folder row for seed data.
 *
 * @param {string} ulid Stable folder id.
 * @param {string} name Folder name.
 * @param {string} rootId Root media id.
 * @param {string} parentId Parent media id.
 * @param {string} parentPath Parent path.
 * @returns {Record<string, unknown>} Media folder row.
 */
function createFolderRow(ulid, name, rootId, parentId, parentPath = '/') {
	return {
		ulid,
		type: 'dir',
		path: joinPath(parentPath, name),
		parent_id: parentId,
		root_id: rootId,
		file_uuid: null,
		createdAt: '2026-06-02T10:00:00.000Z',
		updatedAt: '2026-06-02T10:00:00.000Z',
	};
}

/**
 * Creates a file database row for seed data.
 *
 * @param {string} ulid Stable file id.
 * @param {string} name File name.
 * @param {string} mimeType MIME type.
 * @param {number} size File size.
 * @param {string} thumbnailUrl Thumbnail URL.
 * @param {Record<string, unknown>} meta Extra metadata.
 * @param {string} publicUrl Public URL.
 * @returns {Record<string, unknown>} File row.
 */
function createFileRow(ulid, name, mimeType, size, thumbnailUrl, meta = {}, publicUrl = '') {
	return {
		ulid,
		name,
		mimeType,
		diskPath: `brand/${ulid}/${name}`,
		size,
		publicUrl: publicUrl || `/media/${ulid}/${name}`,
		thumbnailUrl,
		meta,
		createdAt: '2026-06-03T10:00:00.000Z',
		updatedAt: '2026-06-03T10:00:00.000Z',
	};
}

/**
 * Creates a media row that points to a file database row.
 *
 * @param {string} ulid Stable media id.
 * @param {string} path Media path.
 * @param {string} parentId Parent media id.
 * @param {string} rootId Root media id.
 * @param {string} fileUuid Joined file id.
 * @returns {Record<string, unknown>} File media row.
 */
function createFileMediaRow(ulid, path, parentId, rootId, fileUuid) {
	return {
		ulid,
		type: 'file',
		path,
		parent_id: parentId,
		root_id: rootId,
		file_uuid: fileUuid,
		createdAt: '2026-06-03T10:00:00.000Z',
		updatedAt: '2026-06-03T10:00:00.000Z',
	};
}

/**
 * Creates a media and file row from an uploaded browser file record.
 *
 * @param {{ media: Array<Record<string, unknown>>, files: Array<Record<string, unknown>> }} state Mock database state.
 * @param {string} rootId Root media id.
 * @param {Record<string, unknown>} parent Parent media row.
 * @param {Record<string, unknown>} record Upload file record.
 * @returns {Record<string, unknown>} Created media row.
 */
function createUploadedFile(state, rootId, parent, record) {
	const pathSegments = Array.isArray(record.pathSegments) && record.pathSegments.length
		? record.pathSegments
		: [record.name];
	const folderSegments = pathSegments.slice(0, -1);
	const filename = pathSegments[pathSegments.length - 1] || record.name || 'upload.bin';
	const targetParent = ensureFolderPath(state, rootId, parent, folderSegments);
	const fileUlid = nextId('file');
	const mediaUlid = record.tempUlid || nextId('media');
	const mimeType = record.file?.type || record.mimeType || inferMimeType(filename);
	const file = {
		ulid: fileUlid,
		name: filename,
		mimeType,
		diskPath: `uploads/${fileUlid}/${filename}`,
		size: record.file?.size || record.size || 0,
		publicUrl: record.previewUrl || `/media/${fileUlid}/${filename}`,
		thumbnailUrl: mimeType.startsWith('image/') ? (record.previewUrl || unsplashImage('photo-1498050108023-c5249f4df0852', 1200, 800)) : '',
		previewUrl: record.previewUrl || '',
		meta: {},
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	const media = {
		ulid: mediaUlid,
		type: 'file',
		path: joinPath(targetParent.path, filename),
		parent_id: targetParent.ulid,
		root_id: rootId,
		file_uuid: fileUlid,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	state.files.push(file);
	state.media.push(media);
	return media;
}

/**
 * Ensures every folder in a relative upload path exists.
 *
 * @param {{ media: Array<Record<string, unknown>> }} state Mock database state.
 * @param {string} rootId Root media id.
 * @param {Record<string, unknown>} parent Starting parent row.
 * @param {Array<string>} segments Folder segments.
 * @returns {Record<string, unknown>} Deepest folder row.
 */
function ensureFolderPath(state, rootId, parent, segments) {
	let current = parent;
	for (const segment of segments) {
		const path = joinPath(current.path, segment);
		let folder = state.media.find((item) => item.root_id === rootId && item.path === path && item.type === 'dir');
		if (!folder) {
			folder = {
				ulid: nextId('media'),
				type: 'dir',
				path,
				parent_id: current.ulid,
				root_id: rootId,
				file_uuid: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			state.media.push(folder);
		}
		current = folder;
	}
	return current;
}

/**
 * Finds a folder by root id and path.
 *
 * @param {{ media: Array<Record<string, unknown>> }} state Mock database state.
 * @param {string} rootId Root media id.
 * @param {string} path Folder path.
 * @returns {Record<string, unknown>|null} Folder row or null.
 */
function findFolderByPath(state, rootId, path) {
	const normalizedPath = normalizePath(path);
	return state.media.find((item) => (
		item.root_id === rootId
		&& item.path === normalizedPath
		&& ['root', 'dir'].includes(item.type)
	)) || null;
}

/**
 * Joins a parent path and display name into the media path contract.
 *
 * @param {string} parentPath Parent path.
 * @param {string} name Child name.
 * @returns {string} Joined path.
 */
function joinPath(parentPath, name) {
	const parent = normalizePath(parentPath);
	const child = String(name || '').trim().replace(/^\/+|\/+$/g, '') || 'Untitled';
	return parent === '/' ? `/${child}` : `${parent}/${child}`;
}

/**
 * Normalizes a path into a slash-prefixed media path.
 *
 * @param {string} value Path-like value.
 * @returns {string} Normalized path.
 */
function normalizePath(value) {
	const path = String(value || '/').trim();
	const normalized = (path.startsWith('/') ? path : `/${path}`).replace(/\/+/g, '/').replace(/\/$/, '');
	return normalized || '/';
}

/**
 * Returns a human name from the end of a path.
 *
 * @param {string} path Media path.
 * @returns {string} Path basename.
 */
function pathName(path) {
	const segments = String(path || '').split('/').filter(Boolean);
	return segments[segments.length - 1] || 'Root';
}

/**
 * Hydrates a media row with its joined file row and display name.
 *
 * @param {{ files: Array<Record<string, unknown>> }} state Mock database state.
 * @param {Record<string, unknown>} row Media row.
 * @returns {Record<string, unknown>} Hydrated media row.
 */
function hydrateMediaItem(state, row) {
	const file = row.file_uuid ? state.files.find((record) => record.ulid === row.file_uuid) : null;
	return {
		...row,
		name: file?.name || pathName(row.path),
		file: file ? { ...file } : null,
	};
}

/**
 * Builds breadcrumbs for a folder path.
 *
 * @param {{ media: Array<Record<string, unknown>> }} state Mock database state.
 * @param {string} rootId Root media id.
 * @param {string} path Current folder path.
 * @returns {Array<Record<string, unknown>>} Breadcrumb records.
 */
function breadcrumbsForPath(state, rootId, path) {
	const segments = normalizePath(path).split('/').filter(Boolean);
	const breadcrumbs = [{ label: 'Root', path: '/', ulid: rootId }];
	let cursor = '';
	for (const segment of segments) {
		cursor = `${cursor}/${segment}`;
		const folder = findFolderByPath(state, rootId, cursor);
		breadcrumbs.push({
			label: segment,
			path: cursor,
			ulid: folder?.ulid || null,
		});
	}
	return breadcrumbs;
}

/**
 * Creates a unique child name under one parent.
 *
 * @param {{ media: Array<Record<string, unknown>>, files: Array<Record<string, unknown>> }} state Mock database state.
 * @param {string} parentId Parent media row id.
 * @param {string} requestedName Desired name.
 * @param {string} ignoredUlid Existing row id to ignore.
 * @returns {string} Unique child name.
 */
function uniqueChildName(state, parentId, requestedName, ignoredUlid = '') {
	const base = String(requestedName || 'Untitled').trim() || 'Untitled';
	const names = new Set(state.media
		.filter((item) => item.parent_id === parentId && item.ulid !== ignoredUlid)
		.map((item) => hydrateMediaItem(state, item).name.toLowerCase()));
	if (!names.has(base.toLowerCase())) return base;

	let index = 2;
	while (names.has(`${base} ${index}`.toLowerCase())) index += 1;
	return `${base} ${index}`;
}

/**
 * Rewrites descendant paths after a folder path changes.
 *
 * @param {{ media: Array<Record<string, unknown>> }} state Mock database state.
 * @param {Record<string, unknown>} folder Renamed or moved folder.
 * @param {string} previousPath Folder path before the update.
 */
function updateDescendantPaths(state, folder, previousPath) {
	const oldPrefix = `${previousPath}/`;
	const newPrefix = `${folder.path}/`;
	for (const item of state.media) {
		if (!String(item.path).startsWith(oldPrefix)) continue;
		item.path = `${newPrefix}${String(item.path).slice(oldPrefix.length)}`;
		item.updatedAt = new Date().toISOString();
	}
}

/**
 * Sorts folders before files, then by name.
 *
 * @param {Record<string, unknown>} a Left media row.
 * @param {Record<string, unknown>} b Right media row.
 * @returns {number} Sort comparison.
 */
function compareMediaRows(a, b) {
	if (a.type !== b.type) {
		if (a.type === 'dir' || a.type === 'root') return -1;
		if (b.type === 'dir' || b.type === 'root') return 1;
	}
	return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
}

/**
 * Infers a MIME type for a demo upload when the browser does not provide one.
 *
 * @param {string} filename Uploaded filename.
 * @returns {string} MIME type.
 */
function inferMimeType(filename) {
	const lower = String(filename || '').toLowerCase();
	if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return 'image/png';
	if (lower.endsWith('.pdf')) return 'application/pdf';
	if (lower.endsWith('.txt')) return 'text/plain';
	return 'application/octet-stream';
}

/**
 * Generates a stable local-ish id for demo rows.
 *
 * @param {string} prefix Id prefix.
 * @returns {string} Generated id.
 */
function nextId(prefix) {
	idCounter += 1;
	return `${prefix}_${idCounter.toString(36)}`;
}

/**
 * Builds a stable Unsplash image URL for demo media rows.
 *
 * @param {string} id Unsplash photo id.
 * @param {number} width Requested image width.
 * @param {number} height Requested image height.
 * @returns {string} Unsplash image URL.
 */
function unsplashImage(id, width, height) {
	return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

/**
 * Resolves after a small timeout to emulate network latency.
 *
 * @param {number} ms Delay in milliseconds.
 * @returns {Promise<void>} Delay promise.
 */
function wait(ms) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}
