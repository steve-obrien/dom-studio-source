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
	const { formatOperations, resizePoster } = await import('../src/pages/designer/poster/posterResize.js');
	const { posterToDocument, documentToPoster } = await import('../src/pages/designer/poster/posterTypes.js');
	const { createHistory } = await import('../src/pages/designer/core/history.js');
	const { applyOperation } = await import('../src/pages/designer/core/operations.js');
	const doc = posterToDocument(createPoster());
	const before = JSON.stringify(documentToPoster(doc));
	const history = createHistory({ apply: (operation) => applyOperation(doc, operation) });
	history.run(formatOperations(doc, resizePoster(documentToPoster(doc), { width: 1080, height: 1080 })));
	const square = documentToPoster(doc);
	assert.deepEqual([square.width, square.height], [1080, 1080]);
	assert.equal(square.layers[0].height, 1080);
	history.undo();
	assert.equal(JSON.stringify(documentToPoster(doc)), before);
});

test('templates load as posters, and untrusted fields are dropped or clamped', async () => {
	const { readdirSync, readFileSync } = await import('node:fs');
	const { loadTemplates, templateToPoster } = await import('../src/pages/designer/poster/socialTemplates.js');
	const dir = new URL('../src/pages/designer/social/templates/', import.meta.url);
	const files = readdirSync(dir).filter((name) => name.endsWith('.json')).map((name) => JSON.parse(readFileSync(new URL(name, dir), 'utf8')));
	const templates = loadTemplates(files);
	assert.equal(templates.length, files.length, 'every committed template loads');
	for (const { id, poster } of templates) {
		assert.ok(poster.layers.length >= 3, `${id} has layers`);
		for (const layer of poster.layers.filter((item) => item.type === 'text')) {
			const lines = layer.value.split('\n').length;
			assert.ok(layer.height >= layer.fontSize * layer.lineHeight * lines * 0.95, `${id}: ${layer.name} is tall enough for its text`);
		}
	}

	const poster = templateToPoster({
		width: 99999, background: 'red; background:url(x)', title: 'T',
		layers: [
			{ type: 'text', value: '<b>Hi</b>', color: 'javascript:alert(1)', font: 'Comic Sans', fontSize: 9000, onclick: 'x' },
			{ type: 'image', value: 'javascript:alert(1)' },
			{ type: 'script', value: 'alert(1)' },
		],
	});
	assert.equal(poster.width, 4000);
	assert.equal(poster.background, '#ffffff');
	assert.equal(poster.layers.length, 1, 'unsafe images and unknown types are dropped');
	const [layer] = poster.layers;
	assert.equal(layer.color, '#171717');
	assert.equal(layer.fontSize, 500);
	assert.equal(layer.onclick, undefined);
	assert.match(exportPosterHtml(poster), /&lt;b&gt;Hi/);
});

test('applying a template keeps the current format and undoes in one step', async () => {
	const { templateOperations, templateToPoster } = await import('../src/pages/designer/poster/socialTemplates.js');
	const { posterToDocument, documentToPoster } = await import('../src/pages/designer/poster/posterTypes.js');
	const { createHistory } = await import('../src/pages/designer/core/history.js');
	const { applyOperation } = await import('../src/pages/designer/core/operations.js');
	const { readFileSync } = await import('node:fs');
	const raw = JSON.parse(readFileSync(new URL('../src/pages/designer/social/templates/retail-summer-sale.json', import.meta.url), 'utf8'));
	const doc = posterToDocument(createPoster());
	const before = JSON.stringify(documentToPoster(doc));
	const history = createHistory({ apply: (operation) => applyOperation(doc, operation) });
	const { operations, firstId } = templateOperations(doc, templateToPoster(raw));
	history.run(operations);
	const after = documentToPoster(doc);
	assert.deepEqual([after.width, after.height], [1080, 1920], 'the story format is kept');
	assert.equal(after.background, '#e63946');
	assert.equal(after.layers.length, raw.layers.length);
	assert.equal(doc.nodes[firstId].type, 'poster:text');
	history.undo();
	assert.equal(JSON.stringify(documentToPoster(doc)), before);
});

