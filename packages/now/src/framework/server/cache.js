export function createMemoryCache() {
	const data = new Map()

	return {
		clear(key) {
			key ? data.delete(key) : data.clear()
		},
		exists(key) {
			const item = data.get(key)
			if (!item) return false

			if (item.expiry && Date.now() > item.expiry) {
				data.delete(key)
				return false
			}

			return true
		},
		get(key) {
			if (!this.exists(key)) return undefined
			return data.get(key).value
		},
		set(key, value, ttl = null) {
			data.set(key, {
				value,
				timestamp: Date.now(),
				expiry: ttl ? Date.now() + ttl : null
			})

			return value
		},
		async getOrSet(key, fn, ttl = null) {
			if (this.exists(key)) return this.get(key)
			return this.set(key, await fn(), ttl)
		}
	}
}

export const cache = createMemoryCache()

export function cacheMiddleware(options = {}) {
	const {
		ttl = null,
		enabled = true
	} = options

	return async (req, res, next) => {
		if (!enabled) return next()

		const cacheKey = req.originalUrl.replace(/\/$/, '')

		if (cache.exists(cacheKey)) {
			return res.json({
				...cache.get(cacheKey),
				cached: true
			})
		}

		const originalJson = res.json.bind(res)
		res.json = (data) => {
			cache.set(cacheKey, data, ttl)
			return originalJson(data)
		}

		next()
	}
}
