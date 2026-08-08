import { useSSRContext } from 'vue';

export function useApiFetch() {
	const ssrContext = import.meta.env.SSR ? useSSRContext() : null;

	return async function apiFetch(path, options = {}) {
		const url = resolveApiUrl(path, ssrContext?.req);

		// Local HTTPS (mkcert/self-signed) fails Node's default TLS verify on SSR loopback.
		// Native fetch ignores `agent`, so use https.request for these same-origin calls.
		if (import.meta.env.SSR && shouldTrustLocalHttps(url)) {
			const { fetchLocalHttps } = await import('./fetchLocalHttps.server.js');
			return fetchLocalHttps(url, options);
		}

		return fetch(url, options);
	};
}

function resolveApiUrl(path, req) {
	if (!import.meta.env.SSR) return path;
	if (/^https?:\/\//i.test(path)) return path;

	const origin = getRequestOrigin(req);
	return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function getRequestOrigin(req = {}) {
	const headers = req.headers || {};
	const forwardedProto = readHeader(headers, 'x-forwarded-proto');
	const forwardedHost = readHeader(headers, 'x-forwarded-host');
	const protocol = forwardedProto || req.protocol || 'http';
	const host = forwardedHost || readHeader(headers, 'host') || 'localhost:3000';

	return `${String(protocol).split(',')[0]}://${String(host).split(',')[0]}`;
}

function shouldTrustLocalHttps(url) {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'https:' && isLocalHostname(parsed.hostname);
	} catch {
		return false;
	}
}

function isLocalHostname(hostname) {
	const host = String(hostname || '').toLowerCase();
	return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost');
}

function readHeader(headers, name) {
	return headers[name] || headers[name.toLowerCase()] || '';
}
