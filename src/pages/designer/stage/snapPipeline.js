import { snapPosition } from './snapGeometry.js';
import { snapSpacing } from './spacingGeometry.js';

/**
 * Runs independent translation snap stages in priority order. Missing indexes
 * disable a stage entirely. Alignment resolves first; equal spacing only fills
 * free axes, so enabling it cannot replace an existing alignment match.
 */
export function snapTranslation(rect, indexes, scale = 1, previous = {}) {
	const alignmentPrevious = { x: previous.x?.kind === 'spacing' ? null : previous.x, y: previous.y?.kind === 'spacing' ? null : previous.y };
	const aligned = indexes.alignment
		? snapPosition(rect, indexes.alignment, scale, alignmentPrevious)
		: { left: rect.left, top: rect.top, matches: { x: null, y: null } };
	if (!indexes.spacing) return aligned;
	const spaced = snapSpacing({ ...rect, left: aligned.left, top: aligned.top }, indexes.spacing, scale, previous, aligned.matches);
	return { left: spaced.left, top: spaced.top, matches: { x: aligned.matches.x || spaced.matches.x, y: aligned.matches.y || spaced.matches.y } };
}
