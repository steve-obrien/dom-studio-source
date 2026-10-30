import { resetSalesPipelineWorkspace } from '../../../lib/blockDemos/salesPipeline.js';

/**
 * Restores the deterministic sales-pipeline demo.
 *
 * @returns {Promise<Record<string, unknown>>} Reset sales-pipeline payload.
 */
export async function post() {
	return resetSalesPipelineWorkspace();
}
