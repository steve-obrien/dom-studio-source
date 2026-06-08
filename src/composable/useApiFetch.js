import { useSSRContext } from 'vue';

export function useApiFetch() {
	const ssrContext = import.meta.env.SSR ? useSSRContext() : null;

	return async function apiFetch(path, options = {}) {
		return fetch(resolveApiUrl(path, ssrContext?.req), options);
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

function readHeader(headers, name) {
	return headers[name] || headers[name.toLowerCase()] || '';
}
