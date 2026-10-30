import { getIncidentResponseWorkspace } from '../../../lib/blockDemos/incidentResponse.js';

/**
 * Returns the complete incident response workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Incident workspace payload.
 */
export async function get() {
	return getIncidentResponseWorkspace();
}
