import { createVirtualMachineSnapshot } from '../../../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Creates one acknowledged virtual-machine snapshot.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = createVirtualMachineSnapshot(req.params.machineId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
