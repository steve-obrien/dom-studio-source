import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

const hasOwn = Object.prototype.hasOwnProperty
const pendingByStore = new WeakMap()

export class RequestContextManager {
	constructor() {
		this.storage = new AsyncLocalStorage()
	}

	runWith(initial = {}, callback) {
		return this.storage.run(createStore(initial), callback)
	}

	enterWith(initial = {}) {
		this.storage.enterWith(createStore(initial))
	}

	getStore() {
		return this.storage.getStore()
	}

	get(key, fallbackValue = undefined) {
		const store = this.getStore()
		if (!store || !hasOwn.call(store, key)) return fallbackValue
		return store[key]
	}

	set(key, value) {
		const store = this.requireStore()
		store[key] = value
		return value
	}

	has(key) {
		const store = this.getStore()
		return Boolean(store && hasOwn.call(store, key))
	}

	delete(key) {
		const store = this.getStore()
		if (!store || !hasOwn.call(store, key)) return false

		getPendingStore(store).delete(key)
		delete store[key]
		return true
	}

	clear() {
		const store = this.getStore()
		if (!store) return

		getPendingStore(store).clear()

		for (const key of Reflect.ownKeys(store)) {
			delete store[key]
		}
	}

	async getOrSet(key, resolver) {
		const store = this.requireStore()
		if (hasOwn.call(store, key)) return store[key]

		const pending = getPendingStore(store)
		if (pending.has(key)) return pending.get(key)

		const promise = Promise.resolve().then(() => resolver(store))
		pending.set(key, promise)

		try {
			const value = await promise
			store[key] = value
			pending.delete(key)
			return value
		} catch (error) {
			pending.delete(key)
			throw error
		}
	}

	middleware(options = {}) {
		const {
			initial = {},
			includeRequestId = true,
			requestIdHeader = 'x-request-id'
		} = options

		return (req, res, next) => {
			Promise.resolve(resolveInitial(initial, req, res))
				.then((values) => {
					const store = createStore(values)

					if (includeRequestId && !hasOwn.call(store, 'requestId')) {
						store.requestId = readHeader(req, requestIdHeader) || randomUUID()
					}

					this.storage.run(store, next)
				})
				.catch(next)
		}
	}

	requireStore() {
		const store = this.getStore()
		if (!store) {
			throw new Error('Request context is not active. Use requestContextMiddleware() or RequestContext.runWith().')
		}

		return store
	}
}

export function createRequestContext() {
	return new RequestContextManager()
}

export const requestContext = createRequestContext()
export const RequestContext = requestContext

export function requestContextMiddleware(options = {}) {
	return requestContext.middleware(options)
}

export default RequestContext

function createStore(initial = {}) {
	if (initial == null) return Object.create(null)

	if (initial instanceof Map) {
		const store = Object.create(null)

		for (const [key, value] of initial.entries()) {
			store[key] = value
		}

		return store
	}

	if (typeof initial !== 'object') {
		throw new TypeError('Request context initial value must be an object or Map.')
	}

	return Object.assign(Object.create(null), initial)
}

function getPendingStore(store) {
	if (!pendingByStore.has(store)) {
		pendingByStore.set(store, new Map())
	}

	return pendingByStore.get(store)
}

function resolveInitial(initial, req, res) {
	return typeof initial === 'function' ? initial(req, res) : initial
}

function readHeader(req, name) {
	const value = req.get?.(name) || req.headers?.[name]

	if (Array.isArray(value)) return value[0]
	return value
}
