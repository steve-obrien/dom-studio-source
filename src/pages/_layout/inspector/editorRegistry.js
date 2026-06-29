import { markRaw } from 'vue';
import {
	DomTextInput,
	DomTextareaInput,
	DomNumberInput,
	DomRangeInput,
	DomPositionInput,
	DomSelectInput,
	DomCombobox,
	DomTagCombobox,
	DomToggle,
	DomColorInput,
	DomJsonListInput,
	DomCodeInput,
	DomJsonInput,
	DomIconSelector,
} from '../../lib/vue';
import DomPropDefinitionInput from './editors/DomPropDefinitionInput.vue';
import DomValidatorInput from './editors/DomValidatorInput.vue';

// Editor components are referenced by their actual component name in spec
// schemas (e.g. `_edit: { component: 'DomSelectInput' }`). The indirection keeps
// production output (anything rendered through DomRenderer) free of form code.
//
// To add your own editor: `registerEditor('MyEditor', MyEditorComponent)`.

const editors = {
	DomTextInput: markRaw(DomTextInput),
	DomTextareaInput: markRaw(DomTextareaInput),
	DomNumberInput: markRaw(DomNumberInput),
	DomRangeInput: markRaw(DomRangeInput),
	DomPositionInput: markRaw(DomPositionInput),
	DomSelectInput: markRaw(DomSelectInput),
	DomCombobox: markRaw(DomCombobox),
	DomTagCombobox: markRaw(DomTagCombobox),
	DomToggle: markRaw(DomToggle),
	DomBooleanInput: markRaw(DomToggle),
	DomColorInput: markRaw(DomColorInput),
	DomJsonListInput: markRaw(DomJsonListInput),
	DomCodeInput: markRaw(DomCodeInput),
	DomJsonInput: markRaw(DomJsonInput),
	DomIconSelector: markRaw(DomIconSelector),
	DomPropDefinitionInput: markRaw(DomPropDefinitionInput),
	DomValidatorInput: markRaw(DomValidatorInput),
};

/**
 * Resolve an inspector editor component by registry name.
 *
 * @param {string} name Editor component name.
 * @returns {import('vue').Component|null}
 */
export function getEditor(name) {
	return editors[name] || null;
}

/**
 * Resolve the fallback editor used when a field does not name one explicitly.
 *
 * @returns {import('vue').Component}
 */
export function getDefaultEditor() {
	return editors.DomTextInput;
}

/**
 * Register or replace an inspector editor component.
 *
 * @param {string} name Editor component name.
 * @param {import('vue').Component} component Vue component used to edit the field.
 * @returns {void}
 */
export function registerEditor(name, component) {
	editors[name] = markRaw(component);
}

/**
 * List registered inspector editor names.
 *
 * @returns {Array<string>}
 */
export function listEditors() {
	return Object.keys(editors);
}
