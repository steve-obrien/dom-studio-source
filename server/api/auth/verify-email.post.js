import { consumeLicenceSignIn } from '../../lib/licenceAuth.js';
import { createSessionCookie } from '../../lib/auth.js';
import { serializeUserSession } from '../../lib/users.js';
import { allowBillingMutation } from '../../lib/billingHttp.js';

/**
 * Exchanges one-use inbox proof for an account session after an explicit user action.
 *
 * @param {import('express').Request} req Incoming JSON request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Authenticated session or an expired-link response.
 */
export async function post(req, res) {
	if (!allowBillingMutation(req, res)) return { error: 'Please continue from the DOM Studio website.' };
	const user = await consumeLicenceSignIn(req.body?.token);
	if (!user) {
		res.status(400);
		return { error: 'This link has expired or has already been used. Request a new sign-in link.' };
	}
	res.setHeader('Set-Cookie', createSessionCookie({ userId: user.id, sessionVersion: user.session_version }));
	return { auth: await serializeUserSession(user) };
}
