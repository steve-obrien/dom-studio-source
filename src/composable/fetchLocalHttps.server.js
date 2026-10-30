import https from 'node:https';

const localHttpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Same-origin HTTPS fetch for SSR against a local mkcert/self-signed cert.
 * Native fetch cannot skip TLS verification without undici's dispatcher API.
 *
 * @param {string} url Absolute https URL.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<Response>}
 */
export function fetchLocalHttps(url, options = {}) {
	const parsed = new URL(url);
	const method = String(options.method || 'GET').toUpperCase();
	const headers = normalizeHeaders(options.headers);

	return new Promise((resolve, reject) => {
		const request = https.request({
			protocol: parsed.protocol,
			hostname: parsed.hostname,
			port: parsed.port || 443,
			path: `${parsed.pathname}${parsed.search}`,
			method,
			headers,
			agent: localHttpsAgent,
		}, (response) => {
			const chunks = [];
			response.on('data', (chunk) => chunks.push(chunk));
			response.on('end', () => {
				resolve(new Response(Buffer.concat(chunks), {
					status: response.statusCode || 502,
					statusText: response.statusMessage || '',
					headers: response.headers,
				}));
			});
		});

		request.on('error', reject);

		if (options.body == null || method === 'GET' || method === 'HEAD') {
			request.end();
			return;
		}

		if (typeof options.body === 'string' || Buffer.isBuffer(options.body)) {
			request.end(options.body);
			return;
		}

		Promise.resolve(options.body)
			.then(async (body) => {
				if (body == null) {
					request.end();
					return;
				}
				if (typeof body === 'string' || Buffer.isBuffer(body)) {
					request.end(body);
					return;
				}
				if (typeof body.getReader === 'function' || typeof body.arrayBuffer === 'function') {
					const buffer = Buffer.from(await new Response(body).arrayBuffer());
					request.end(buffer);
					return;
				}
				request.end(String(body));
			})
			.catch(reject);
	});
}

function normalizeHeaders(headers) {
	if (!headers) return {};
	if (headers instanceof Headers) return Object.fromEntries(headers.entries());
	return { ...headers };
}
