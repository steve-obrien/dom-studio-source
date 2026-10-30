import { DomElementBase, defineDomElement, isBrowser } from './base.js';

const CLOSE_COMPLETE_BUFFER_MS = 40;

// <dom-dialog id="my-dialog">
//   <!-- trigger slot optional — omit when opening via commandfor or .open() -->
//   <h2>Title</h2>
//   <p>Body content.</p>
//   <button data-close>Close</button>
// </dom-dialog>
//
// <button command="open" commandfor="my-dialog">Open</button>
//
// const dlg = document.getElementById('my-dialog');
// dlg.open(); dlg.close(); dlg.toggle();

let TEMPLATE = null;

/**
 * Resolve the shared shadow DOM template for dialog elements.
 *
 * @returns {HTMLTemplateElement|null} Cached dialog template, or null outside the browser.
 */
function getTemplate() {
	if (TEMPLATE || !isBrowser) return TEMPLATE;
	TEMPLATE = document.createElement('template');
	TEMPLATE.innerHTML = `
<style>
	:host { display: contents; }
	dialog {
		box-sizing: border-box;
		border: 0;
		margin: auto;
		background: transparent;
		color: inherit;
		outline: none;
		max-width: 100vw;
		max-height: 100vh;
		max-height: 100dvh;
		overscroll-behavior: contain;
		overflow: auto;
		padding: min(1rem, 4vw);
	}
	dialog:focus,
	dialog:focus-visible {
		outline: none;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		opacity: 0;
		transition:
			opacity var(--dom-dialog-backdrop-duration, 140ms) ease,
			overlay var(--dom-dialog-backdrop-duration, 140ms) ease allow-discrete,
			display var(--dom-dialog-backdrop-duration, 140ms) ease allow-discrete;
	}
	dialog[open]::backdrop { opacity: 1; }
	:host([no-backdrop]) dialog::backdrop {
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}
	@starting-style {
		dialog[open]::backdrop { opacity: 0; }
	}
</style>
<slot name="trigger"></slot>
<dialog part="dialog"><slot></slot></dialog>
`;
	return TEMPLATE;
}

const OPEN_COMMANDS = new Set(['open', 'show-modal']);

/**
 * Parse a CSS time value into milliseconds.
 *
 * @param {string} value CSS time token such as `120ms` or `0.2s`.
 * @returns {number} Milliseconds represented by the token.
 */
function parseCssTime(value) {
	const time = String(value || '').trim();
	if (!time) return 0;
	const numeric = Number.parseFloat(time);
	if (!Number.isFinite(numeric)) return 0;
	if (time.endsWith('ms')) return numeric;
	if (time.endsWith('s')) return numeric * 1000;
	return numeric;
}

/**
 * Parse a comma-separated CSS time list into millisecond values.
 *
 * @param {string} value CSS transition duration or delay list.
 * @returns {Array<number>} Parsed millisecond values.
 */
function parseCssTimeList(value) {
	return String(value || '')
		.split(',')
		.map((entry) => parseCssTime(entry));
}

/**
 * Read an indexed CSS time, repeating the final value as CSS transitions do.
 *
 * @param {Array<number>} values Parsed CSS time values.
 * @param {number} index Desired transition index.
 * @returns {number} Millisecond value for the index.
 */
function cssTimeAt(values, index) {
	if (!values.length) return 0;
	return values[index] ?? values[values.length - 1] ?? 0;
}

/**
 * Calculate the longest transition duration plus delay for an element.
 *
 * @param {Element|null} element Element whose computed transition timing should be measured.
 * @returns {number} Longest transition time in milliseconds.
 */
function transitionTotalMs(element) {
	if (!element || !isBrowser) return 0;
	const style = window.getComputedStyle(element);
	const durations = parseCssTimeList(style.transitionDuration);
	const delays = parseCssTimeList(style.transitionDelay);
	const count = Math.max(durations.length, delays.length);
	let longest = 0;

	for (let index = 0; index < count; index += 1) {
		longest = Math.max(longest, cssTimeAt(durations, index) + cssTimeAt(delays, index));
	}

	return longest;
}

export class DomDialogElement extends DomElementBase {
	static get observedAttributes() { return ['open', 'aria-labelledby', 'aria-describedby']; }

