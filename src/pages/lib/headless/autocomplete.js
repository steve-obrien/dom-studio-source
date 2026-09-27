import { defineDomElement } from './base.js';
import { ComboBase } from './combobox.js';

export class DomAutocompleteElement extends ComboBase {
	static __doc = {
		name: 'dom-autocomplete',
		description: 'Free-text autocomplete. Suggestions are optional; typed values are valid and Enter commits the current text.',
		slots: [
			{ name: 'input', description: 'The text input. Gets role="combobox" and aria-controls wired automatically.' },
			{ name: 'list', description: 'Optional suggestions. The list may be updated by a framework or server lookup.' },
		],
		attributes: [
			{ name: 'value', type: 'string', description: 'Current text value.' },
			{ name: 'open', type: 'boolean', description: 'Reflects whether suggestions are visible.' },
			{ name: 'placement', type: 'string', description: 'Preferred floating placement before collision handling.' },
			{ name: 'floating-mode', type: "'viewport' | 'anchor'", description: 'viewport keeps suggestions inside the browser; anchor keeps them attached to the input while scrolling.' },
			{ name: 'data-menu-id', type: 'string', description: 'Id of an external or teleported suggestion list.' },
			{ name: 'filter-options', type: 'string', description: 'Set false for server-filtered suggestions.' },
			{ name: 'has-more', type: 'boolean', description: 'Request another page at the loaded keyboard boundary.' },
		],
		events: [
			{ name: 'dom:input', payload: '{ value }', description: 'Fired whenever the text value changes.' },
			{ name: 'dom:query', payload: '{ query }', description: 'Fired whenever the user types. Useful for server lookups.' },
			{ name: 'dom:select', payload: '{ value, label, option }', description: 'Fired when a suggestion is selected.' },
			{ name: 'dom:custom', payload: '{ value, label }', description: 'Cancelable event fired when Enter commits free text.' },
			{ name: 'dom:change', payload: '{ value, option, custom }', description: 'Fired when text or a suggestion is committed.' },
			{ name: 'dom:open', description: 'Fired when suggestions open.' },
			{ name: 'dom:close', description: 'Fired when suggestions close.' },
			{ name: 'dom:load-more', payload: '{ query }', description: 'Fired when keyboard navigation reaches the loaded page boundary.' },
		],
	};

	get _freeText() { return true; }
	get _valueMode() { return 'text'; }
	get _activeOnFilter() { return false; }
}

defineDomElement('dom-autocomplete', DomAutocompleteElement);
