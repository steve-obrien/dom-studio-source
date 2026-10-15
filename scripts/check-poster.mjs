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

test('resize pins each layer to the frame instead of squashing it', async () => {
	const { guessPin, resizeLayer, resizePoster } = await import('../src/pages/designer/poster/posterResize.js');
	assert.equal(guessPin(0, 1080, 1080), 'stretch');
	assert.equal(guessPin(40, 1000, 1080), 'stretch');
	assert.equal(guessPin(340, 400, 1080), 'center');
	assert.equal(guessPin(80, 300, 1080), 'start');
	assert.equal(guessPin(700, 300, 1080), 'end');

	const story = createPoster();
	const card = resizePoster(story, { width: 1200, height: 630 });
	const [photo, headline] = card.layers;
	assert.deepEqual([photo.x, photo.y, photo.width, photo.height], [0, 0, 1200, 630], 'a full-bleed photo still covers the frame');
	const k = 630 / 1920;
	assert.equal(headline.fontSize, Math.round(120 * k), 'type scales uniformly by the smaller ratio');
	assert.ok(headline.y < 60, 'a headline near the top stays near the top');

	const right = createPosterLayer('shape', 'badge', { x: 880, y: 80, width: 120, height: 120, radius: 60 });
	const moved = resizeLayer(right, { width: 1080, height: 1080 }, { width: 1600, height: 900 });
	assert.equal(1600 - moved.x - moved.width, Math.round(80 * (900 / 1080)), 'a right-pinned badge keeps its scaled right margin');
	assert.equal(moved.width, moved.height, 'pinned layers keep their aspect ratio');
	assert.equal(moved.radius, 50);

	const scaled = resizeLayer({ ...right, pinX: 'scale', pinY: 'scale' }, { width: 1080, height: 1080 }, { width: 2160, height: 540 });
	assert.deepEqual([scaled.x, scaled.width, scaled.y, scaled.height], [1760, 240, 40, 60], 'scale keeps the old proportional behaviour');
});

test('resizing a poster document is one undoable step', async () => {
	const { resizeOperations } = await import('../src/pages/designer/poster/posterResize.js');
	const { posterToDocument, documentToPoster } = await import('../src/pages/designer/poster/posterTypes.js');
	const { createHistory } = await import('../src/pages/designer/core/history.js');
	const { applyOperation } = await import('../src/pages/designer/core/operations.js');
	const doc = posterToDocument(createPoster());
	const before = JSON.stringify(documentToPoster(doc));
	const history = createHistory({ apply: (operation) => applyOperation(doc, operation) });
	history.run(resizeOperations(doc, { width: 1080, height: 1080 }));
	const square = documentToPoster(doc);
	assert.deepEqual([square.width, square.height], [1080, 1080]);
	assert.equal(square.layers[0].height, 1080);
	history.undo();
	assert.equal(JSON.stringify(documentToPoster(doc)), before);
});
