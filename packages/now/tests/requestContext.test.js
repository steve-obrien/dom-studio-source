import { describe, expect, it } from 'vitest'
import { createRequestContext } from '../src/framework/server/requestContext.js'

function wait(ms = 0) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('request context', () => {
	it('stores and reads values inside a request context', async () => {
		const context = createRequestContext()

		await context.runWith({ requestId: 'request-1' }, async () => {
			expect(context.get('requestId')).toBe('request-1')

			context.set('userId', 'user-1')

			expect(context.has('userId')).toBe(true)
			expect(context.get('userId')).toBe('user-1')
		})
	})

	it('keeps concurrent request stores isolated', async () => {
		const context = createRequestContext()

		const results = await Promise.all([
			context.runWith({}, async () => {
				context.set('userId', 'user-a')
				await wait(10)
				return context.get('userId')
			}),
			context.runWith({}, async () => {
				context.set('userId', 'user-b')
				await wait(1)
				return context.get('userId')
			})
		])

		expect(results).toEqual(['user-a', 'user-b'])
	})

	it('dedupes parallel getOrSet calls within a request', async () => {
		const context = createRequestContext()

		await context.runWith({}, async () => {
			let calls = 0

			const [first, second] = await Promise.all([
				context.getOrSet('user', async () => {
					calls += 1
					await wait(10)
					return { id: 'user-1' }
				}),
				context.getOrSet('user', async () => {
					calls += 1
					return { id: 'user-2' }
				})
			])

			expect(calls).toBe(1)
			expect(first).toBe(second)
			expect(first).toEqual({ id: 'user-1' })
			expect(context.get('user')).toBe(first)
		})
	})

	it('clears in-flight values on resolver errors', async () => {
		const context = createRequestContext()

		await context.runWith({}, async () => {
			let calls = 0

			await expect(context.getOrSet('user', async () => {
				calls += 1
				throw new Error('lookup failed')
			})).rejects.toThrow('lookup failed')

			const user = await context.getOrSet('user', async () => {
				calls += 1
				return { id: 'user-1' }
			})

			expect(calls).toBe(2)
			expect(user).toEqual({ id: 'user-1' })
		})
	})

	it('creates a request store in middleware', async () => {
		const context = createRequestContext()
		const middleware = context.middleware()
		const req = {
			get(name) {
				return name === 'x-request-id' ? 'request-from-header' : undefined
			}
		}

		await new Promise((resolve, reject) => {
			middleware(req, {}, async (error) => {
				if (error) return reject(error)

				await wait()
				context.set('userId', 'user-1')

				expect(context.get('requestId')).toBe('request-from-header')
				expect(context.get('userId')).toBe('user-1')
				resolve()
			})
		})
	})

	it('throws when setting without an active context', () => {
		const context = createRequestContext()

		expect(context.get('missing')).toBeUndefined()
		expect(() => context.set('userId', 'user-1')).toThrow('Request context is not active')
	})
})
