/** Resizes only the handle's axes, preserving opposite edges and clamping before they cross. */
export function resizeBounds(rect, handle, dx, dy, minimum = 16) {
	const result = { ...rect };
	if (handle.includes('e')) result.width = Math.max(minimum, rect.width + dx);
	if (handle.includes('s')) result.height = Math.max(minimum, rect.height + dy);
	if (handle.includes('w')) {
		result.width = Math.max(minimum, rect.width - dx);
		result.left = rect.left + rect.width - result.width;
	}
	if (handle.includes('n')) {
		result.height = Math.max(minimum, rect.height - dy);
		result.top = rect.top + rect.height - result.height;
	}
	return result;
}
