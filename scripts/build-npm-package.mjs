import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeComponentDocs } from './generate-component-docs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'dist/npm');
const templateDir = path.join(root, 'packages/studio');
const entryFiles = [
	'src/pages/lib/vue/index.js',
	'src/pages/lib/headless/index.js',
	'src/pages/lib/designer/index.js',
];
const staticFiles = [
	'CHANGELOG.md',
	'LICENSE.md',
	'SKILL.md',
	'public/llms.txt',
	'public/skills.sh',
	'src/pages/lib/vue/index.d.ts',
	'src/pages/lib/designer/index.d.ts',
	'src/style.css',
	'src/tailwind.css',
	'src/theme.css',
	...fs.readdirSync(path.join(root, 'src/pages/lib/headless'))
		.filter((filename) => filename.endsWith('.d.ts'))
		.map((filename) => `src/pages/lib/headless/${filename}`),
];
const allowedExternalPackages = new Set([
	'@getdom/studio',
	'@unovis/vue',
	'@unovis/ts',
	'@vue/compiler-dom',
	'@vue/compiler-sfc',
	'@tiptap/extension-code-block',
	'@tiptap/extension-collaboration',
	'@tiptap/extension-collaboration-caret',
	'@tiptap/extension-image',
	'@tiptap/extension-link',
	'@tiptap/extension-placeholder',
	'@tiptap/extension-table',
	'@tiptap/extension-underline',
	'@tiptap/pm',
	'@tiptap/starter-kit',
	'@tiptap/vue-3',
	'pinia',
	'vue',
	'vue-router',
]);

/**
 * Builds a deterministic npm staging directory from the public runtime graph.
 *
 * @returns {void}
 */
function buildPackage() {
	fs.rmSync(outputDir, { recursive: true, force: true });
	fs.mkdirSync(outputDir, { recursive: true });

	const runtimeFiles = collectRuntimeFiles(entryFiles);
	for (const relativePath of [...runtimeFiles, ...staticFiles].sort()) {
		copyProjectFile(relativePath);
	}

	copyFile(path.join(templateDir, 'README.md'), path.join(outputDir, 'README.md'));
	const docs = writeComponentDocs(path.join(outputDir, 'docs/components'));
	writePackageManifest();
	validateOutput(runtimeFiles);

	console.log(`Built ${runtimeFiles.size} runtime files and ${docs.components} component docs in ${path.relative(root, outputDir)}.`);
}

/**
 * Traverses relative imports and exports starting at the public entry points.
 *
 * @param {string[]} entries Project-relative entry files.
 * @returns {Set<string>} Project-relative files required at runtime.
 */
function collectRuntimeFiles(entries) {
	const found = new Set();
	const pending = [...entries];

	while (pending.length) {
		const relativePath = normalizeProjectPath(pending.pop());
		if (found.has(relativePath)) continue;

		const absolutePath = path.join(root, relativePath);
		if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
			throw new Error(`Public package dependency does not exist: ${relativePath}`);
		}

		found.add(relativePath);
		const source = fs.readFileSync(absolutePath, 'utf8');
		for (const specifier of importSpecifiers(source)) {
			if (specifier.startsWith('.')) {
				pending.push(resolveRelativeImport(relativePath, specifier));
				continue;
			}

			const packageName = externalPackageName(specifier);
			if (!allowedExternalPackages.has(packageName)) {
				throw new Error(`Undeclared external package "${packageName}" imported by ${relativePath}.`);
			}
		}
	}

	return found;
}

/**
 * Extracts static and dynamic module specifiers from JavaScript or Vue source.
 *
 * @param {string} source Source file contents.
 * @returns {string[]} Referenced module specifiers.
 */
function importSpecifiers(source) {
	const specifiers = [];
	const patterns = [
		/(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
		/import\(\s*['"]([^'"]+)['"]\s*\)/g,
	];

	for (const pattern of patterns) {
		for (const match of source.matchAll(pattern)) specifiers.push(match[1]);
	}

	return [...new Set(specifiers)];
}

/**
 * Resolves a relative module specifier using the extensions used by DOM Studio.
 *
 * @param {string} importer Project-relative importing file.
 * @param {string} specifier Relative module specifier.
 * @returns {string} Resolved project-relative file.
 */
function resolveRelativeImport(importer, specifier) {
	const basePath = path.resolve(root, path.dirname(importer), specifier);
	const candidates = [basePath, `${basePath}.js`, `${basePath}.vue`, path.join(basePath, 'index.js')];
	const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
	if (!resolved) throw new Error(`Cannot resolve "${specifier}" imported by ${importer}.`);
	if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error(`Package import escapes the repository: ${specifier}`);
	return normalizeProjectPath(path.relative(root, resolved));
}

/**
 * Returns the registry package name for an external module specifier.
 *
 * @param {string} specifier External module specifier.
 * @returns {string} Top-level npm package name.
 */
function externalPackageName(specifier) {
	if (!specifier.startsWith('@')) return specifier.split('/')[0];
	return specifier.split('/').slice(0, 2).join('/');
}

/**
 * Copies one repository file into the matching package staging path.
 *
 * @param {string} relativePath Project-relative source path.
 * @returns {void}
 */
function copyProjectFile(relativePath) {
	copyFile(path.join(root, relativePath), path.join(outputDir, relativePath));
}

/**
 * Copies a file after ensuring its destination directory exists.
 *
 * @param {string} sourcePath Absolute source path.
 * @param {string} destinationPath Absolute destination path.
 * @returns {void}
 */
function copyFile(sourcePath, destinationPath) {
	fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
	fs.copyFileSync(sourcePath, destinationPath);
}

/**
 * Writes the publishable manifest from the reviewed package template.
 *
 * @returns {void}
 */
function writePackageManifest() {
	const templatePath = path.join(templateDir, 'package.template.json');
	const manifest = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
	fs.writeFileSync(path.join(outputDir, 'package.json'), `${JSON.stringify(manifest, null, '\t')}\n`);
}

/**
 * Verifies that protected application areas cannot enter the public artifact.
 *
 * @param {Set<string>} runtimeFiles Collected project-relative runtime files.
 * @returns {void}
 */
function validateOutput(runtimeFiles) {
	const forbiddenPrefixes = [
		'server/',
		'src/pages/blocks/',
		'src/pages/auth/',
		'src/pages/pricing/',
		'src/pages/paywall/',
	];
	for (const relativePath of runtimeFiles) {
		if (forbiddenPrefixes.some((prefix) => relativePath.startsWith(prefix))) {
			throw new Error(`Protected application file entered the package graph: ${relativePath}`);
		}
	}
}

/**
 * Normalizes filesystem separators for deterministic package paths.
 *
 * @param {string} value Filesystem path.
 * @returns {string} Slash-separated project path.
 */
function normalizeProjectPath(value) {
	return value.split(path.sep).join('/');
}

buildPackage();
