/**
 * Template expressions without `eval`.
 *
 * Bindings in imported templates (`{{ project.name }}`, `:href="`/p/${id}`"`)
 * are evaluated against preview data so the canvas can show real-looking
 * content. Nothing here runs code from the template: the parser understands
 * a safe subset of JavaScript expressions, member access is limited to own
 * properties of data, and only a short list of string, number and array
 * methods can be called. Anything else evaluates to `UNKNOWN`, and the canvas
 * falls back to showing the variable.
 */

export const UNKNOWN = Symbol('unknown');

const blockedKeys = new Set(['__proto__', 'prototype', 'constructor', '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__']);
const stringMethods = new Set(['toUpperCase', 'toLowerCase', 'trim', 'slice', 'substring', 'includes', 'startsWith', 'endsWith', 'split', 'padStart', 'padEnd', 'charAt', 'at', 'toString', 'replace', 'replaceAll', 'repeat']);
const numberMethods = new Set(['toFixed', 'toLocaleString', 'toString', 'toPrecision']);
const arrayMethods = new Set(['join', 'slice', 'includes', 'indexOf', 'at']);
const maxSource = 2000;
const astCache = new Map();

/* Tokenizer ------------------------------------------------------------------ */

const punctuators = ['===', '!==', '?.', '??', '==', '!=', '<=', '>=', '&&', '||', '=>', '...', '.', '[', ']', '(', ')', '{', '}', ',', ':', '?', '!', '+', '-', '*', '/', '%', '<', '>'];

function tokenize(source, start = 0) {
	const tokens = [];
	let index = start;
	while (index < source.length) {
		const char = source[index];
		if (/\s/.test(char)) { index += 1; continue; }
		if (/[\d]/.test(char) || (char === '.' && /\d/.test(source[index + 1] || ''))) {
			const match = /^(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)/i.exec(source.slice(index));
			tokens.push({ type: 'number', value: Number(match[0]), start: index });
			index += match[0].length;
			continue;
		}
		if (/[A-Za-z_$]/.test(char)) {
			const match = /^[\w$]+/.exec(source.slice(index));
			tokens.push({ type: 'name', value: match[0], start: index });
			index += match[0].length;
			continue;
		}
		if (char === '"' || char === "'") {
			let value = '';
			let cursor = index + 1;
			while (cursor < source.length && source[cursor] !== char) {
				if (source[cursor] === '\\') { value += unescape(source[cursor + 1]); cursor += 2; continue; }
				value += source[cursor];
				cursor += 1;
			}
			if (source[cursor] !== char) throw new SyntaxError('Unterminated string.');
			tokens.push({ type: 'string', value, start: index });
			index = cursor + 1;
			continue;
		}
		if (char === '`') {
			const parts = [];
			const expressions = [];
			let value = '';
			let cursor = index + 1;
			while (cursor < source.length && source[cursor] !== '`') {
				if (source[cursor] === '\\') { value += unescape(source[cursor + 1]); cursor += 2; continue; }
				if (source[cursor] === '$' && source[cursor + 1] === '{') {
					parts.push(value);
					value = '';
					const inner = parseAt(source, cursor + 2, '}');
					expressions.push(inner.node);
					cursor = inner.end + 1;
					continue;
				}
				value += source[cursor];
				cursor += 1;
			}
			if (source[cursor] !== '`') throw new SyntaxError('Unterminated template literal.');
			parts.push(value);
			tokens.push({ type: 'template', parts, expressions, start: index });
			index = cursor + 1;
			continue;
		}
		const punctuator = punctuators.find((item) => source.startsWith(item, index));
		if (!punctuator) throw new SyntaxError(`Unexpected ${char}.`);
		// `?.5` is a ternary followed by a number, not optional chaining.
		if (punctuator === '?.' && /\d/.test(source[index + 2] || '')) {
			tokens.push({ type: 'punct', value: '?', start: index });
			index += 1;
			continue;
		}
		tokens.push({ type: 'punct', value: punctuator, start: index });
		index += punctuator.length;
	}
	tokens.push({ type: 'end', start: index });
	return tokens;
}

function unescape(char) {
	return { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }[char] ?? char ?? '';
}

/* Parser --------------------------------------------------------------------- */

