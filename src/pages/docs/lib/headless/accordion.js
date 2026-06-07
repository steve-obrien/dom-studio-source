import { DomElementBase, defineDomElement, uid } from './base.js';

// <dom-accordion multiple>
//   <dom-accordion-item>
//     <button slot="header">Title</button>
//     <div slot="content">…</div>
//   </dom-accordion-item>
// </dom-accordion>
export class DomAccordionItemElement extends DomElementBase {
	static get observedAttributes() { return ['open']; }

	static __doc = {
		name: 'dom-accordion-item',
		description: 'A single collapsible section. Lives inside an <dom-accordion> host.',
		slots: [
			{ name: 'header', description: 'The clickable header. Carries aria-expanded.' },
			{ name: 'content', description: 'The collapsible region. Hidden when closed.' },
		],
		attributes: [
			{ name: 'open', type: 'boolean', description: 'Reflects the open state of the item.' },
		],
		events: [
			{ name: 'dom:change', payload: '{ open }', description: 'Fired when the item is opened or closed.' },
		],
		keyboard: [
			{ keys: 'Enter / Space', action: 'Toggle the section (when header is focused).' },
		],
		example: `<dom-accordion-item open>
  <button slot="header">Section A</button>
  <div slot="content">Lorem ipsum…</div>
</dom-accordion-item>`,
	};

