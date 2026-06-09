import {
	isThemeAiOriginAllowed,
	requestThemeFromOpenAi,
	resolveThemeAiConfig,
	setThemeAiCorsHeaders,
} from '../../lib/themeAi.js';

export async function post(request, response) {
	const config = resolveThemeAiConfig();
	const origin = request.headers.origin || '';
	setThemeAiCorsHeaders(response, origin, config.allowedOrigins);

	if (!isThemeAiOriginAllowed(origin, config.allowedOrigins)) {
		response.status(403);
		return { error: 'Origin is not allowed.' };
	}

	if (config.publicToken && request.headers.authorization !== `Bearer ${config.publicToken}`) {
		response.status(401);
		return { error: 'Unauthorized.' };
	}

	try {
		const body = request.body && typeof request.body === 'object' ? request.body : {};
		return await requestThemeFromOpenAi({
			apiKey: config.apiKey,
			model: config.model,
			prompt: body.prompt || '',
			tokens: body.tokens || {},
		});
	} catch (error) {
		response.status(500);
		return { error: error.message || 'Theme generation failed.' };
	}
}
