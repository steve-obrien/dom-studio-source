# Component discovery and documentation

The public [component metadata guide](https://getdom.studio/component-spec) explains `__doc`, Vue props, and `_edit`. This document covers the repository integration behind that page.

## Adding a component

Put a `Dom*.vue` file one folder below `src/pages/components`, `data`, `charts`, `dev`, `forms`, `mobile`, or `visual`. For example:

```text
src/pages/forms/my-input/
	DomMyInput.vue
	examples/
		Basic.vue
```

An `Index.vue` in the same folder supplies an authored documentation page. Otherwise, the router creates a `GeneratedComponentPage.vue` with a live playground, prop reference, slots, and events. Examples remain beside the component for authored pages to import; the generated page does not automatically render those example files.

Public package exports are separate from documentation discovery. Add the export in `src/pages/lib/vue/index.js` and run `npm run types:generate` when introducing a public component.

## Catalogue and runtime records

`scripts/lib/component-catalog.mjs` scans the component folders and extracts serializable `defineOptions()` metadata. `npm run catalog:generate`, the dev/build scripts, and the Vite catalogue plugin maintain `src/pages/_layout/componentCatalog.generated.js`. Do not edit that file by hand.

| Module | Responsibility |
| --- | --- |
| `componentManager.js` | Reads the generated catalogue and supplies metadata records and lazy loaders. |
| `componentLoaders.js` | Loads a component or its raw source through Vite import maps when requested. |
| `componentRuntimeRecords.js` | Supplies live Vue component objects to editor surfaces through eager imports. |
| `componentInspector.js` | Normalizes labels, visibility, navigation, and Studio metadata from catalogue or runtime records; reads props when a component object is available. |
| `docs/inspect.js` | Builds prop, slot, event, and type documentation from runtime definitions, metadata, and source comments. |
| `GeneratedComponentPage.vue` | Composes the standard playground and reference helpers. |
| `src/routes.js` | Creates generated routes where no authored page exists. |
| `sideNavLinks.js` | Builds navigation from the catalogue and owns presentation fallbacks. |
| `inspector/componentRegistry.js` | Builds the Studio palette, defaults, accepted children, and editor hints. |

Layout modules in this table live under `src/pages/_layout` unless a full path is given.

Catalogue records contain path facts plus `doc` and `studio`. They do not contain Vue implementations. Runtime records contain a component object, not a string component name. These shapes serve different loading requirements and should not be treated as one JSON persistence format.

`__doc.hidden` suppresses navigation and palette entries; it is not route access control. `__doc.nav.hidden` and `__doc.studio.hidden` affect their respective surfaces. Generated route creation does not filter on these flags.

`__doc.nav.section` optionally selects a navigation category without changing the source folder, route, or package export. Set it to `'ai'` to include a component in the AI sidebar, search category, and overview. Unknown categories fall back to the source section. For a family with several components on one page, give every component the same section and set `nav.primary: true` on the main component; its metadata determines the family's sidebar placement.

## Reusing the docs engine

The docs engine is repository infrastructure, not a standalone package entry point. Moving it into another app requires the catalogue generator and Vite integration, import maps, router setup, metadata inspector, page helpers, their dependencies, and compatible styles. Merely copying `componentManager.js` and `GeneratedComponentPage.vue` is insufficient.

Keep the metadata catalogue separate from runtime imports so navigation does not preload all component implementations.

Saved Studio layouts have their own format. See [Studio renderer data](studio-specs.md).
