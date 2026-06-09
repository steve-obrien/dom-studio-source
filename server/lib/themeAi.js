export const defaultThemeAiModel = 'gpt-4.1-mini';

const tokenNames = [
	'--background',
	'--fg',
	'--primary',
	'--primary-fg',
	'--secondary',
	'--secondary-fg',
	'--muted',
	'--muted-fg',
	'--accent',
	'--accent-fg',
	'--destructive',
	'--destructive-fg',
	'--success',
	'--success-fg',
	'--warning',
	'--warning-fg',
	'--border',
	'--input',
	'--ring',
];

const appearanceTokenNames = [
	'--radius',
];

const skinNames = [
	'base',
	'raised',
	'floating',
	'overlay',
	'inset',
	'control',
	'action',
];

const skinPropertyNames = [
	'bg',
	'fg',
	'border',
	'borderWidth',
	'borderStyle',
	'shadow',
	'backdrop',
	'bgImage',
];

const defaultAllowedOrigins = [
	'http://localhost:3333',
	'https://getdom.studio',
];

const themeGenerationInstructions = [
	'Generate accessible CSS theme tokens for DOM Studio, a Tailwind-like component framework.',
	'Return only the requested structured JSON. Do not include prose, markdown, selectors, @rules, semicolons, braces, comments, or url().',
	'Palette tokens in light and dark must be hex colours. Every bg/fg pair must be readable: background with fg, primary with primary-fg, secondary with secondary-fg, muted with muted-fg, accent with accent-fg, destructive with destructive-fg, success with success-fg, and warning with warning-fg.',
	'Dark mode is first-class. The dark palette should feel intentionally designed, not just inverted; keep surfaces distinct from the canvas, keep inputs visible, and avoid washed-out text or black-on-dark controls.',
	'Skins are shared by light and dark modes, so skin colour values must be mode-adaptive. Prefer var(--background), var(--fg), var(--border), var(--input), var(--primary), var(--secondary), var(--muted), var(--accent), and color-mix(in oklch, ...) recipes. Do not use fixed hex colours for skin bg, fg, or border.',
	'Skin roles: base is the page canvas; raised is cards and panels; floating is dropdowns, popovers, combobox menus, context menus, and tooltips; overlay is dialogs, drawers, command palettes, and action sheets; inset is inputs, textareas, native selects, and editable recessed controls; control is quiet buttons, toggles, segmented controls, and neutral triggers; action is primary buttons and high-emphasis commands.',
	'Do not create card or popover palette tokens. Cards and popovers are represented by raised and floating skins.',
	'For glass themes, use translucent color-mix() backgrounds, backdrop blur/saturate, a subtle top-light gradient, a bottom shade, and layered shadows or inset highlights. The same recipe must still work in dark mode.',
	'For subtle shadcn-like themes, use restrained borders, small shadows, quiet neutral skins, and crisp focus rings.',
	'For expressive or whacky themes, use accent-driven gradients, unusual border styles, or coloured shadows, but keep controls legible and avoid overwhelming the base canvas.',
	'The inset skin is especially important: make form controls readable in dark mode by giving them a background distinct from --background, a visible --input/--border edge, clear --fg text, and muted placeholder contrast.',
	'Each skin recipe must include bg, fg, border, borderWidth, borderStyle, shadow, backdrop, and bgImage. Use "none" for shadow/backdrop/bgImage when no effect is wanted.',
	'Allowed CSS for skin bg/fg/border is var(...), transparent, none, or color-mix(in oklch, ...). Allowed CSS for shadows and gradients may use semantic variables, color-mix(), rgb(... / alpha), linear-gradient(), radial-gradient(), and multiple comma-separated layers.',
].join('\n');

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
			instructions: themeGenerationInstructions,
			input: [
				`Theme direction: ${prompt || 'surprise me with a polished, production-ready theme'}`,
				'Use the current tokens as a baseline, but improve the whole system when the prompt asks for a stronger direction.',
				'Remember that light/dark palettes are separate, while skins are shared adaptive recipes that must work against both palettes.',
				`Current tokens:\n${JSON.stringify(tokens, null, 2)}`,
			].join('\n\n'),
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
	};
	const safeCssPattern = '^[^;{}@]{1,360}$';
	const skinColorCssPattern = '^(transparent|none|var\\(--[a-z0-9-]+\\)|color-mix\\(in oklch, [^;{}@]{1,132}\\))$';
	const skinProperties = Object.fromEntries(skinNames.map((name) => [name, {
		type: 'object',
		additionalProperties: false,
		required: skinPropertyNames,
		properties: {
			bg: {
				type: 'string',
				pattern: skinColorCssPattern,
			},
			fg: {
				type: 'string',
				pattern: skinColorCssPattern,
			},
			border: {
				type: 'string',
				pattern: skinColorCssPattern,
			},
			borderWidth: {
				type: 'string',
				pattern: '^(0|[0-4](\\.\\d+)?px)$',
			},
			borderStyle: {
				type: 'string',
				enum: ['none', 'solid', 'dashed', 'dotted', 'double'],
			},
			shadow: {
				type: 'string',
				pattern: safeCssPattern,
			},
			backdrop: {
				type: 'string',
				pattern: safeCssPattern,
			},
			bgImage: {
				type: 'string',
				pattern: safeCssPattern,
			},
		},
	}]));

	return {
		type: 'object',
		additionalProperties: false,
		required: ['name', 'appearance', 'skins', 'light', 'dark'],
		properties: {
			name: { type: 'string' },
			appearance: {
				type: 'object',
				additionalProperties: false,
				required: appearanceTokenNames,
				properties: appearanceProperties,
			},
			skins: {
				type: 'object',
				additionalProperties: false,
				required: skinNames,
				properties: skinProperties,
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
