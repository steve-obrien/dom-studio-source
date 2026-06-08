import { createHead, renderHeadTags } from './ssrHead.js'

export function createSsrContext() {
	return {
		status: 200,
		head: createHead(),
		payload: {},
		prefetch: []
	}
}

export function renderTemplateHtml(template, { appHtml, context, manifest, payload }) {
	return template
		.replace('<!--now-head-->', () => renderHeadTags(context.head))
		.replace('<!--now-preload-links-->', () => renderPreloadLinks(context.modules || [], manifest) + renderPrefetchLinks(context.prefetch || []))
		.replace('<!--now-html-->', () => appHtml)
		.replace('<!--now-payload-->', () => payload)
}

export function serializePayload(payload = {}) {
	return JSON.stringify(payload)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029')
}

function renderPreloadLinks(modules, manifest) {
	let links = ''
	const seen = new Set()

	for (const id of modules) {
		const files = manifest[id]
		if (!files) continue

		for (const file of files) {
			if (seen.has(file)) continue
			seen.add(file)
			links += renderPreloadLink(file)
		}
	}

	return links
}

function renderPreloadLink(file) {
	if (file.endsWith('.js')) {
		return `<link rel="modulepreload" crossorigin href="${file}">`
	}

	if (file.endsWith('.css')) {
		return `<link rel="stylesheet" href="${file}">`
	}

	if (file.endsWith('.woff')) {
		return `<link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
	}

	if (file.endsWith('.woff2')) {
		return `<link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
	}

	if (/\.(gif|jpe?g|png|webp|avif)$/.test(file)) {
		return `<link rel="preload" href="${file}" as="image">`
	}

	return ''
}

function renderPrefetchLinks(prefetch) {
	return prefetch
		.map((item) => `<link rel="prefetch" href="${item}">`)
		.join('')
}
