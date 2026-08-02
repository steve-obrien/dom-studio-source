import { resetRoadmapTimelineWorkspace } from '../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Restores the deterministic portfolio roadmap demo state.
 *
 * @returns {Promise<object>} Reset roadmap workspace.
 */
export async function post() {
	return resetRoadmapTimelineWorkspace();
}
