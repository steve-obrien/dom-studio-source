import { getOnboardingBootstrap } from '../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Returns onboarding product context, choices, and resumable setup state.
 *
 * @returns {Promise<Record<string, unknown>>} Onboarding bootstrap payload.
 */
export async function get() {
	return getOnboardingBootstrap();
}
