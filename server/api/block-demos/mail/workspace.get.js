import { getMailWorkspace } from '../../../lib/blockDemos/mailWorkspace.js';

/**
 * Returns folders, controls, contacts, and thread summaries for the mail workspace.
 *
 * @returns {Promise<object>} Mail workspace payload.
 */
export async function get() {
	return getMailWorkspace();
}
