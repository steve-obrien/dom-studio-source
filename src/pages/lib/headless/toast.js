import { DomElementBase, defineDomElement } from './base.js';

export class DomToastRegionElement extends DomElementBase {
	static __doc = {
		name: 'dom-toast-region',
		description: 'A live region for transient notifications. Call show() to add dismissible toasts.',
		events: [{ name: 'dom:dismiss', payload: '{ id }', description: 'Fired when a toast is dismissed.' }],
	};

	connectedCallback() {
		this.setAttribute('role', this.getAttribute('role') || 'region');
		this.setAttribute('aria-live', this.getAttribute('aria-live') || 'polite');
		this.setAttribute('aria-relevant', 'additions removals');
	}

	show({
		id = crypto.randomUUID(),
		title = '',
		description = '',
		tone = 'default',
		duration = 4500,
		html = '',
		content = null,
		dismissible = true,
	} = {}) {
		const toast = document.createElement('div');
		toast.dataset.toastId = id;
		toast.dataset.tone = tone;
		toast.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
		const body = document.createElement('div');
		if (typeof Node !== 'undefined' && content instanceof Node) {
			body.appendChild(content);
		} else if (html) {
			body.innerHTML = html;
		} else if (title) {
			const strong = document.createElement('strong');
			strong.textContent = title;
			body.appendChild(strong);
		}
		if (description) {
			const text = document.createElement('p');
			text.textContent = description;
			body.appendChild(text);
		}
		const button = document.createElement('button');
		button.type = 'button';
		button.setAttribute('aria-label', 'Dismiss');
		button.textContent = '×';
		toast.append(body);
		if (dismissible) toast.append(button);
		let dismissed = false;
		const dismiss = () => {
			if (dismissed) return;
			dismissed = true;
			toast.remove();
			this.emit('dom:dismiss', { id });
		};
		button.addEventListener('click', dismiss);
		this.appendChild(toast);
		if (duration > 0) window.setTimeout(dismiss, duration);
		return id;
	}
}

defineDomElement('dom-toast-region', DomToastRegionElement);
