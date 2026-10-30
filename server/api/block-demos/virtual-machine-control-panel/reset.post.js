import { resetVirtualMachineWorkspace } from '../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Restores the deterministic virtual-machine workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Reset compute workspace.
 */
export async function post() {
	return resetVirtualMachineWorkspace();
}
