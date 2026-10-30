import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

await loadEnvFile('.env');
await loadEnvFile('.env.local');

const endpoint = process.env.THEME_AI_ENDPOINT || 'http://localhost:8100/api/ai/theme';
const publicToken = process.env.THEME_AI_PUBLIC_TOKEN || process.env.VITE_THEME_AI_PUBLIC_TOKEN || '';

const response = await fetch(endpoint, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		...(publicToken ? { 'Authorization': `Bearer ${publicToken}` } : {}),
	},
	body: JSON.stringify({
		prompt: process.argv.slice(2).join(' ') || 'brand color is yellow and big and bold',
		tokens: {},
	}),
});

const payload = await response.json().catch(() => ({}));

if (!response.ok) {
	console.error(payload.error || `Theme endpoint returned ${response.status}`);
	process.exit(1);
}

const requiredModes = ['light', 'dark'];
const requiredTokens = ['--background', '--fg', '--primary', '--primary-fg', '--border', '--ring'];
const requiredAppearanceTokens = ['--radius'];
const requiredSkinLevels = ['raised', 'floating', 'overlay', 'control', 'action'];
const requiredSkinTokens = ['bg', 'fg', 'border', 'borderWidth', 'borderStyle', 'shadow', 'backdrop', 'bgImage'];
const missing = requiredModes.flatMap((mode) => requiredTokens
	.filter((token) => !payload[mode]?.[token])
	.map((token) => `${mode}.${token}`));
const missingAppearance = requiredAppearanceTokens
	.filter((token) => !payload.appearance?.[token])
	.map((token) => `appearance.${token}`);
const missingSkins = requiredSkinLevels.flatMap((level) => requiredSkinTokens
	.filter((token) => !payload.skins?.[level]?.[token])
	.map((token) => `skins.${level}.${token}`));

if (missing.length || missingAppearance.length || missingSkins.length) {
	console.error(`Theme endpoint response is missing: ${[...missing, ...missingAppearance, ...missingSkins].join(', ')}`);
	process.exit(1);
}

console.log(`Theme endpoint OK: ${payload.name || 'unnamed theme'}`);

async function loadEnvFile(path) {
	try {
		const contents = await readFile(resolve(path), 'utf8');
		for (const line of contents.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
			if (!match || process.env[match[1]]) continue;
			process.env[match[1]] = unquoteEnvValue(match[2]);
		}
	} catch {
		// Optional env file.
	}
}

function unquoteEnvValue(value) {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"'))
		|| (trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}
