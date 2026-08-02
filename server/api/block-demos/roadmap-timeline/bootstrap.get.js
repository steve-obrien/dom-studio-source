import { getRoadmapTimelineWorkspace } from '../../../lib/blockDemos/roadmapTimeline.js';

/**
 * Returns the API-backed portfolio roadmap workspace.
 *
 * @returns {Promise<object>} Roadmap workspace.
 */
export async function get() {
	return getRoadmapTimelineWorkspace();
}