const binaryPrecedence = { '??': 1, '||': 1, '&&': 2, '==': 3, '!=': 3, '===': 3, '!==': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6 };

/**
 * Parses an expression that starts at `start` and stops at `terminator` (or the
 * end of the source). Used for `${}` holes and for literals inside scripts.
 *
 * @param {string} source Source text.
 * @param {number} start Offset to start at.
 * @param {string} [terminator] Punctuator that ends the expression.
 * @returns {{ node: object, end: number }} Parsed node and the terminator's offset.
 */
export function parseAt(source, start = 0, terminator = '') {
	const tokens = tokenizeUntil(source, start, terminator);
	let position = 0;
	const peek = () => tokens[position];
	const next = () => tokens[position++];
	const isPunct = (value) => peek().type === 'punct' && peek().value === value;
	const expect = (value) => {
		if (!isPunct(value)) throw new SyntaxError(`Expected ${value}.`);
		return next();
	};

	function expression() {
		const test = binary(0);
		if (!isPunct('?')) return test;
		next();
		const consequent = expression();
		expect(':');
		return { type: 'conditional', test, consequent, alternate: expression() };
	}

	function binary(minimum) {
		let left = unary();
		while (peek().type === 'punct' && binaryPrecedence[peek().value] > minimum) {
			const operator = next().value;
			const right = binary(binaryPrecedence[operator]);
			left = { type: 'binary', operator, left, right };
		}
		return left;
	}

	function unary() {
		if (isPunct('!') || isPunct('-') || isPunct('+')) return { type: 'unary', operator: next().value, argument: unary() };
		if (peek().type === 'name' && peek().value === 'typeof') { next(); return { type: 'unary', operator: 'typeof', argument: unary() }; }
		return postfix(primary());
	}

	function postfix(object) {
		let node = object;
		for (;;) {
			if (isPunct('.') || isPunct('?.')) {
				const optional = next().value === '?.';
				if (optional && isPunct('[')) { next(); node = { type: 'member', object: node, property: expression(), computed: true, optional }; expect(']'); continue; }
				if (optional && isPunct('(')) { node = { type: 'call', callee: node, args: args(), optional }; continue; }
				const name = next();
				if (name.type !== 'name') throw new SyntaxError('Expected a property name.');
				node = { type: 'member', object: node, property: { type: 'literal', value: name.value }, computed: false, optional };
			} else if (isPunct('[')) {
				next();
				node = { type: 'member', object: node, property: expression(), computed: true, optional: false };
				expect(']');
			} else if (isPunct('(')) {
				node = { type: 'call', callee: node, args: args(), optional: false };
			} else return node;
		}
	}

	function args() {
		expect('(');
		const list = [];
		while (!isPunct(')')) {
			list.push(expression());
			if (!isPunct(')')) expect(',');
		}
		next();
		return list;
	}

	function primary() {
		const token = next();
		if (token.type === 'number' || token.type === 'string') return { type: 'literal', value: token.value };
		if (token.type === 'template') return { type: 'template', parts: token.parts, expressions: token.expressions };
		if (token.type === 'name') {
			if (token.value === 'true') return { type: 'literal', value: true };
			if (token.value === 'false') return { type: 'literal', value: false };
			if (token.value === 'null') return { type: 'literal', value: null };
			if (token.value === 'undefined') return { type: 'literal', value: undefined };
			if (isPunct('=>')) throw new SyntaxError('Functions are not supported.');
			return { type: 'identifier', name: token.value };
		}
		if (token.type === 'punct' && token.value === '(') {
			const inner = expression();
			expect(')');
			if (isPunct('=>')) throw new SyntaxError('Functions are not supported.');
			return inner;
		}
		if (token.type === 'punct' && token.value === '[') {
			const elements = [];
			while (!isPunct(']')) {
				elements.push(expression());
				if (!isPunct(']')) expect(',');
			}
			next();
			return { type: 'array', elements };
		}
		if (token.type === 'punct' && token.value === '{') {
			const properties = [];
			while (!isPunct('}')) {
				const key = next();
				if (!['name', 'string', 'number'].includes(key.type)) throw new SyntaxError('Unsupported object key.');
				if (key.type === 'name' && (isPunct(',') || isPunct('}'))) properties.push({ key: key.value, value: { type: 'identifier', name: key.value } });
				else {
					expect(':');
					properties.push({ key: String(key.value), value: expression() });
				}
				if (!isPunct('}')) expect(',');
			}
			next();
			return { type: 'object', properties };
		}
		throw new SyntaxError('Unexpected token.');
	}

	const node = expression();
	const end = peek();
	if (end.type !== 'end') throw new SyntaxError('Unexpected input after the expression.');
	return { node, end: end.start };
}

