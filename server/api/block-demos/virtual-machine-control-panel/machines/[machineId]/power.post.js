import { executeVirtualMachinePowerAction } from '../../../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Executes one acknowledged virtual-machine power action.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = executeVirtualMachinePowerAction(req.params.machineId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
