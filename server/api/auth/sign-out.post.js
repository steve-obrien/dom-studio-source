import { createExpiredSessionCookie } from '../../lib/auth.js';

export function post(req, res) {
	res.setHeader('Set-Cookie', createExpiredSessionCookie());
	return {
		auth: {
			user: null,
			entitlements: [],
			isAuthenticated: false,
		},
	};
}