	static __doc = {
		name: 'dom-dialog',
		description: 'Self-contained wrapper around the native HTML <dialog>. Top-layer rendering, nested stacking, ::backdrop and Esc-to-close are all native. Trigger slot is optional — open via commandfor, the open attribute, or .open() / .close() / .toggle().',
		slots: [
			{ name: 'trigger', description: 'Optional. Element that opens the dialog when clicked. Omit when using commandfor or programmatic control.' },
			{ name: '(default)', description: 'Dialog body. Anything that is not the trigger goes here.' },
		],
		attributes: [
			{ name: 'id', type: 'string', description: 'Host id — used by commandfor on external buttons (e.g. commandfor="my-dialog").' },
			{ name: 'open', type: 'boolean', description: 'Reflects open state. Setting it shows the dialog (showModal), removing it closes it.' },
			{ name: 'static', type: 'boolean', description: 'Modal cannot be dismissed by backdrop click or Esc — only data-close, .close(), or removing open.' },
			{ name: 'no-backdrop', type: 'boolean', description: 'Hides the visual backdrop while keeping native modal top-layer behaviour.' },
		],
		events: [
			{ name: 'dom:before-open', description: 'Fired immediately before the dialog opens so callers can prepare render state.' },
			{ name: 'dom:open', description: 'Fired when the dialog opens.' },
			{ name: 'dom:request-close', description: 'Cancelable dismissal request with { reason: "escape" | "backdrop" | "control" }. Prevent the event to keep the dialog open.' },
			{ name: 'dom:close', description: 'Fired when the dialog closes (Esc, .close(), backdrop, or data-close).' },
			{ name: 'dom:close-complete', description: 'Fired after the close transition completes so callers can release retained data.' },
		],
		keyboard: [
			{ keys: 'Esc', action: 'Closes the topmost open dialog unless `static` is set.' },
			{ keys: 'Tab / Shift+Tab', action: 'Focus stays within the dialog while open (native top-layer).' },
			{ keys: 'Click backdrop', action: 'Dismisses the dialog (disable with `static`).' },
		],
		example: `<dom-dialog id="confirm-dialog">
  <h2>Delete project?</h2>
  <p>This cannot be undone.</p>
  <button data-close>Cancel</button>
</dom-dialog>

<button type="button" command="open" commandfor="confirm-dialog">Delete</button>

<script type="module">
  import '@getdom/studio/headless/dialog.js';
  const dlg = document.getElementById('confirm-dialog');
  dlg.addEventListener('dom:close', () => console.log('closed'));
<\/script>`,
	};

	constructor() {
		super();
		if (!isBrowser) return;
		if (!this.shadowRoot) {
			const shadow = this.attachShadow({ mode: 'open' });
			shadow.appendChild(getTemplate().content.cloneNode(true));
		}
		this._dialog = this.shadowRoot.querySelector('dialog');
		this._syncing = false;
		this._closeCompleteRun = 0;
		this._closeCompleteTimer = null;
	}

	connectedCallback() {
		this._trigger = this.querySelector('[slot="trigger"]');
		if (this._trigger) {
			this._trigger.setAttribute('aria-haspopup', 'dialog');
			this._trigger.setAttribute('aria-expanded', String(this.isOpen));
			this.on(this._trigger, 'click', () => this._setOpen(true));
		}

		this.addEventListener('command', (e) => {
			if (e.target !== this) return;
			if (OPEN_COMMANDS.has(e.command)) this._setOpen(true);
			else if (e.command === 'close') this._setOpen(false);
		});

		this._wireCommandForButtons();

		this.on(this, 'click', (ev) => {
			const closer = ev.target.closest?.('[data-close]');
			if (closer && this.contains(closer)) this._requestClose('control');
		});

		this.on(this._dialog, 'click', (e) => {
			if (this.hasAttribute('static')) return;
			if (e.target === this._dialog) this._requestClose('backdrop');
		});

		this.on(this._dialog, 'cancel', (e) => {
			e.preventDefault();
			this._requestClose('escape');
		});
		this.on(this._dialog, 'keydown', (e) => {
			if (this.hasAttribute('static') && e.key === 'Escape') e.preventDefault();
		});

		this.on(this._dialog, 'close', () => this._onNativeClose());
		this._syncAria();

		if (this.boolAttr('open')) this._setOpen(true);
	}

	/**
	 * Release listeners and close-complete timers when the element disconnects.
	 *
	 * @returns {void}
	 */
	disconnectedCallback() {
		super.disconnectedCallback();
		this._cancelCloseCompleteWait();
	}

	/**
	 * Synchronize ARIA references from the host to the internal native dialog.
	 *
	 * @returns {void}
	 */
	_syncAria() {
		for (const name of ['aria-labelledby', 'aria-describedby']) {
			const value = this.getAttribute(name);
			if (value) this._dialog.setAttribute(name, value);
			else this._dialog.removeAttribute(name);
		}
	}

