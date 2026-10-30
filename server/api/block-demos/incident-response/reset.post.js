import { resetIncidentResponseWorkspace } from '../../../lib/blockDemos/incidentResponse.js';

/**
 * Restores the deterministic incident response demo.
 *
 * @returns {Promise<Record<string, unknown>>} Reset workspace payload.
 */
export async function post() {
	return resetIncidentResponseWorkspace();
}
