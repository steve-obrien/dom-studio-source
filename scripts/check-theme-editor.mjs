import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeThemeCss } from '../src/pages/theming/lib/themeExport.js';
import { resolveEditorColor } from '../src/pages/experiments/css-button-creator/lib/cssEditorContext.js';

/**
 * Creates a minimal two-mode export fixture with independent palettes and skins.
 *
 * @returns {object} Fresh theme data for each test.
 */
function createTheme() {
	return {
		appearance: { '--radius': '0.625rem' },
		colors: { light: { '--canvas': '#ffffff' }, dark: { '--canvas': '#101010' } },
		skins: {
			light: { '--skin-card-bg': 'var(--canvas)', '--skin-card-border': 'var(--border)' },
			dark: { '--skin-card-bg': 'var(--canvas)', '--skin-card-border': 'var(--border)' },
		},
		skinDefaults: { '--skin-card-bg': 'var(--canvas)', '--skin-card-border': 'var(--border)' },
	};
}

test('dark skin colours are exported only in the dark selector', () => {
	const theme = createTheme();
	theme.skins.dark['--skin-card-bg'] = '#223344';
	theme.skins.dark['--skin-card-border'] = '#556677';
	const [light, dark] = serializeThemeCss(theme).split('\n\n');
	assert.match(light, /^:root \{/);
	assert.doesNotMatch(light, /#223344|#556677/);
	assert.match(dark, /^\[data-theme="dark"\] \{/);
	assert.match(dark, /--skin-card-bg: #223344;/);
	assert.match(dark, /--skin-card-border: #556677;/);
	assert.equal(theme.skins.light['--skin-card-bg'], 'var(--canvas)');
});

test('dark defaults explicitly cancel custom light skins', () => {
	const theme = createTheme();
	theme.skins.light['--skin-card-bg'] = '#f0e0d0';
	const [light, dark] = serializeThemeCss(theme).split('\n\n');
	assert.match(light, /--skin-card-bg: #f0e0d0;/);
	assert.match(dark, /--skin-card-bg: var\(--canvas\);/);
});

test('identical skins inherit without redundant dark overrides', () => {
	const theme = createTheme();
	theme.skins.light['--skin-card-border'] = '#888888';
	theme.skins.dark['--skin-card-border'] = '#888888';
	const [light, dark] = serializeThemeCss(theme).split('\n\n');
	assert.match(light, /--skin-card-border: #888888;/);
	assert.doesNotMatch(dark, /--skin-card-border/);
	assert.match(light, /\t--radius: 0.625rem;/);
	assert.match(dark, /\t--canvas: #101010;/);
	assert.doesNotMatch(dark, /--radius/);
});

test('colour controls resolve linked variables using the active palette', () => {
	const variables = { '--canvas': '#101010', '--skin-card-bg': 'var(--canvas)', '--border': '#343434' };
	assert.equal(resolveEditorColor('var(--skin-card-bg)', variables), '#101010');
	assert.equal(resolveEditorColor('color-mix(in oklch, var(--canvas) 80%, var(--border))', variables), 'color-mix(in oklch, #101010 80%, #343434)');
	assert.equal(variables['--skin-card-bg'], 'var(--canvas)');
});

test('unknown and circular references terminate without inventing colours', () => {
	assert.equal(resolveEditorColor('var(--unknown)', {}), 'var(--unknown)');
	assert.equal(resolveEditorColor('var(--a)', { '--a': 'var(--b)', '--b': 'var(--a)' }), 'var(--a)');
});
