import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesignerBorder, borderToCss } from '../src/pages/designer/border-editor/borderModel.js';
import { createPoster, posterLayerStyle, exportPosterHtml } from '../src/pages/designer/poster/posterModel.js';

test('border serialization preserves colour expressions and hidden settings', () => {
	const border = createDesignerBorder({ width: 4, style: 'dashed', color: 'var(--primary)' });
	assert.equal(borderToCss(border), '4px dashed var(--primary)');
	assert.equal(borderToCss({ ...border, enabled: false }), 'none');
	assert.equal(border.width, 4);
	assert.equal(borderToCss({ ...border, style: 'none' }), 'none');
	assert.equal(createDesignerBorder({ width: -3 }).width, 0);
	assert.equal(createDesignerBorder({ width: Infinity }).width, 1);
});

test('poster border styles and exports agree and layer defaults are independent', () => {
	const poster = createPoster();
	poster.layers[1].border = createDesignerBorder({ width: 8, color: '#ff0000' });
	assert.equal(poster.layers[0].border.enabled, false);
	assert.equal(posterLayerStyle(poster.layers[1], 1).border, '8px solid #ff0000');
	assert.equal(posterLayerStyle(poster.layers[1], 1).boxSizing, 'border-box');
	assert.match(exportPosterHtml(poster), /border:8px solid #ff0000/);
});