/** Tokenizes up to the first unnested `terminator` (or the whole source). */
function tokenizeUntil(source, start, terminator) {
	if (!terminator) return tokenize(source, start);
	const tokens = tokenize(source.slice(0, findTerminator(source, start, terminator)), start);
	return tokens;
}

/** Finds the offset of a terminator at nesting depth zero, skipping strings. */
export function findTerminator(source, start, terminator) {
	let depth = 0;
	for (let index = start; index < source.length; index += 1) {
		const char = source[index];
		if (char === '"' || char === "'" || char === '`') {
			index += 1;
			while (index < source.length && source[index] !== char) index += source[index] === '\\' ? 2 : 1;
			continue;
		}
		if (depth === 0 && source.startsWith(terminator, index)) return index;
		if ('([{'.includes(char)) depth += 1;
		else if (')]}'.includes(char)) depth -= 1;
		if (depth < 0) return index;
	}
	return source.length;
}

/**
 * Parses an expression, caching the result.
 *
 * @param {string} source Expression source.
 * @returns {object|null} AST, or null when the expression is outside the supported subset.
 */
export function parseExpression(source) {
	const key = String(source ?? '');
	if (key.length > maxSource) return null;
	if (astCache.has(key)) return astCache.get(key);
	let node = null;
	try { node = parseAt(key, 0).node; } catch { node = null; }
	if (astCache.size > 2000) astCache.clear();
	astCache.set(key, node);
	return node;
}

/* Evaluation ----------------------------------------------------------------- */

/**
 * Creates a lookup scope. Inner scopes shadow outer ones, like `v-for` aliases.
 *
 * @param {object} values Variables.
 * @param {object|null} [parent] Outer scope.
 * @returns {object} Scope.
 */
export function createScope(values = {}, parent = null) {
	const scope = Object.create(parent);
	for (const [key, value] of Object.entries(values || {})) if (!blockedKeys.has(key)) scope[key] = value;
	return scope;
}

function readMember(object, key) {
	if (object === null || object === undefined || object === UNKNOWN) return UNKNOWN;
	if (typeof key === 'symbol' || blockedKeys.has(String(key))) return UNKNOWN;
	if (typeof object === 'string' || Array.isArray(object)) {
		if (key === 'length') return object.length;
		if (/^\d+$/.test(String(key))) return Number(key) < object.length ? object[Number(key)] : undefined;
		return UNKNOWN;
	}
	if (typeof object !== 'object') return UNKNOWN;
	return Object.hasOwn(object, key) ? object[key] : undefined;
}

function callMethod(receiver, name, args) {
	if (args.some((arg) => arg === UNKNOWN || (arg && typeof arg === 'object'))) return UNKNOWN;
	try {
		if (typeof receiver === 'string' && stringMethods.has(name)) return String.prototype[name].apply(receiver, args);
		if (typeof receiver === 'number' && numberMethods.has(name)) return Number.prototype[name].apply(receiver, args);
		if (Array.isArray(receiver) && arrayMethods.has(name)) return Array.prototype[name].apply(receiver, args);
	} catch {
		return UNKNOWN;
	}
	return UNKNOWN;
}

