import { createSessionCookie } from '../../lib/auth.js';
import { createEmailUser, serializeUserSession } from '../../lib/users.js';

export async function post(req, res) {
	try {
		const user = await createEmailUser({
			email: req.body?.email,
			password: req.body?.password,
			name: req.body?.name,
		});
		const auth = await serializeUserSession(user);

		res.setHeader('Set-Cookie', createSessionCookie({
			userId: user.id,
		}));

		return { auth };
	} catch (error) {
		res.status(400);
		return {
			error: error.message || 'Could not create account.',
		};
	}
}
