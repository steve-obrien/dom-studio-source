import { commitVirtualMachineProvision } from '../../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Commits one acknowledged provisioning plan.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = commitVirtualMachineProvision(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