function evaluateNode(node, scope) {
	switch (node.type) {
		case 'literal': return node.value;
		case 'identifier': return scope && node.name in scope && !blockedKeys.has(node.name) ? scope[node.name] : UNKNOWN;
		case 'template': {
			let out = node.parts[0];
			for (let index = 0; index < node.expressions.length; index += 1) {
				const value = evaluateNode(node.expressions[index], scope);
				if (value === UNKNOWN) return UNKNOWN;
				out += String(value ?? '') + node.parts[index + 1];
			}
			return out;
		}
		case 'array': {
			const values = node.elements.map((item) => evaluateNode(item, scope));
			return values.includes(UNKNOWN) ? UNKNOWN : values;
		}
		case 'object': {
			const out = {};
			for (const { key, value } of node.properties) {
				if (blockedKeys.has(key)) return UNKNOWN;
				const result = evaluateNode(value, scope);
				if (result === UNKNOWN) return UNKNOWN;
				out[key] = result;
			}
			return out;
		}
		case 'member': {
			const object = evaluateNode(node.object, scope);
			if (node.optional && (object === null || object === undefined)) return undefined;
			const key = node.computed ? evaluateNode(node.property, scope) : node.property.value;
			if (key === UNKNOWN) return UNKNOWN;
			return readMember(object, key);
		}
		case 'call': {
			if (node.callee.type !== 'member' || node.callee.computed) return UNKNOWN;
			const receiver = evaluateNode(node.callee.object, scope);
			if ((node.optional || node.callee.optional) && (receiver === null || receiver === undefined)) return undefined;
			if (receiver === UNKNOWN) return UNKNOWN;
			return callMethod(receiver, node.callee.property.value, node.args.map((arg) => evaluateNode(arg, scope)));
		}
		case 'unary': {
			const value = evaluateNode(node.argument, scope);
			if (value === UNKNOWN) return UNKNOWN;
			if (node.operator === '!') return !value;
			if (node.operator === '-') return -value;
			if (node.operator === '+') return +value;
			return typeof value;
		}
		case 'conditional': {
			const test = evaluateNode(node.test, scope);
			if (test === UNKNOWN) return UNKNOWN;
			return evaluateNode(test ? node.consequent : node.alternate, scope);
		}
		case 'binary': {
			const left = evaluateNode(node.left, scope);
			if (left === UNKNOWN) return UNKNOWN;
			if (node.operator === '&&') return left ? evaluateNode(node.right, scope) : left;
			if (node.operator === '||') return left ? left : evaluateNode(node.right, scope);
			if (node.operator === '??') return left ?? evaluateNode(node.right, scope);
			const right = evaluateNode(node.right, scope);
			if (right === UNKNOWN) return UNKNOWN;
			if ((left && typeof left === 'object') || (right && typeof right === 'object')) {
				if (['===', '!==', '==', '!='].includes(node.operator)) return node.operator.startsWith('!') ? left !== right : left === right;
				return UNKNOWN;
			}
			switch (node.operator) {
				case '+': return left + right;
				case '-': return left - right;
				case '*': return left * right;
				case '/': return left / right;
				case '%': return left % right;
				case '<': return left < right;
				case '>': return left > right;
				case '<=': return left <= right;
				case '>=': return left >= right;
				// eslint-disable-next-line eqeqeq
				case '==': return left == right;
				// eslint-disable-next-line eqeqeq
				case '!=': return left != right;
				case '===': return left === right;
				case '!==': return left !== right;
				default: return UNKNOWN;
			}
		}
		default: return UNKNOWN;
	}
}

/**
 * Evaluates an expression against a scope.
 *
 * @param {string} source Expression source.
 * @param {object} scope Scope from `createScope`.
 * @returns {unknown} The value, or `UNKNOWN` when it cannot be previewed.
 */
export function evaluate(source, scope) {
	const node = parseExpression(source);
	if (!node) return UNKNOWN;
	return evaluateNode(node, scope);
}

/**
 * Evaluates a literal (a number, string, array or object of literals) found in
 * a script, such as the argument of `ref(...)`. Identifiers are not resolved.
 *
 * @param {string} source Source text.
 * @param {number} start Offset where the literal starts.
 * @param {string} terminator Text that ends it, such as `)`.
 * @returns {unknown} Value, or `UNKNOWN`.
 */
export function evaluateLiteralAt(source, start, terminator) {
	try {
		const { node } = parseAt(source, start, terminator);
		return evaluateNode(node, null);
	} catch {
		return UNKNOWN;
	}
}

/* References ----------------------------------------------------------------- */

const numberHints = numberMethods;
const stringHints = new Set([...stringMethods].filter((name) => !numberMethods.has(name)));

/**
 * Lists the data paths an expression reads, for generating sample data.
 * `metric.value.toFixed(1)` reads `['metric', 'value']` as a number;
 * `items[0].name` reads `['items', '[]', 'name']`.
 *
 * @param {string} source Expression source.
 * @returns {Array<{ path: Array<string>, hint?: string }>} References.
 */
