import { getOnboardingSession } from '../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Returns the current onboarding session for reload and resume.
 *
 * @returns {Promise<Record<string, unknown>>} Current onboarding session.
 */
export async function get() {
	return getOnboardingSession();
}
