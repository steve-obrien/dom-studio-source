import { previewVirtualMachineProvision } from '../../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Creates an exact server-owned virtual-machine provisioning plan.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = previewVirtualMachineProvision(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
