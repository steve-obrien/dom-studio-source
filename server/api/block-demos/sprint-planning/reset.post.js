import { resetSprintPlanningWorkspace } from '../../../lib/blockDemos/sprintPlanning.js';

/**
 * Restores the deterministic sprint-planning demonstration workspace.
 *
 * @returns {Promise<object>} Reset sprint-planning workspace.
 */
export async function post() {
	return resetSprintPlanningWorkspace();
}