	/**
	 * Ask consumers whether a user-initiated dismissal may close the dialog.
	 *
	 * @param {'escape'|'backdrop'|'control'} reason Dismissal source.
	 * @returns {void}
	 */
	_requestClose(reason) {
		const request = new CustomEvent('dom:request-close', {
			detail: { reason },
			bubbles: true,
			composed: true,
			cancelable: true,
		});
		const blockedByStatic = this.hasAttribute('static') && reason !== 'control';
		if (this.dispatchEvent(request) && !blockedByStatic) this._setOpen(false);
	}

	/** Fallback when Invoker Commands are unavailable — wire [commandfor] buttons by id. */
	_wireCommandForButtons() {
		const id = this.id;
		if (!id) return;
		for (const btn of document.querySelectorAll(`[commandfor="${id}"]`)) {
			this.on(btn, 'click', () => {
				const cmd = btn.getAttribute('command');
				if (OPEN_COMMANDS.has(cmd)) this._setOpen(true);
				else if (cmd === 'close') this._setOpen(false);
			});
		}
	}

	/**
	 * Handle the native close event and start close-complete tracking.
	 *
	 * @returns {void}
	 */
	_onNativeClose() {
		this._syncAttr(false);
		this._trigger?.setAttribute('aria-expanded', 'false');
		this.emit('dom:close');
		this._waitForCloseComplete();
	}

	/**
	 * Reflect open state changes without recursively re-entering attribute watchers.
	 *
	 * @param {boolean} open Whether the host should carry the open attribute.
	 * @returns {void}
	 */
	_syncAttr(open) {
		if (this._syncing) return;
		this._syncing = true;
		try {
			if (open) this.setAttribute('open', '');
			else this.removeAttribute('open');
		} finally {
			this._syncing = false;
		}
	}

	/**
	 * Open or close the internal native dialog.
	 *
	 * @param {boolean} next Desired open state.
	 * @returns {void}
	 */
	_setOpen(next) {
		if (!this._dialog || this._syncing) return;
		const isOpen = this._dialog.open;
		if (next === isOpen) {
			if (this.hasAttribute('open') !== next) this._syncAttr(next);
			return;
		}
		if (next) {
			this._cancelCloseCompleteWait();
			this.emit('dom:before-open');
			this._dialog.showModal();
			if (!this.querySelector('[autofocus]')) {
				try {
					this._dialog.focus({ preventScroll: true });
				} catch {
					this._dialog.focus();
				}
			}
			this._dialog.scrollTop = 0;
			this._syncAttr(true);
			this._trigger?.setAttribute('aria-expanded', 'true');
			this.emit('dom:open');
		} else {
			this._dialog.close();
		}
	}

	/**
	 * React to controlled attribute changes.
	 *
	 * @param {string} name Changed attribute name.
	 * @param {string|null} _oldValue Previous attribute value.
	 * @param {string|null} newValue New attribute value.
	 * @returns {void}
	 */
	attributeChangedCallback(name, _oldValue, newValue) {
		if (!this.isConnected || !this._dialog || this._syncing) return;
		if (name === 'open') this._setOpen(newValue !== null);
		else this._syncAria();
	}

	/**
	 * Schedule a close-complete event after the active leave transition timing.
	 *
	 * @returns {void}
	 */
	_waitForCloseComplete() {
		this._cancelCloseCompleteWait();
		const run = ++this._closeCompleteRun;
		const delay = transitionTotalMs(this._dialog) + CLOSE_COMPLETE_BUFFER_MS;
		this._closeCompleteTimer = window.setTimeout(() => {
			this._closeCompleteTimer = null;
			if (run !== this._closeCompleteRun || this.isOpen) return;
			this.emit('dom:close-complete');
		}, delay);
	}

	/**
	 * Cancel a pending close-complete event when the dialog reopens or unmounts.
	 *
	 * @returns {void}
	 */
	_cancelCloseCompleteWait() {
		this._closeCompleteRun += 1;
		if (!this._closeCompleteTimer) return;
		window.clearTimeout(this._closeCompleteTimer);
		this._closeCompleteTimer = null;
	}

	/** Whether the modal is open (reads the internal &lt;dialog&gt;). */
	get isOpen() { return !!this._dialog?.open; }
	set isOpen(v) { this._setOpen(!!v); }

	open() { this._setOpen(true); }
	close() { this._setOpen(false); }
	toggle() { this._setOpen(!this.isOpen); }

	// Aliases
	show() { this.open(); }
	hide() { this.close(); }
}

defineDomElement('dom-dialog', DomDialogElement);
