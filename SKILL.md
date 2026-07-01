---
name: dom-studio
description: Build, edit, or review application UI with DOM Studio. Use when generating Vue UI with @getdom/studio or @getdom/studio/vue, creating editable Studio specs, composing DOM Studio blocks/components/forms/headless primitives, adding DOM Studio components or docs metadata, or replacing custom UI behavior with DOM Studio primitives.
---

# DOM Studio

DOM Studio is a complete Vue and Web Component UI system for app-like interfaces teams can own, edit, and ship. Prefer its blocks, Vue components, headless primitives, Studio specs, and theme tokens before inventing custom UI behavior.

## Workflow

1. Classify the screen: dashboard, chat, mail, form, login, application shell, settings, detail, or custom.
2. Start from the closest block or example under `src/pages/blocks` when the request matches a common app pattern.
3. Compose with `@getdom/studio` components before writing custom markup; `@getdom/studio/vue` exports the same Vue surface when an explicit subpath is clearer.
4. Use props for behavior and classes for layout, spacing, and small visual adjustments.
5. Use semantic theme utilities, not raw colors, unless defining a theme.
6. Return a Studio spec when the UI should remain visually editable.
7. Validate by running the app or build and checking the changed route at desktop and mobile sizes.

## Imports

```js
import {
	DomButton,
	DomCard,
	DomCombobox,
	DomForm,
	DomTextInput,
} from '@getdom/studio';
```

The package root exports the same Vue surface as `@getdom/studio/vue`. Use headless custom elements by importing `@getdom/studio/headless`; Vite treats tags beginning with `dom-` as custom elements.

## Component Choice

- Use blocks for complete screens: dashboard, chat, mail, forms, login, and application layout.
- Use `DomCard` for contained app surfaces and grouped content.
- Use `DomButton` for actions; set `variant`, `size`, `loading`, and `disabled` with props.
- Use `DomDialog`, `DomDrawer`, `DomPopover`, `DomDropdown`, `DomMenu`, `DomContextMenu`, and `DomCommandPalette` instead of recreating overlays, focus handling, or keyboard navigation.
- Use `DomTabs`, `DomAccordion`, and `DomTreeView` for structured navigation and disclosure.
- Use `DomToastStack`, `DomToastItem`, and `useToasts` for notifications.
- Use `DomNativeSelect` for small native option lists, `DomListbox` for custom single-choice lists, `DomCombobox` for search plus committed selection, and `DomAutocomplete` for free text with suggestions.
- Use `DomCalendar` for month-grid date picking and `DomDatePicker` for typed date entry with a popover calendar.
- Use `DomCodeInput` for prompts, snippets, templates, and structured text; use `DomJsonInput` for parsed JSON values; use `DomJsonListInput` for schema-aware arrays such as options, commands, menu rows, and inspector data.
- Use `DomAppShell`, `DomAppTopBar`, `DomAppBottomNav`, `DomAppListItem`, `DomSafeArea`, and `DomActionSheet` for Capacitor-style app screens.

## Studio Specs

Return a Studio spec when generated UI should be editable later. A spec is a UI tree, not a component discovery record.

```json
{
	"id": "account-settings",
	"label": "Account settings",
	"component": "DomCard",
	"props": {
		"padding": "lg",
		"class": "w-full max-w-2xl"
	},
	"children": [
		{
			"id": "email",
			"label": "Email input",
			"component": "DomTextInput",
			"props": {
				"label": "Email address",
				"placeholder": "you@example.com"
			}
		}
	]
}
```

Use component export names such as `DomTextInput` or ordinary HTML tags such as `section`, `h2`, and `p`. Avoid anonymous layers and large unstructured HTML blobs when a spec would preserve intent.