test('a design saved from the studio opens again unchanged, effects included', async () => {
	const { readdirSync, readFileSync } = await import('node:fs');
	const { posterToTemplate, templateToPoster } = await import('../src/pages/designer/poster/socialTemplates.js');
	const { createShadow } = await import('../src/pages/designer/shadow-editor/shadowModel.js');
	const { createBackgroundState, createFill } = await import('../src/pages/designer/background-editor/backgroundModel.js');
	const { createSocialPost } = await import('../src/pages/designer/poster/posterModel.js');
	const roundTrip = (poster) => exportPosterHtml(templateToPoster(JSON.parse(JSON.stringify(posterToTemplate(poster)))));

	const post = createSocialPost();
	const [photo, scrim, , badge, , headline] = post.layers;
	Object.assign(photo, { saturation: 80, sepia: 20, objectFit: 'contain' });
	scrim.background = createBackgroundState({ fills: [createFill({ kind: 'linear', gradientFrom: '#0f172a', gradientFromAlpha: 0, gradientTo: '#0f172a', gradientAngle: 180 })] });
	scrim.backdrop = { enabled: true, blur: 12, saturate: 1.4 };
	badge.border = { enabled: true, width: 6, style: 'dashed', color: 'rgb(255 255 255 / 80%)' };
	badge.shadows = [createShadow({ kind: 'drop', y: 12, blur: 30 }), createShadow({ kind: 'ring', spread: 4, color: '#ffffff', enabled: false })];
	Object.assign(headline, { fill: '#e4572e', textTransform: 'uppercase', lineHeight: 0.6, locked: true });
	assert.equal(roundTrip(post), exportPosterHtml(post));

	const dir = new URL('../src/pages/designer/social/templates/', import.meta.url);
	for (const name of readdirSync(dir).filter((file) => file.endsWith('.json'))) {
		const poster = templateToPoster(JSON.parse(readFileSync(new URL(name, dir), 'utf8')));
		assert.equal(roundTrip(poster), exportPosterHtml(poster), `${name} round-trips`);
	}

	const hidden = createSocialPost();
	hidden.layers[2].hidden = true;
	assert.equal(posterToTemplate(hidden).layers.length, hidden.layers.length - 1, 'hidden layers are not saved');
	assert.equal(templateToPoster({ layers: [{ type: 'shape', fill: 'url(javascript:alert(1))', border: { color: 'red;x:y' } }] }).layers[0].fill, '#e5e5e5');
});

test('saving to the template library always makes a new template', async () => {
	const { createMemoryStorage } = await import('../src/pages/designer/core/storage.js');
	const { createTemplateLibrary } = await import('../src/pages/designer/poster/socialTemplates.js');
	const library = createTemplateLibrary(createMemoryStorage());
	const poster = createPoster();
	const first = await library.saveAs(poster, { industry: 'travel' }, ['a-weekend-in-the-highlands']);
	assert.equal(first, 'a-weekend-in-the-highlands-2', 'a built-in id is never reused');
	poster.layers[1].value = 'CHANGED';
	const second = await library.saveAs(poster, { industry: 'travel' }, ['a-weekend-in-the-highlands']);
	assert.equal(second, 'a-weekend-in-the-highlands-3');
	const saved = await library.list();
	assert.deepEqual(saved.map((template) => template.id).sort(), [first, second]);
	assert.equal(saved.find((template) => template.id === first).poster.layers[1].value, 'A WEEKEND IN\nTHE HIGHLANDS', 'the first save is untouched');
	assert.equal(saved[0].industry, 'travel');
});

test('switching formats back and forth returns the original design exactly', async () => {
	const { readFileSync } = await import('node:fs');
	const { formatSource, formatOperations, resizePoster, socialFormats } = await import('../src/pages/designer/poster/posterResize.js');
	const { templateToPoster } = await import('../src/pages/designer/poster/socialTemplates.js');
	const { posterToDocument, documentToPoster } = await import('../src/pages/designer/poster/posterTypes.js');
	const { applyOperation } = await import('../src/pages/designer/core/operations.js');
	const raw = JSON.parse(readFileSync(new URL('../src/pages/designer/social/templates/restaurant-taco-tuesday.json', import.meta.url), 'utf8'));
	const doc = posterToDocument(templateToPoster(raw));
	const original = JSON.stringify(documentToPoster(doc));
	let base = null;
	const switchTo = (format) => {
		const current = documentToPoster(doc);
		base = formatSource(base, current);
		for (const operation of formatOperations(doc, resizePoster(base, format))) applyOperation(doc, operation);
	};
	for (let round = 0; round < 5; round += 1) for (const format of socialFormats) switchTo(format);
	switchTo({ width: 1080, height: 1350 });
	assert.equal(JSON.stringify(documentToPoster(doc)), original, 'no drift after 35 switches');

	switchTo({ width: 1280, height: 720 });
	const headline = doc.nodes[doc.nodes[doc.rootId].children.find((id) => doc.nodes[id].label === 'Headline')];
	applyOperation(doc, { op: 'setProp', id: headline.id, key: 'fontSize', value: 140 });
	switchTo({ width: 1080, height: 1350 });
	switchTo({ width: 1280, height: 720 });
	assert.equal(headline.props.fontSize, 140, 'an edit made in one format becomes the new source');
	assert.equal(JSON.stringify(resizePoster(base, { width: base.width, height: base.height })), JSON.stringify(base), 'resizing to the same size changes nothing');
});
