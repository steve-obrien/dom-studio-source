import { getVirtualMachineWorkspace } from '../../../lib/blockDemos/virtualMachineControlPanel.js';

/**
 * Returns the complete virtual-machine workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Compute workspace payload.
 */
export async function get() {
	return getVirtualMachineWorkspace();
}
