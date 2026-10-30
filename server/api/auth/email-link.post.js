import { requestLicenceSignIn } from '../../lib/licenceAuth.js';
import { isLicenceEmailConfigured } from '../../lib/licenceEmail.js';
import { allowBillingMutation, billingClientAddress } from '../../lib/billingHttp.js';

/**
 * Requests inbox verification without disclosing account or purchase existence.
 *
 * @param {import('express').Request} req Incoming JSON request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Generic delivery acknowledgement or configuration error.
 */
export async function post(req, res) {
	if (!allowBillingMutation(req, res)) return { error: 'Please request a link from the DOM Studio website.' };
	if (!isLicenceEmailConfigured()) {
		res.status(503);
		return { error: 'Email sign-in is temporarily unavailable. Please try again shortly.' };
	}
	try {
		await requestLicenceSignIn(req.body?.email, billingClientAddress(req));
	} catch {
		console.error('DOM Studio sign-in email could not be delivered.');
	}
	return { message: 'If this email has a licence or account, a sign-in link will arrive shortly. Check spam too. You can request another link in a minute.' };
}
