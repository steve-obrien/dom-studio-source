#!/usr/bin/env node
/**
 * Generates social post templates with a model and writes them as JSON files
 * the Social post studio loads.
 *
 *   OPENAI_API_KEY=… node scripts/generate-social-templates.mjs --industry fitness --kind offer --count 3
 *
 * Without --industry or --kind it covers every industry and kind. Each result
 * is checked with templateToPoster (the same check the studio runs) and must
 * keep at least three layers on the frame, otherwise it is skipped. Files go
 * to src/pages/designer/social/templates unless --out is given, and existing
 * files are never overwritten. Agencies can point --out at their own folder.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { resolveThemeAiConfig } from '../server/lib/themeAi.js';
import { templateIndustries, templateJsonSchema, templateKinds, templateToPoster } from '../src/pages/designer/poster/socialTemplates.js';

const { values } = parseArgs({
	options: {
		industry: { type: 'string' },
		kind: { type: 'string' },
		count: { type: 'string', default: '1' },
		brief: { type: 'string', default: '' },
		out: { type: 'string', default: 'src/pages/designer/social/templates' },
		model: { type: 'string' },
	},
});

const instructions = [
	'You design social media post templates as JSON for an HTML design editor. Return only the structured JSON.',
	'The frame is 1080 wide and 1350 tall. Layers are listed back to front. Keep 72px margins for text unless a layer deliberately bleeds off the frame.',
	'Use type "shape" for colour blocks, bars, circles (radius = half the size) and buttons; use type "text" for copy. Shapes ignore font fields and text ignores fill; still fill every field.',
	'Make each text box tall enough for its copy: at least fontSize × lineHeight × number of lines. Use \\n for deliberate line breaks. Never let text overlap other text.',
	'Fonts: condensed is a heavy display face for short uppercase headlines; sans for body, labels and buttons; serif for elegant headlines and quotes; mono for small technical eyebrows.',
	'Use 2–4 hex colours with strong contrast between text and whatever sits behind it. Do not use photos; use shapes where a photo would go and name that layer "Photo".',
	'Write realistic copy for a fictional small business: a brand name, one clear headline, one supporting line and one call to action or detail line. No lorem ipsum, no emoji, no real brands.',
	'Set pinX/pinY so the post resizes well to landscape and story formats: "stretch" for full-width bands and headlines that should use extra width, "start"/"end" for corner elements, "center" for centred badges, otherwise "auto".',
].join('\n');

const config = resolveThemeAiConfig();
if (!config.apiKey) {
	console.error('Set OPENAI_API_KEY to generate templates.');
	process.exit(1);
}
const model = values.model || process.env.OPENAI_TEMPLATE_MODEL || 'gpt-4.1';
const industries = values.industry ? templateIndustries.filter((item) => item.value === values.industry) : templateIndustries;
const kinds = values.kind ? templateKinds.filter((item) => item.value === values.kind) : templateKinds;
if (!industries.length || !kinds.length) {
	console.error(`Industry must be one of ${templateIndustries.map((item) => item.value).join(', ')}; kind one of ${templateKinds.map((item) => item.value).join(', ')}.`);
	process.exit(1);
}
const count = Math.max(1, Math.min(10, Number(values.count) || 1));
const out = resolve(values.out);
mkdirSync(out, { recursive: true });

function slug(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

async function generate(industry, kind, attempt) {
	const response = await fetch('https://api.openai.com/v1/responses', {
		method: 'POST',
		headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model,
			instructions,
			input: `Design a ${kind.label.toLowerCase()} post for the ${industry.label.toLowerCase()} industry. Variation ${attempt + 1}: choose a distinct layout and palette.${values.brief ? `\nBrief: ${values.brief}` : ''}`,
			text: { format: { type: 'json_schema', name: 'social_post_template', schema: templateJsonSchema(), strict: true } },
			max_output_tokens: 4000,
		}),
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error?.message || `OpenAI request failed with status ${response.status}.`);
	const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
	return JSON.parse(text);
}

let written = 0;
for (const industry of industries) {
	for (const kind of kinds) {
		for (let attempt = 0; attempt < count; attempt += 1) {
			try {
				const raw = await generate(industry, kind, attempt);
				const poster = templateToPoster(raw);
				const visible = poster.layers.filter((layer) => layer.x < poster.width && layer.y < poster.height && layer.x + layer.width > 0 && layer.y + layer.height > 0);
				if (visible.length < 3) { console.warn(`Skipped ${industry.value}/${kind.value}: too few usable layers.`); continue; }
				const id = `${industry.value}-${slug(raw.title || kind.value)}`;
				const file = join(out, `${id}.json`);
				if (existsSync(file)) { console.warn(`Skipped ${id}: file exists.`); continue; }
				writeFileSync(file, `${JSON.stringify({ id, title: raw.title, industry: industry.value, kind: kind.value, source: `generated:${model}`, ...raw }, null, '\t')}\n`);
				written += 1;
				console.log(`Wrote ${file}`);
			} catch (error) {
				console.warn(`Failed ${industry.value}/${kind.value}: ${error.message}`);
			}
		}
	}
}
console.log(`${written} template${written === 1 ? '' : 's'} written. Open /designer/social to review them.`);
