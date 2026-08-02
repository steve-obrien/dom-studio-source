import { listCampaigns } from '../../../lib/blockDemos/campaignComposer.js';

/**
 * Lists campaigns for the campaign composer navigation.
 *
 * @returns {Promise<{ campaigns: Array<object> }>} Campaign summaries.
 */
export async function get() {
	return { campaigns: listCampaigns() };
}
