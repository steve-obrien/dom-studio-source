import { createSessionCookie } from '../../lib/auth.js';
import { authenticateEmailUser, serializeUserSession } from '../../lib/users.js';

export async function post(req, res) {
	const email = String(req.body?.email || '').trim().toLowerCase();
	const password = String(req.body?.password || '');

	if (!email || !email.includes('@')) {
		res.status(400);
		return { error: 'Enter a valid email address.' };
	}

	const { error, user } = await authenticateEmailUser({ email, password });
	if (!user) {
		if (error === 'account_suspended') {
			res.status(403);
			return { error: 'This account is suspended. Contact support to restore access.' };
		}

		res.status(401);
		return { error: 'Email or password is incorrect.' };
	}

	const auth = await serializeUserSession(user);

	res.setHeader('Set-Cookie', createSessionCookie({
		userId: user.id,
		sessionVersion: user.session_version,
	}));

	return {
		auth,
	};
}
