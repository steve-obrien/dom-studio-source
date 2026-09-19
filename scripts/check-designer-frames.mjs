import test from 'node:test';
import assert from 'node:assert/strict';
import { alignFrameChild, createFrameLayout, frameLayoutStyle, measureFrameChild, spaceFrameChildren } from '../src/pages/designer/frame/frameLayout.js';
import { createFrameDemo, createFrameNode, exportFrameHtml, frameNodeStyle, frameTailwindContent } from '../src/pages/designer/frames/frameDocument.js';

test('absolute canvas → flex row → absolute composition separates placement and child layout', () => {
	const root = createFrameDemo();
	const row = root.children[0];
	const composition = row.children[1];
	assert.equal(frameNodeStyle(row, root).position, 'absolute !important');
	assert.equal(frameNodeStyle(row, root).display, 'flex !important');
	assert.equal(frameNodeStyle(composition, row).position, 'relative !important');
	assert.equal(frameNodeStyle(composition, row).display, 'block !important');
	assert.equal(frameNodeStyle(composition.children[0], composition).position, 'absolute !important');
	const position = { ...composition.children[0].placements.absolute };
	composition.layout.mode = 'grid';
	assert.equal(frameNodeStyle(composition.children[0], composition).position, 'relative !important');
	assert.equal(frameNodeStyle(composition.children[0], composition).left, undefined);
	composition.layout.mode = 'absolute';
	assert.deepEqual(composition.children[0].placements.absolute, position);
	assert.equal(frameNodeStyle(composition.children[0], composition).left, `${position.left}px !important`);
});

test('layout CSS resets incompatible display modes without choosing absolute parent placement', () => {
	for (const mode of ['flow', 'flex', 'grid', 'absolute']) {
		const style = frameLayoutStyle(createFrameLayout({ mode, gap: 18 }));
		assert.equal(style.position, 'relative');
		assert.equal(style.gap, '18px');
		assert.equal(style.display, ['flex', 'grid'].includes(mode) ? mode : 'block');
		assert.equal(style.gridTemplateColumns === 'none', mode !== 'grid');
	}
});

test('measurements account for zoom, borders and parent scrolling', () => {
	const child = { getBoundingClientRect: () => ({ left: 124, top: 238, width: 160, height: 80 }) };
	const parent = { getBoundingClientRect: () => ({ left: 100, top: 200, width: 400 }), offsetWidth: 200, clientLeft: 2, clientTop: 3, scrollLeft: 10, scrollTop: 20 };
	assert.deepEqual(measureFrameChild(child, parent), { left: 20, top: 36, width: 80, height: 40 });
});

test('alignment and explicit spacing stay in containing-frame coordinates', () => {
	const rect = { left: 20, top: 30, width: 80, height: 40 };
	assert.equal(alignFrameChild(rect, { width: 300, height: 200 }, 'right', 16).left, 204);
	assert.equal(alignFrameChild(rect, { width: 300, height: 200 }, 'middle').top, 80);
	const rects = [rect, { left: 200, top: 30, width: 100, height: 40 }, { left: 140, top: 30, width: 40, height: 40 }];
	assert.deepEqual(spaceFrameChildren(rects, 'x', 12).map((item) => item.left), [20, 164, 112]);
	assert.equal(rects[1].left, 200);
});

test('HTML projection preserves classes and literal text and excludes editor markers', () => {
	const root = createFrameDemo();
	root.children[0].attrs.title = 'A "frame" & <content>';
	const html = exportFrameHtml(root);
	assert.match(html, /display:flex !important/);
	assert.match(html, /title="A &quot;frame&quot; &amp; &lt;content&gt;"/);
	assert.doesNotMatch(html, /data-designer|DomDesignerFrame|frame-node-/);
	assert.match(html, /class="rounded-lg bg-primary/);
});

test('compiler input preserves arbitrary variants while HTML export escapes their attributes', () => {
	const root = createFrameNode({ attrs: { class: '[&>p]:mt-4 w-[137px]' } });
	assert.match(frameTailwindContent(root), /class="\[&>p\]:mt-4"/);
	assert.match(exportFrameHtml(root), /\[&amp;&gt;p\]:mt-4/);
});
