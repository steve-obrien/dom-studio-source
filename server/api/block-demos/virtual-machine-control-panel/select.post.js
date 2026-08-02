import { selectVirtualMachine } from '../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Selects one virtual machine with exact workspace revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = selectVirtualMachine(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
