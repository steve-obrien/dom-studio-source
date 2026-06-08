import { useSSRContext } from 'vue'

export function useHead() {
	if (import.meta.env.SSR) {
		const ssrContext = useSSRContext()
		ssrContext.head = ssrContext.head || createHead()

		return createHeadMutators(ssrContext.head)
	}

	return {
		setTitle(title) {
			document.title = title || ''
		},
		setMeta(meta) {
			upsertElements('meta', meta, ['name', 'property', 'http-equiv', 'charset'])
		},
		setLink(link) {
			upsertElements('link', link, ['rel', 'href'])
		},
		setScript(script) {
			upsertElements('script', script, ['id', 'src', 'type'])
		},
		setLdJson(id, data) {
			upsertElements('script', [{
				id,
				type: 'application/ld+json',
				innerHTML: JSON.stringify(data)
			}], ['id'])
		}
	}
}

export function useRouteStatus(status) {
	if (import.meta.env.SSR) {
		const ssrContext = useSSRContext()
		ssrContext.status = status
	}
}

export function createHead() {
	return {
		title: '',
		meta: [],
		link: [],
		script: []
	}
}

function createHeadMutators(head) {
	return {
		setTitle(title) {
			head.title = title || ''
		},
		setMeta(meta) {
			head.meta = meta || []
		},
		setLink(link) {
			head.link = link || []
		},
		setScript(script) {
			head.script = script || []
		},
		setLdJson(id, data) {
			head.script = head.script.filter((script) => script.id !== id)
			head.script.push({
				id,
				type: 'application/ld+json',
				innerHTML: JSON.stringify(data)
			})
		}
	}
}

function upsertElements(tag, items = [], identityAttrs = []) {
	for (const item of items) {
		const selector = identityAttrs
			.filter((attr) => item[attr])
			.map((attr) => `[${attr}="${cssEscape(String(item[attr]))}"]`)
			.join('')

		let element = selector ? document.head.querySelector(`${tag}${selector}`) : null
		if (!element) {
			element = document.createElement(tag)
			document.head.appendChild(element)
		}

		for (const [key, value] of Object.entries(item)) {
			if (key === 'innerHTML') {
				element.textContent = value
			} else if (value !== undefined && value !== null) {
				element.setAttribute(key, value)
			}
		}
	}
}

function cssEscape(value) {
	return value.replace(/"/g, '\\"')
}
