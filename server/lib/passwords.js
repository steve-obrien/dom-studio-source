import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const keyLength = 64;

export async function hashPassword(password) {
	const salt = randomBytes(16).toString('base64url');
	const derived = await scryptAsync(password, salt, keyLength);
	return `scrypt$${salt}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword(password, storedHash) {
	const [algorithm, salt, hash] = String(storedHash || '').split('$');
	if (algorithm !== 'scrypt' || !salt || !hash) return false;

	const derived = await scryptAsync(password, salt, keyLength);
	const expected = Buffer.from(hash, 'base64url');
	const actual = Buffer.from(derived);
	if (expected.length !== actual.length) return false;
	return timingSafeEqual(expected, actual);
}
