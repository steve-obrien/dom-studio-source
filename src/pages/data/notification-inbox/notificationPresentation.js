/**
 * Maps framework notification severity to DOM Studio's semantic tone vocabulary.
 *
 * @param {unknown} severity Framework-provided notification severity.
 * @returns {'info'|'success'|'warning'|'danger'} DOM Studio semantic tone.
 */
export function notificationTone(severity) {
	if (severity === 'error' || severity === 'danger') return 'danger';
	if (severity === 'success') return 'success';
	if (severity === 'warning') return 'warning';
	return 'info';
}

/**
 * Creates a transient toast record from a durable in-app notification item.
 * Calling applications should use this only for a newly observed live arrival;
 * loading inbox history must not replay old items as fresh toasts.
 *
 * @param {Record<string, any>} item Durable in-app notification item.
 * @param {{ duration?: number, dismissible?: boolean }} [options] Toast overrides.
 * @returns {{ id: string, title: string, description: string, tone: string, duration: number, dismissible: boolean }} Toast stack record.
 */
export function notificationToast(item, options = {}) {
	const message = item?.message || {};
	const semanticTone = notificationTone(message.severity);
	return {
		id: String(item?.id || ''),
		title: String(message.title || ''),
		description: String(message.body || ''),
		tone: semanticTone === 'info' ? 'default' : semanticTone,
		duration: options.duration ?? 6000,
		dismissible: options.dismissible ?? true,
	};
}
