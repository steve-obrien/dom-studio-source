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
4. Use props for behavior and Tailwind CSS v4 utilities in the template for layout, spacing, typography, color, states, responsive behavior, and transitions.
5. Use semantic theme utilities, not raw colors, unless defining a theme.
6. Return a Studio spec when the UI should remain visually editable.
7. Validate by running the app or build and checking the changed route at desktop and mobile sizes.

Component styling is Tailwind-first. Keep scoped CSS only for intrinsic component behavior or CSS that would be materially less readable as utilities, such as coordinated container queries, complex selector relationships, pseudo-elements, and keyframes. Do not create BEM class trees solely as presentational hooks.

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
- Use `DomTabs`, `DomAccordion`, `DomTreeView`, and `DomScrollMenu` for structured navigation, disclosure, and scroll-linked page contents. Use `DomBreadcrumbs` for an application-owned route or resource path and `DomStepper` for controlled multi-step progress.
- Use `DomToastStack`, `DomToastItem`, and `useToasts` for notifications.
- Use `DomNativeSelect` for small native option lists, `DomListbox` for custom single-choice lists, `DomCombobox` for search plus committed selection, and `DomAutocomplete` for free text with suggestions.
- Use `DomCalendar` for month-grid date picking and `DomDatePicker` for typed date entry with a popover calendar.
- Use `DomTextareaInput` for fixed or autosizing multiline fields. Use `DomTextareaComposer` when attachment previews, leading controls, trailing actions, and submit behavior belong inside one autosizing input frame; keep upload state and attachment records in the application.
- Use `DomKanban` when one application-owned resource list needs status columns, card and column ordering, async creation hooks, custom card components, and drag or keyboard movement. Keep grid/calendar view switching and remote persistence in the application layer.
- Use `DomFilterBar` when search and logical filter values should form one controlled query shared by resource lists, grids, timelines, routes, or Pinia stores. Translate its `FilterBarQuery` at the application API boundary.
- Use `DomActivityTimeline` to project ordered application-owned rows into an activity trail through logical field keys. Keep querying, chronology, pagination, permissions, and persistence in the application layer.
- Use `DomMonthCalendar` for date-led month planning and `DomWeekPlanner` when fixed-width day swim lanes need precise timed placement, configurable drag-to-create ranges, a live current-time marker, or virtualized horizontal ranges such as a full year.
- Use `DomCodeInput` for prompts, snippets, templates, and structured text; use `DomJsonInput` for parsed JSON values; use `DomJsonListInput` for schema-aware arrays such as options, commands, menu rows, and inspector data.
- Use `DomCodeBlock` for highlighted read-only code and `DomJsonViewer` for inspecting JSON payloads, diagnostics, and implementation data.
- Use `DomTextDiff` for reviewable before-and-after copy, AI rewrite suggestions, SEO field replacements, and unified or split code edits.
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
