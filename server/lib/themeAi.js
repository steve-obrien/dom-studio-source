export const themeAiEndpointPath = '/api/ai/theme';
export const legacyThemeAiEndpointPath = '/api/theme-tokens';
export const defaultThemeAiModel = 'gpt-4.1-mini';

const tokenNames = [
	'--background',
	'--foreground',
	'--card',
	'--card-foreground',
	'--popover',
	'--popover-foreground',
	'--primary',
	'--primary-foreground',
	'--secondary',
	'--secondary-foreground',
	'--muted',
	'--muted-foreground',
	'--accent',
	'--accent-foreground',
	'--destructive',
	'--destructive-foreground',
	'--success',
	'--success-foreground',
	'--warning',
	'--warning-foreground',
	'--border',
	'--input',
	'--ring',
];

const appearanceTokenNames = [
	'--radius',
	'--shadow-color',
	'--shadow-strength',
	'--shadow-distance',
	'--shadow-softness',
];

const defaultAllowedOrigins = [
	'http://localhost:3333',
	'http://localhost:5174',
	'http://localhost:5175',
	'https://getdom.studio',
];

export function resolveThemeAiConfig(env = process.env) {
	return {
		apiKey: env.OPENAI_API_KEY || env.OPEN_AI_API_KEY || env.OPEN_AI_API || env.OPEN_AI_KEY || '',
		model: env.OPENAI_THEME_MODEL || defaultThemeAiModel,
		publicToken: env.THEME_AI_PUBLIC_TOKEN || '',
		allowedOrigins: parseThemeAiAllowedOrigins(env.THEME_AI_ALLOWED_ORIGINS),
	};
}

export function parseThemeAiAllowedOrigins(value = '') {
	const origins = String(value || '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);

	return origins.length ? origins : defaultAllowedOrigins;
}

export function isThemeAiOriginAllowed(origin, allowedOrigins = defaultAllowedOrigins) {
	if (!origin) return true;
	return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
}

export function setThemeAiCorsHeaders(response, origin, allowedOrigins = defaultAllowedOrigins) {
	response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (allowedOrigins.includes('*')) {
		response.setHeader('Access-Control-Allow-Origin', '*');
		return;
	}

	if (origin && isThemeAiOriginAllowed(origin, allowedOrigins)) {
		response.setHeader('Access-Control-Allow-Origin', origin);
		response.setHeader('Vary', 'Origin');
	}
}

export async function requestThemeFromOpenAi({
	apiKey,
	model = defaultThemeAiModel,
	prompt = '',
	tokens = {},
}) {
	if (!apiKey) throw new Error('OPENAI_API_KEY is not available to the server.');

	const result = await fetch('https://api.openai.com/v1/responses', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model,
			instructions: 'Generate accessible CSS theme tokens for a component library. Return only the requested structured JSON. Colour tokens must be hex. Appearance tokens should keep the UI usable: radius in rem, shadow strength in percent, and shadow distance/softness as unitless multipliers.',
			input: `Theme direction: ${prompt || 'surprise me with a polished, production-ready theme'}\n\nCurrent tokens:\n${JSON.stringify(tokens, null, 2)}`,
			text: {
				format: {
					type: 'json_schema',
					name: 'dom_studio_theme_tokens',
					schema: themeResponseSchema(),
				},
			},
			max_output_tokens: 2200,
		}),
	});

	const data = await result.json().catch(() => ({}));
	if (!result.ok) throw new Error(data.error?.message || `OpenAI request failed with status ${result.status}.`);

	try {
		return JSON.parse(extractResponseText(data));
	} catch (error) {
		if (error.message === 'OpenAI response did not include text output.') throw error;
		throw new Error('OpenAI response was not valid JSON.');
	}
}

function themeResponseSchema() {
	const tokenProperties = Object.fromEntries(tokenNames.map((name) => [name, {
		type: 'string',
		pattern: '^#[0-9a-fA-F]{6}$',
	}]));
	const appearanceProperties = {
		'--radius': {
			type: 'string',
			pattern: '^(0|0?\\.\\d+|1(\\.\\d+)?)rem$',
		},
		'--shadow-color': {
			type: 'string',
			pattern: '^#[0-9a-fA-F]{6}$',
		},
		'--shadow-strength': {
			type: 'string',
			pattern: '^([0-9]|1[0-9]|2[0-8])%$',
		},
		'--shadow-distance': {
			type: 'string',
			pattern: '^(0|0?\\.\\d+|1(\\.\\d+)?|2(\\.0+)?)$',
		},
		'--shadow-softness': {
			type: 'string',
			pattern: '^(0\\.2[5-9]|0\\.[3-9]\\d*|1(\\.\\d+)?|2(\\.0+)?)$',
		},
	};

	return {
		type: 'object',
		additionalProperties: false,
		required: ['name', 'appearance', 'light', 'dark'],
		properties: {
			name: { type: 'string' },
			appearance: {
				type: 'object',
				additionalProperties: false,
				required: appearanceTokenNames,
				properties: appearanceProperties,
			},
			light: {
				type: 'object',
				additionalProperties: false,
				required: tokenNames,
				properties: tokenProperties,
			},
			dark: {
				type: 'object',
				additionalProperties: false,
				required: tokenNames,
				properties: tokenProperties,
			},
		},
	};
}

function extractResponseText(data) {
	if (data.output_text) return data.output_text;
	const text = data.output
		?.flatMap((item) => item.content || [])
		.find((content) => content.type === 'output_text' || content.type === 'text')
		?.text;
	if (!text) throw new Error('OpenAI response did not include text output.');
	return text;
}
