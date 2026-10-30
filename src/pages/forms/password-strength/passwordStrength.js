const SECONDS_PER_YEAR = 31557600;

/**
 * Formats an estimated cracking duration for human-readable feedback.
 *
 * @param {number} seconds Estimated cracking duration in seconds.
 * @returns {string} Human-readable duration.
 */
function secondsToHuman(seconds) {
	if (seconds < 1) return 'instantly';
	if (seconds < 60) return `${Math.round(seconds)} seconds`;
	if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
	if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
	if (seconds < SECONDS_PER_YEAR) return `${Math.round(seconds / 86400)} days`;
	const years = seconds / SECONDS_PER_YEAR;
	if (years < 1_000) return `${Math.round(years)} years`;
	if (years < 1_000_000) return `${Math.round(years / 1_000)} thousand years`;
	if (years < 1_000_000_000) return `${Math.round(years / 1_000_000)} million years`;
	if (years < 1_000_000_000_000) return `${Math.round(years / 1_000_000_000)} billion years`;
	return 'trillions of years';
}

/**
 * Converts a cracking duration into the five-step strength scale.
 *
 * @param {number} seconds Estimated cracking duration in seconds.
 * @returns {[number, string]} Strength score and label.
 */
function scoreFromCrackSeconds(seconds) {
	if (seconds < SECONDS_PER_YEAR) return [1, 'Very weak'];
	if (seconds < SECONDS_PER_YEAR * 1_000) return [2, 'Weak'];
	if (seconds < SECONDS_PER_YEAR * 1_000_000) return [3, 'Okay'];
	if (seconds < SECONDS_PER_YEAR * 1_000_000_000) return [4, 'Strong'];
	return [5, 'Very strong'];
}

/**
 * Estimates average offline cracking time from password entropy.
 *
 * @param {number} entropy Estimated password entropy in bits.
 * @param {number} [guessesPerSecond=1000000000000] Assumed cracking rate.
 * @returns {{ seconds: number, human: string }} Numeric and formatted estimates.
 */
function estimateCrackTime(entropy, guessesPerSecond = 1_000_000_000_000) {
	const combinations = 2 ** entropy;
	const averageSeconds = combinations / guessesPerSecond / 2;
	return {
		seconds: averageSeconds,
		human: secondsToHuman(averageSeconds),
	};
}

/**
 * Estimates the strength and cracking time for a password.
 *
 * @param {string} password Password to assess.
 * @returns {{ score: number, label: string, entropy: number, crackTime: string | null, crackSeconds?: number }} Strength details.
 */
export function passwordStrength(password) {
	const value = password || '';
	if (!value) {
		return {
			score: 0,
			label: 'Empty',
			entropy: 0,
			crackTime: null,
		};
	}

	const length = value.length;
	let pool = 0;
	if (/[a-z]/.test(value)) pool += 26;
	if (/[A-Z]/.test(value)) pool += 26;
	if (/\d/.test(value)) pool += 10;
	if (/[^A-Za-z0-9]/.test(value)) pool += 33;

	let entropy = Math.log2(pool || 1) * length;
	if (/^(.)\1+$/.test(value)) entropy *= 0.1;
	if (/123456|password|qwerty|letmein|admin|welcome/i.test(value)) entropy *= 0.3;
	if (/(.)\1{2,}/.test(value)) entropy *= 0.8;
	if (/^\d+$/.test(value)) entropy *= 0.5;

	const crack = estimateCrackTime(entropy);
	const [score, label] = scoreFromCrackSeconds(crack.seconds);
	return {
		score,
		label,
		entropy: Math.round(entropy),
		crackTime: crack.human,
		crackSeconds: crack.seconds,
	};
}
