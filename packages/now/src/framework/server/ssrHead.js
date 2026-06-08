export function createHead() {
	return {
		title: '',
		meta: [],
		link: [],
		script: []
	}
}

export function renderHeadTags(head = createHead()) {
	const tags = []

	if (head.title) {
		tags.push(`<title>${escapeHtml(head.title)}</title>`)
	}

	for (const meta of head.meta || []) {
		tags.push(`<meta${renderAttrs(meta)}>`)
	}

	for (const link of head.link || []) {
		tags.push(`<link${renderAttrs(link)}>`)
	}

	for (const script of head.script || []) {
		const { innerHTML, ...attrs } = script
		tags.push(`<script${renderAttrs(attrs)}>${escapeScript(innerHTML || '')}</script>`)
	}

	return tags.join('\n')
}

function renderAttrs(attrs = {}) {
	return Object.entries(attrs)
		.filter(([, value]) => value !== undefined && value !== null && value !== false)
		.map(([key, value]) => value === true
			? ` ${key}`
			: ` ${key}="${escapeHtml(String(value))}"`)
		.join('')
}

function escapeHtml(value) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

function escapeScript(value) {
	return String(value).replace(/<\/script/gi, '<\\/script')
}
