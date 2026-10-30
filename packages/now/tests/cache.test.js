import { describe, expect, it } from 'vitest'
import { createMemoryCache } from '../src/framework/server/cache.js'

function wait(ms = 0) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('memory cache', () => {
	it('stores and clears values', () => {
		const cache = createMemoryCache()

		cache.set('answer', 42)

		expect(cache.exists('answer')).toBe(true)
		expect(cache.get('answer')).toBe(42)

		cache.clear('answer')
		expect(cache.exists('answer')).toBe(false)
	})

	it('expires ttl-backed values', async () => {
		const cache = createMemoryCache()

		cache.set('answer', 42, 10)

		expect(cache.exists('answer')).toBe(true)
		expect(cache.get('answer')).toBe(42)

		await wait(20)

		expect(cache.exists('answer')).toBe(false)
		expect(cache.get('answer')).toBeUndefined()
	})
})
