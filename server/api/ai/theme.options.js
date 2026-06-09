import {
	isThemeAiOriginAllowed,
	resolveThemeAiConfig,
	setThemeAiCorsHeaders,
} from '../../lib/themeAi.js';

export function options(request, response) {
	const { allowedOrigins } = resolveThemeAiConfig();
	const origin = request.headers.origin || '';
	setThemeAiCorsHeaders(response, origin, allowedOrigins);

	if (!isThemeAiOriginAllowed(origin, allowedOrigins)) {
		response.status(403).json({ error: 'Origin is not allowed.' });
		return;
	}

	response.status(204).end();
}
