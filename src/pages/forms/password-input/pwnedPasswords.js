const PWNED_PASSWORDS_RANGE_ENDPOINT = 'https://api.pwnedpasswords.com/range/';

const byteToHex = (byte) => byte.toString(16).padStart(2, '0');

export async function sha1PasswordHash(password) {
	if (!globalThis.crypto?.subtle) {
		throw new Error('Web Crypto API is required to check compromised passwords.');
	}

	const encoded = new TextEncoder().encode(password);
	const digest = await globalThis.crypto.subtle.digest('SHA-1', encoded);
	return Array.from(new Uint8Array(digest), byteToHex).join('').toUpperCase();
}

export async function checkCompromisedPassword(password, { signal } = {}) {
	const value = `${password ?? ''}`;
	if (!value) {
		return {
			compromised: false,
			count: 0,
		};
	}

	const hash = await sha1PasswordHash(value);
	const prefix = hash.slice(0, 5);
	const suffix = hash.slice(5);
	const response = await fetch(`${PWNED_PASSWORDS_RANGE_ENDPOINT}${prefix}`, {
		headers: {
			'Add-Padding': 'true',
		},
		signal,
	});

	if (!response.ok) {
		throw new Error(`Pwned Passwords request failed with ${response.status}.`);
	}

	const match = (await response.text())
		.split(/\r?\n/)
		.find((line) => line.startsWith(`${suffix}:`));
	const count = match ? Number.parseInt(match.split(':')[1], 10) || 0 : 0;

	return {
		compromised: count > 0,
		count,
	};
}
