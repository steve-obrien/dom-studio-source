import { getSprintPlanningWorkspace } from '../../../lib/blockDemos/sprintPlanning.js';

/**
 * Returns the sprint-planning workspace, catalogs, and capacity evidence.
 *
 * @returns {Promise<object>} Sprint-planning workspace payload.
 */
export async function get() {
	return getSprintPlanningWorkspace();
}
