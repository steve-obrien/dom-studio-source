import { advanceVirtualMachineProvision } from '../../../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Advances one deterministic provider provisioning step.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = advanceVirtualMachineProvision(req.params.jobId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
