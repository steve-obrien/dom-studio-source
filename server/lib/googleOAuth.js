const googleAuthorizationEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
const googleTokenEndpoint = 'https://oauth2.googleapis.com/token';
const googleUserInfoEndpoint = 'https://openidconnect.googleapis.com/v1/userinfo';
const googleCalendarApiBase = 'https://www.googleapis.com/calendar/v3';

export const googleCalendarScopes = [
	'openid',
	'email',
	'profile',
	'https://www.googleapis.com/auth/calendar.events',
	'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
];

/**
 * Reports whether the server has the OAuth values needed to start Google authorization.
 *
 * @returns {{ configured: boolean, missing: Array<string> }} Configuration status.
 */
export function getGoogleOAuthConfiguration() {
	const required = {
		GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
		GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
		GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
	};
	const missing = Object.entries(required)
		.filter(([, value]) => !String(value || '').trim())
		.map(([name]) => name);

	return {
		configured: missing.length === 0,
		missing,
	};
}

/**
 * Builds the Google OAuth authorization URL for a server-side offline flow.
 *
 * @param {{ state: string, loginHint?: string }} options Authorization options.
 * @returns {string} Google authorization URL.
 */
export function createGoogleAuthorizationUrl(options = {}) {
	const configuration = getGoogleOAuthConfiguration();
	if (!configuration.configured) {
		throw new Error(`Google OAuth is missing ${configuration.missing.join(', ')}.`);
	}

	const url = new URL(googleAuthorizationEndpoint);
	url.searchParams.set('client_id', process.env.GOOGLE_OAUTH_CLIENT_ID);
	url.searchParams.set('redirect_uri', process.env.GOOGLE_OAUTH_REDIRECT_URI);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('scope', googleCalendarScopes.join(' '));
	url.searchParams.set('access_type', 'offline');
	url.searchParams.set('include_granted_scopes', 'true');
	url.searchParams.set('prompt', 'consent');
	url.searchParams.set('state', String(options.state || ''));
	if (options.loginHint) url.searchParams.set('login_hint', options.loginHint);
	return url.toString();
}

/**
 * Exchanges an OAuth authorization code for Google access and refresh tokens.
 *
 * @param {string} code Google authorization code.
 * @returns {Promise<object>} Google token response.
 */
export async function exchangeGoogleAuthorizationCode(code) {
	return requestGoogleJson(googleTokenEndpoint, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
			client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
			code: String(code || ''),
			grant_type: 'authorization_code',
			redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
		}),
	});
}

/**
 * Refreshes an expired Google OAuth access token.
 *
 * @param {string} refreshToken Decrypted offline refresh token.
 * @returns {Promise<object>} Google token response.
 */
export async function refreshGoogleAccessToken(refreshToken) {
	return requestGoogleJson(googleTokenEndpoint, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
			client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
			refresh_token: String(refreshToken || ''),
			grant_type: 'refresh_token',
		}),
	});
}

/**
 * Loads the verified OpenID profile associated with an access token.
 *
 * @param {string} accessToken Google OAuth access token.
 * @returns {Promise<object>} Google OpenID profile.
 */
export async function getGoogleUserInfo(accessToken) {
	return requestGoogleJson(googleUserInfoEndpoint, {
		headers: {
			authorization: `Bearer ${accessToken}`,
		},
	});
}

/**
 * Sends an authenticated request to the Google Calendar REST API.
 *
 * @param {string} accessToken Google OAuth access token.
 * @param {string} path Calendar API path beginning with a slash.
 * @param {{ method?: string, query?: Record<string, unknown>, body?: object }} [options] Request options.
 * @returns {Promise<object|null>} Parsed response, or null for an empty response.
 */
export async function requestGoogleCalendarApi(accessToken, path, options = {}) {
	const url = new URL(`${googleCalendarApiBase}${path}`);
	for (const [name, rawValue] of Object.entries(options.query || {})) {
		if (rawValue === undefined || rawValue === null || rawValue === '') continue;
		const values = Array.isArray(rawValue) ? rawValue : [rawValue];
		for (const value of values) url.searchParams.append(name, String(value));
	}

	return requestGoogleJson(url, {
		method: options.method || 'GET',
		headers: {
			authorization: `Bearer ${accessToken}`,
			accept: 'application/json',
			...(options.body ? { 'content-type': 'application/json' } : {}),
		},
		...(options.body ? { body: JSON.stringify(options.body) } : {}),
	});
}

/**
 * Executes a Google HTTP request and converts non-success responses into status-aware errors.
 *
 * @param {string|URL} url Absolute Google endpoint URL.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<object|null>} Parsed JSON or null for an empty response.
 */
async function requestGoogleJson(url, options = {}) {
	const response = await fetch(url, options);
	const text = await response.text();
	const data = text ? parseJson(text) : null;

	if (!response.ok) {
		const error = new Error(
			data?.error_description
			|| data?.error?.message
			|| data?.error
			|| `Google request failed with ${response.status}.`,
		);
		error.status = response.status;
		error.googleError = data;
		throw error;
	}

	return data;
}

/**
 * Parses a JSON response without allowing malformed remote data to mask its body.
 *
 * @param {string} value Response body.
 * @returns {object|string} Parsed object or original text.
 */
function parseJson(value) {
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}