	connectedCallback() {
		this._header = this.querySelector('[slot="header"], [data-header]');
		this._contentSlot = this.querySelector('[slot="content"], [data-content]');
		if (!this._header || !this._contentSlot) return;
		this._ready = false;
		this._content = this._ensurePanel(this._contentSlot);

		const id = uid('acc');
		this._header.id = this._header.id || `${id}-h`;
		this._content.id = this._content.id || `${id}-c`;
		this._header.setAttribute('aria-controls', this._content.id);
		this._content.setAttribute('role', 'region');
		this._content.setAttribute('aria-labelledby', this._header.id);
		this._content.style.overflow = 'hidden';
		this._content.style.willChange = 'height, opacity, transform';
		this._content.style.transition = this._content.style.transition || this._enterTransition();
		this._sync({ animate: false });
		this._ready = true;

		this.on(this._header, 'click', () => this.toggle());
		this.on(this._header, 'keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				this.toggle();
			}
		});
	}

	_ensurePanel(content) {
		const existing = content.parentElement?.dataset?.accordionPanel === 'true'
			? content.parentElement
			: null;
		if (existing) return existing;

		const panel = document.createElement('div');
		panel.dataset.accordionPanel = 'true';
		content.before(panel);
		panel.append(content);
		return panel;
	}

	attributeChangedCallback() {
		this._sync({ animate: this._ready });
	}

	_sync({ animate = true } = {}) {
		if (!this._header || !this._content) return;
		const open = this.boolAttr('open');
		this._header.setAttribute('aria-expanded', String(open));
		this._content.setAttribute('aria-hidden', String(!open));
		this._content.dataset.state = open ? 'open' : 'closed';

		if (!animate || this._prefersReducedMotion()) {
			this._finishTransition();
			this._content.hidden = !open;
			this._content.style.height = open ? '' : '0px';
			this._content.style.opacity = open ? '1' : '0';
			this._content.style.transform = open ? '' : 'translateY(-6px)';
			return;
		}

		if (open) {
			this._expand();
			return;
		}
		this._collapse();
	}

	toggle() {
		const parent = this.closest('dom-accordion');
		const multi = parent?.hasAttribute('multiple');
		const next = !this.boolAttr('open');
		if (next && parent && !multi) {
			parent.querySelectorAll('dom-accordion-item[open]').forEach((it) => {
				if (it !== this) it.removeAttribute('open');
			});
		}
		this.setBoolAttr('open', next);
		this.emit('dom:change', { open: next });
	}

	_expand() {
		this._finishTransition();
		this._content.style.transition = this._enterTransition();
		const startHeight = this._content.hidden ? 0 : this._content.getBoundingClientRect().height;
		this._content.hidden = false;
		this._content.style.height = `${startHeight}px`;
		this._content.style.opacity = startHeight > 0 ? this._computedOpacity() : '0';
		this._content.style.transform = 'translateY(-6px)';
		this._afterFrame(() => {
			this._content.style.height = `${this._content.scrollHeight}px`;
			this._content.style.opacity = '1';
			this._content.style.transform = 'translateY(0)';
			this._onTransitionEnd(() => {
				this._content.style.height = '';
				this._content.style.transform = '';
			});
		});
	}

	_collapse() {
		this._finishTransition();
		this._content.hidden = false;
		this._content.style.transition = 'none';
		const startHeight = this._content.getBoundingClientRect().height || this._content.scrollHeight;
		const startOpacity = Number(this._computedOpacity()) || 1;
		const duration = 340;
		const startedAt = performance.now();
		this._content.style.height = `${startHeight}px`;
		this._content.style.opacity = String(startOpacity);
		this._content.style.transform = 'translateY(0)';
		this._content.offsetHeight;
		const animate = () => {
			const progress = Math.min((performance.now() - startedAt) / duration, 1);
			const eased = this._easeInOut(progress);
			const nextHeight = startHeight * (1 - eased);
			this._content.style.height = `${nextHeight}px`;
			this._content.style.opacity = String(Math.max(0.01, startOpacity * (1 - eased)));
			this._content.style.transform = `translateY(${-3 * eased}px)`;
			if (progress < 1) {
				this._collapseFrame = requestAnimationFrame(animate);
				return;
			}
			this._collapseFrame = null;
			this._content.style.height = '0px';
			this._content.style.opacity = '0';
			this._content.style.transform = 'translateY(-6px)';
			this._content.hidden = true;
			this._content.style.transition = this._enterTransition();
		};
		this._collapseFrame = requestAnimationFrame(animate);
	}

	_easeInOut(progress) {
		return progress < 0.5
			? 4 * progress * progress * progress
			: 1 - Math.pow(-2 * progress + 2, 3) / 2;
	}

	_enterTransition() {
		return 'height 300ms cubic-bezier(0.32, 0.72, 0, 1), opacity 220ms ease, transform 300ms cubic-bezier(0.32, 0.72, 0, 1)';
	}

	_afterFrame(callback) {
		requestAnimationFrame(() => requestAnimationFrame(callback));
	}

	_onTransitionEnd(callback) {
		const token = Symbol('accordion-transition');
		this._transitionToken = token;
		const done = (event) => {
			if (event && event.target !== this._content) return;
			if (event && event.propertyName !== 'height') return;
			if (this._transitionToken !== token) return;
			this._content.removeEventListener('transitionend', done);
			clearTimeout(this._transitionTimer);
			this._transitionOff = null;
			callback();
		};
		this._content.addEventListener('transitionend', done);
		this._transitionOff = () => this._content.removeEventListener('transitionend', done);
		this._transitionTimer = setTimeout(() => done(), 360);
	}

	_finishTransition() {
		if (this._collapseFrame) cancelAnimationFrame(this._collapseFrame);
		this._collapseFrame = null;
		if (this._transitionTimer) clearTimeout(this._transitionTimer);
		this._transitionOff?.();
		this._transitionOff = null;
		this._transitionToken = null;
	}

	_computedOpacity() {
		return getComputedStyle(this._content).opacity || '1';
	}

	_prefersReducedMotion() {
		return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	}
}

export class DomAccordionElement extends DomElementBase {
	static __doc = {
		name: 'dom-accordion',
		description: 'Disclosure-panel group containing one or more <dom-accordion-item> children.',
		slots: [
			{ name: '(default)', description: 'A list of <dom-accordion-item> children.' },
		],
		attributes: [
			{ name: 'multiple', type: 'boolean', description: 'Allow multiple items to be open at once. Otherwise opening one closes the others.' },
		],
		events: [],
		keyboard: [],
		example: `<dom-accordion multiple>
  <dom-accordion-item open>
    <button slot="header">Section A</button>
    <div slot="content">Lorem ipsum…</div>
  </dom-accordion-item>
  <dom-accordion-item>
    <button slot="header">Section B</button>
    <div slot="content">Dolor sit amet…</div>
  </dom-accordion-item>
</dom-accordion>`,
	};

	connectedCallback() {
		this.setAttribute('role', 'group');
	}
}

defineDomElement('dom-accordion-item', DomAccordionItemElement);
defineDomElement('dom-accordion', DomAccordionElement);
