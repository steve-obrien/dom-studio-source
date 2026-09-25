/**
 * Resolves a configured, trusted origin without using request Host headers.
 *
 * @returns {string} Public origin for checkout and email links.
 */
export function getBillingOrigin() {
	const url = new URL(process.env.BILLING_PUBLIC_URL || 'https://getdom.studio');
	if (url.username || url.password || (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
		throw new Error('BILLING_PUBLIC_URL must be a trusted HTTPS origin.');
	}
	return url.origin;
}

/**
 * Checks the credentials required to deliver transactional licence mail.
 *
 * @returns {boolean} Whether a sender and Resend key are configured.
 */
export function isLicenceEmailConfigured() {
	return Boolean(process.env.RESEND_API_KEY && process.env.LICENCE_EMAIL_FROM);
}

/**
 * Sends transactional mail with provider-side retry deduplication and bounded latency.
 * Provider responses and credentials never become public errors or application logs.
 *
 * @param {{ to: string, subject: string, text: string, key: string, attachments?: object[] }} message Mail contents.
 * @returns {Promise<void>}
 */
export async function sendLicenceEmail({ to, subject, text, key, attachments }) {
	if (!isLicenceEmailConfigured()) throw new Error('Licence email delivery is not configured.');
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		signal: AbortSignal.timeout(15000),
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
			'Idempotency-Key': key,
		},
		body: JSON.stringify({ from: process.env.LICENCE_EMAIL_FROM, to: [to], subject, text, ...(attachments ? { attachments } : {}) }),
	});
	if (!response.ok) throw new Error(`Licence email delivery failed (${response.status}).`);
}
