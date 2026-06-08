let payload = typeof window !== 'undefined' ? window.__NOW__ || null : null

export function setNowPayload(value) {
	payload = value || null
}

export function getNowPayload() {
	return payload
}
