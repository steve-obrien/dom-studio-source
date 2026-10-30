import { onServerPrefetch, ref, useSSRContext } from 'vue'
import { getNowPayload } from './payload.js'

export function useAsyncData(key, loader, options = {}) {
	const ssrContext = import.meta.env.SSR ? useSSRContext() : null
	const payload = getClientPayload()
	const hasInitial = Boolean(payload?.asyncData && Object.hasOwn(payload.asyncData, key))
	const initial = hasInitial ? payload.asyncData[key] : options.default ?? null
	const data = ref(initial)
	const pending = ref(!hasInitial)
	const error = ref(null)

	const execute = async () => {
		pending.value = true
		error.value = null

		try {
			data.value = await loader()
			writeServerPayload(ssrContext, key, data.value)
		} catch (err) {
			error.value = err
		} finally {
			pending.value = false
		}

		return data.value
	}

	if (import.meta.env.SSR) {
		onServerPrefetch(execute)
	} else if (!hasInitial && options.immediate !== false) {
		execute()
	}

	return { data, pending, error, execute }
}

function writeServerPayload(ssrContext, key, value) {
	if (!ssrContext) return

	ssrContext.payload = ssrContext.payload || {}
	ssrContext.payload.asyncData = ssrContext.payload.asyncData || {}
	ssrContext.payload.asyncData[key] = value
}

function getClientPayload() {
	if (typeof window === 'undefined') return null
	return getNowPayload()
}
