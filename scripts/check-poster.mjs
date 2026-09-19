import assert from 'node:assert/strict';
import test from 'node:test';
import { applyPosterGeometry, createPoster, createPosterLayer, exportPosterHtml, posterHtmlLines, posterLayerStyle, safePosterImage } from '../src/pages/designer/poster/posterModel.js';

test('poster exports real HTML in stacking order without editor overlays', () => {
	const poster = createPoster();
	const html = exportPosterHtml(poster);
	assert.ok(html.indexOf('<img') < html.indexOf('<p '));
	assert.match(html, /width:1080px;height:1920px/);
	assert.doesNotMatch(html, /<canvas|data-designer|data-selected/);
	poster.layers[0].hidden = true;
	assert.equal(posterHtmlLines(poster).filter((line) => line.id === 'photo').length, 0);
});

test('export escapes edited text, names and document titles', () => {
	const poster = createPoster();
	poster.title = '</title><script>alert(1)</script>';
	poster.layers[1].value = '<img src=x onerror=alert(1)>';
	poster.layers[0].name = 'Photo" onload="alert(1)';
	const html = exportPosterHtml(poster);
	assert.doesNotMatch(html, /<script>|<img src=x|alt="Photo" onload/);
	assert.match(html, /&lt;img src=x/);
});

test('image values reject executable URLs and SVG data while accepting local raster images', () => {
	assert.equal(safePosterImage('javascript:alert(1)'), '');
	assert.equal(safePosterImage('data:image/svg+xml;base64,PHN2Zz4='), '');
	assert.equal(safePosterImage('data:image/png;base64,aGVsbG8='), 'data:image/png;base64,aGVsbG8=');
	assert.equal(safePosterImage('https://images.unsplash.com/photo-test'), 'https://images.unsplash.com/photo-test');
});

test('stage changes respect locked layers and reject non-finite or tiny geometry', () => {
	const layer = createPosterLayer('text', 'test');
	applyPosterGeometry(layer, { left: '144px', top: '-20px', width: '0px', height: 'NaN' });
	assert.deepEqual([layer.x, layer.y, layer.width, layer.height], [144, -20, 16, 260]);
	layer.locked = true;
	applyPosterGeometry(layer, { left: '300px' });
	assert.equal(layer.x, 144);
});

test('rendered image and typography styles preserve independent layer controls', () => {
	const photo = createPosterLayer('image', 'photo', { saturation: 20, sepia: 30, brightness: 110, blur: 4 });
	assert.equal(posterLayerStyle(photo, 0).filter, 'blur(4px) saturate(20%) brightness(110%) sepia(30%)');
	const title = createPosterLayer('text', 'title', { textAlign: 'left', lineHeight: 1.4, letterSpacing: 3 });
	const style = posterLayerStyle(title, 2);
	assert.equal(style.zIndex, 2);
	assert.equal(style.textAlign, 'left');
	assert.equal(style.letterSpacing, '3px');
});
