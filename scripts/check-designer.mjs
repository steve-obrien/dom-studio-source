import assert from 'node:assert/strict';
import test from 'node:test';
import { createShadow, shadowListToCss, duplicateShadowLayer, removeShadowLayer } from '../src/pages/designer/shadow-editor/shadowModel.js';
import { resolveEditorColor } from '../src/pages/designer/_shared/cssEditorContext.js';

test('shadow serialization preserves stacking order and excludes disabled layers', () => {
	const layers = [createShadow({ kind: 'inset', x: 1, y: 2, blur: 3, spread: 4 }), createShadow({ enabled: false }), createShadow({ kind: 'ring', spread: 2 })];
	assert.equal(shadowListToCss(layers), 'inset 1px 2px 3px 4px rgba(0, 0, 0, 0.20), 0 0 0 2px rgba(0, 0, 0, 0.20)');
	assert.equal(shadowListToCss([]), 'none');
	assert.equal(shadowListToCss([createShadow({ enabled: false })]), 'none');
});

test('duplicating a shadow preserves its style while assigning an independent identity', () => {
	const layers = [createShadow({ x: 12, color: '#ff0000' })];
	duplicateShadowLayer(layers, 0);
	assert.notEqual(layers[0].id, layers[1].id);
	assert.equal(layers[1].x, 12);
	layers[1].x = 25;
	assert.equal(layers[0].x, 12);
	removeShadowLayer(layers, 1);
	assert.equal(layers.length, 1);
});

test('theme colour references resolve without rewriting unknown values or recursing forever', () => {
	assert.equal(resolveEditorColor('var(--surface)', { '--surface': 'var(--brand)', '--brand': '#abcdef' }), '#abcdef');
	assert.equal(resolveEditorColor('var(--missing)'), 'var(--missing)');
	assert.equal(resolveEditorColor('var(--a)', { '--a': 'var(--b)', '--b': 'var(--a)' }), 'var(--a)');
});
