import assert from 'node:assert/strict';
import test from 'node:test';
import {
	buildGoogleFontsStylesheetUrl,
	filterFonts,
	fontStack,
	normalizeFont,
} from '../src/pages/forms/font-picker/fontPicker.js';
import { googleFonts } from '../src/pages/forms/font-picker/googleFonts.js';

test('bundled metadata covers the current Google Fonts family catalog', () => {
	assert.equal(googleFonts.length, 1946);
	assert.ok(googleFonts.some((font) => font.family === 'Lato'));
});

test('font search prioritizes exact and prefix family matches', () => {
	const fonts = [
		{ family: 'Chocolate Classical Sans', category: 'sans-serif' },
		{ family: 'Alata', category: 'sans-serif' },
		{ family: 'Lato', category: 'sans-serif' },
	];
	assert.deepEqual(filterFonts(fonts, 'lat', 3).map((font) => font.family), ['Lato', 'Alata', 'Chocolate Classical Sans']);
});

test('font search limits rows and supports category filters', () => {
	const fonts = [
		{ family: 'Lato', category: 'sans-serif' },
		{ family: 'Lateef', category: 'serif' },
		{ family: 'Inconsolata', category: 'monospace' },
	];
	assert.deepEqual(filterFonts(fonts, 'lat', 1).map((font) => font.family), ['Lato']);
	assert.deepEqual(filterFonts(fonts, 'lat', 5, 'serif').map((font) => font.family), ['Lateef']);
});

test('stylesheet URL requests unique families and an exact glyph subset', () => {
	const url = buildGoogleFontsStylesheetUrl(['Lato', 'Open Sans', 'Lato'], 'Lato Open Sans');
	assert.equal(url, 'https://fonts.googleapis.com/css2?family=Lato&family=Open+Sans&text=Lato%20Open%20Sans&display=swap');
});

test('font records and stacks accept string and object inputs', () => {
	assert.equal(normalizeFont('Lato').family, 'Lato');
	assert.equal(fontStack({ family: "DM Sans", category: 'sans-serif' }), "'DM Sans', sans-serif");
	assert.equal(fontStack({ family: 'Hand', category: 'handwriting' }), "'Hand', cursive");
	assert.equal(fontStack({ family: 'Display', category: 'display' }), "'Display', sans-serif");
	assert.equal(normalizeFont(null), null);
});