export function expressionReferences(source) {
	const node = parseExpression(source);
	const out = [];
	if (!node) return out;

	/** Resolves a static member chain to a path, or null when it is not one. */
	function chain(item) {
		if (item.type === 'identifier') return [item.name];
		if (item.type !== 'member') return null;
		const base = chain(item.object);
		if (!base) return null;
		if (!item.computed) return [...base, item.property.value];
		if (item.property.type === 'literal' && typeof item.property.value === 'number') return [...base, '[]'];
		if (item.property.type === 'literal' && typeof item.property.value === 'string') return [...base, item.property.value];
		return null;
	}

	function visit(item, hint) {
		if (!item) return;
		if (item.type === 'identifier' || item.type === 'member') {
			const path = chain(item);
			if (path) {
				const last = path[path.length - 1];
				if (last === 'length' && path.length > 1) out.push({ path: path.slice(0, -1), hint: 'array' });
				else out.push({ path, ...(hint ? { hint } : {}) });
				if (item.type === 'member' && item.computed) visit(item.property);
				return;
			}
			if (item.type === 'member') { visit(item.object); if (item.computed) visit(item.property); }
			return;
		}
		if (item.type === 'call') {
			if (item.callee.type === 'member' && !item.callee.computed) {
				const name = item.callee.property.value;
				const calleeHint = numberHints.has(name) && name !== 'toString' ? 'number' : stringHints.has(name) ? 'string' : arrayMethods.has(name) ? 'array' : undefined;
				visit(item.callee.object, calleeHint);
			}
			item.args.forEach((arg) => visit(arg));
			return;
		}
		if (item.type === 'binary') {
			const numeric = ['-', '*', '/', '%', '<', '>', '<=', '>='].includes(item.operator);
			const literalNumber = (side) => side.type === 'literal' && typeof side.value === 'number';
			visit(item.left, numeric || literalNumber(item.right) ? 'number' : undefined);
			visit(item.right, numeric || literalNumber(item.left) ? 'number' : undefined);
			return;
		}
		if (item.type === 'unary') { visit(item.argument, item.operator === '!' ? 'boolean' : item.operator === '-' ? 'number' : undefined); return; }
		if (item.type === 'conditional') { visit(item.test, 'boolean'); visit(item.consequent, hint); visit(item.alternate, hint); return; }
		if (item.type === 'template') { item.expressions.forEach((expression) => visit(expression)); return; }
		if (item.type === 'array') { item.elements.forEach((element) => visit(element)); return; }
		if (item.type === 'object') item.properties.forEach((property) => visit(property.value));
	}

	visit(node);
	return out;
}

/**
 * Parses a `v-for` expression.
 *
 * @param {string} source Such as `(item, index) in items` or `{ id, name } of rows`.
 * @returns {{ value: string|null, names: Array<string>, key: string|null, index: string|null, source: string }|null} Aliases and source, or null.
 */
export function parseFor(source) {
	const match = /^\s*([\s\S]+?)\s+(?:in|of)\s+([\s\S]+?)\s*$/.exec(String(source || ''));
	if (!match) return null;
	let alias = match[1].trim();
	if (alias.startsWith('(') && alias.endsWith(')')) alias = alias.slice(1, -1);
	const parts = [];
	let depth = 0;
	let current = '';
	for (const char of alias) {
		if ('{['.includes(char)) depth += 1;
		if ('}]'.includes(char)) depth -= 1;
		if (char === ',' && depth === 0) { parts.push(current.trim()); current = ''; continue; }
		current += char;
	}
	parts.push(current.trim());
	const [value = '', key = null, index = null] = parts;
	const destructured = /^[{[]/.test(value);
	const names = destructured ? value.slice(1, -1).split(',').map((item) => item.split(':').pop().split('=')[0].trim()).filter((item) => /^[A-Za-z_$][\w$]*$/.test(item)) : [];
	const keys = destructured ? value.slice(1, -1).split(',').map((item) => item.split(':')[0].split('=')[0].trim()).filter((item) => /^[A-Za-z_$][\w$]*$/.test(item)) : [];
	return {
		value: destructured ? null : value || null,
		names,
		keys,
		key: parts.length === 3 ? key : (parts.length === 2 ? key : null),
		index: parts.length === 3 ? index : null,
		source: match[2],
	};
}
