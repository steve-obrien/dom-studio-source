import test from 'node:test';
import assert from 'node:assert/strict';
import { createFill, createBackgroundState, backgroundImageToCss, duplicateFillLayer } from '../src/pages/designer/background-editor/backgroundModel.js';
import { createBackdrop, backdropToCss } from '../src/pages/designer/backdrop-editor/backdropModel.js';
import { backgroundImageToCss as themeBackground, backdropToCss as themeBackdrop } from '../src/pages/experiments/css-button-creator/lib/styleModel.js';
import { createPoster, posterLayerStyle, exportPosterHtml } from '../src/pages/designer/poster/posterModel.js';

test('mixed backgrounds serialize in CSS image order and preserve hidden layers', () => {
	const value = createBackgroundState({ fills: [{ kind: 'solid', color: '#ff0000' }, { kind: 'linear' }] });
	const css = backgroundImageToCss(value);
	assert.match(css, /^linear-gradient\(/);
	assert.match(css, /, linear-gradient\(135deg/);
	assert.equal(themeBackground(value), css);
	value.fills[0].enabled = false;
	assert.match(backgroundImageToCss(value), /^linear-gradient\(135deg/);
	value.enabled = false;
	assert.equal(backgroundImageToCss(value), 'none');
	assert.equal(value.fills.length, 2);
});

test('duplicate fills have independent identity and empty backgrounds are valid', () => {
	const value = createBackgroundState({}, { allowEmpty: true });
	assert.equal(backgroundImageToCss(value), 'none');
	value.fills.push(createFill());
	duplicateFillLayer(value, 0);
	assert.notEqual(value.fills[0].id, value.fills[1].id);
	value.fills[1].color = '#ffffff';
	assert.notEqual(value.fills[0].color, value.fills[1].color);
});

test('backdrop state serializes consistently for the theme, poster and export', () => {
	const value = createBackdrop({ enabled: true, blur: 12, saturate: 1.3 });
	assert.equal(backdropToCss(value), 'blur(12px) saturate(1.3)');
	assert.equal(themeBackdrop(value), backdropToCss(value));
	assert.equal(backdropToCss({ ...value, enabled: false }), 'none');
	const poster = createPoster();
	poster.layers[1].backdrop = value;
	poster.layers[1].background = createBackgroundState();
	const styles = posterLayerStyle(poster.layers[1], 1);
	assert.equal(styles.backdropFilter, backdropToCss(value));
	assert.equal(styles.WebkitBackdropFilter, styles.backdropFilter);
	assert.match(exportPosterHtml(poster), /backdrop-filter:blur\(12px\) saturate\(1.3\)/);
	assert.match(styles.backgroundImage, /^linear-gradient\(/);
});
