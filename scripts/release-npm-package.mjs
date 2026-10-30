import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const templatePath = path.join(root, 'packages/studio/package.template.json');

/** Parses stable versions, rejecting ambiguous or unsafe input. */
export function parseStableVersion(version) {
	if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error(`Invalid stable version: ${version}`);
	const parts = version.split('.').map(Number);
	if (!parts.every(Number.isSafeInteger)) throw new Error('Version exceeds safe integer range');
	return parts;
}

/** Compares stable versions numerically. */
export function compareVersions(a, b) {
	const left = parseStableVersion(a);
	const right = parseStableVersion(b);
	for (let index = 0; index < 3; index += 1) if (left[index] !== right[index]) return left[index] - right[index];
	return 0;
}

/** Suggests an unpublished candidate or the next patch after the registry version. */
export function suggestVersion(candidate, published) {
	if (compareVersions(candidate, published) > 0) return candidate;
	const [major, minor, patch] = parseStableVersion(published);
	return `${major}.${minor}.${patch + 1}`;
}

/** Extracts exactly one reviewed changelog section, rejecting duplicate or incomplete notes. */
export function releaseNotes(source, version) {
	parseStableVersion(version);
	const sections = [...source.matchAll(/^## (\d+\.\d+\.\d+) - (\d{4}-\d{2}-\d{2})[^\S\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
	const matches = sections.filter((entry) => entry[1] === version);
	if (matches.length !== 1 || !matches[0][3].trim() || /\b(TODO|TBD)\b/.test(matches[0][3])) throw new Error(`Write one complete CHANGELOG.md section: ## ${version} - YYYY-MM-DD`);
	return matches[0][3].trim();
}

/** Runs a command with visible output and stops on failure. */
function run(command, args) {
	const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}

/** Reads command output; registry and authentication failures remain failures. */
function read(command, args) {
	return execFileSync(command, args, { cwd: root, encoding: 'utf8', timeout: 60_000 }).trim();
}

/** Prepares a local release or verifies metadata for a tag-triggered CI run. */
async function main() {
	const args = process.argv.slice(2);
	const check = args[0] === '--check';
	let version = check ? args[1] : args[0];
	if (args.length > (check ? 2 : 1)) throw new Error('Usage: npm run release:prepare -- [VERSION|patch]');
	const manifest = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
	if (check) {
		parseStableVersion(version);
		if (version !== manifest.version) throw new Error('Tag and package version differ');
		fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
		fs.writeFileSync(path.join(root, 'dist/release-notes.md'), releaseNotes(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'), version) + '\n');
		return;
	}
	if (read('git', ['branch', '--show-current']) !== 'main') throw new Error('Prepare the release on main');
	run('git', ['fetch', 'origin', 'main', '--tags']);
	if (read('git', ['rev-parse', 'HEAD']) !== read('git', ['rev-parse', 'origin/main'])) throw new Error('Synchronize main with origin/main before preparing');
	const published = JSON.parse(read('npm', ['view', '@getdom/studio', 'version', '--json']));
	const suggested = suggestVersion(manifest.version, published);
	if (version === 'patch') version = suggested;
	if (!version) {
		if (!process.stdin.isTTY) throw new Error(`Supply a version or patch; suggested ${suggested}`);
		const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
		try { version = (await prompt.question(`Release version [${suggested}]: `)).trim() || suggested; }
		finally { prompt.close(); }
	}
	parseStableVersion(version);
	if (compareVersions(version, published) <= 0) throw new Error(`Choose a version above published ${published}`);
	if (read('git', ['tag', '--list', `v${version}`])) throw new Error('Release tag already exists');
	const notes = releaseNotes(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'), version);
	console.log(`\nRelease ${version}\n\n${notes}\n\nWorking tree to review before committing:`);
	run('git', ['status', '--short']);
	fs.writeFileSync(templatePath, JSON.stringify({ ...manifest, version }, null, '\t') + '\n');
	run('npm', ['run', 'check:releases']);
	run('npm', ['--prefix', 'packages/now', 'test', '--', '--run']);
	run('npm', ['run', 'build']);
	run('npm', ['run', 'package:smoke']);
	run('npm', ['pack', './dist/npm', '--dry-run']);
	console.log(`\nPrepared ${version}. Review and commit the intended changes, push main, then create and push annotated tag v${version}. Nothing was published.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(reportFailure);

/** Reports failed preparation without hiding the cause. */
function reportFailure(error) {
	console.error(error.message);
	process.exitCode = 1;
}
