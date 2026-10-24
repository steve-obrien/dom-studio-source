// Glass 3D product icons (public/media/product-icons-3d), keyed by the
// homepage product id. Longest matching path prefix wins.
const iconRoutes = [
	['/data/data-grid', 'data-grid'],
	['/data/filter-bar', 'data-grid'],
	['/data/week-planner', 'scheduler'],
	['/data/month-calendar', 'scheduler'],
	['/data/gantt', 'scheduler'],
	['/data/kanban', 'kanban'],
	['/data/document-editor', 'documents'],
	['/data/media-browser', 'files'],
	['/designer/social', 'social'],
	['/designer/poster', 'social'],
	['/designer/flowchart', 'workflows'],
	['/designer', 'designer'],
	['/charts', 'charts'],
	['/data/agent-chat', 'ai'],
	['/ai', 'ai'],
	['/mobile', 'mobile'],
].sort((a, b) => b[0].length - a[0].length);

export function productIconSrc(id) {
	return id ? `/media/product-icons-3d/${id}.webp` : '';
}

export function productIconForPath(path) {
	const match = iconRoutes.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
	return match ? match[1] : '';
}
