import { getSalesPipelineWorkspace } from '../../../lib/blockDemos/salesPipeline.js';

/**
 * Returns the complete sales-pipeline workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Sales-pipeline payload.
 */
export async function get() {
	return getSalesPipelineWorkspace();
}
