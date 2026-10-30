# DOM Studio

DOM Studio is a Vue 3 and Web Component interface system for application UI.

It is designed for the complete controls that product applications need—not
only UI primitives:

- **DataGrid** with typed filters, sorting, selection, virtual rows, custom cells, and remote query state.
- **Kanban** with controlled resources, keyboard movement, drag ordering, custom cards, and persistence-ready events.
- **Media browser** with folders, uploads, file inspection, selection, and application-owned storage boundaries.
- **Month calendar and week planner** for scheduling, custom records, drag-to-reschedule, and server-loaded date windows.
- Forms, overlays, navigation, feedback, mobile shells, headless elements, and complete application blocks.

## Install

```sh
npm install @getdom/studio
```

For the quickest start, import the maintained Vue components and the complete
Tailwind CSS v4 stylesheet:

```js
import { DomButton, DomCard, DomForm } from '@getdom/studio';
import '@getdom/studio/style.css';
```

For a production app, let your own stylesheet run Tailwind and own the theme:

```css
@import "tailwindcss";
@import "@getdom/studio/tailwind.css";

:root {
	--canvas: #fff;
	--canvas-fg: oklch(0.145 0 0);
	--primary: oklch(0.205 0 0);
	--primary-fg: oklch(0.985 0 0);
	/* Add the remaining semantic theme values for your app. */
}
```

`tailwind.css` supplies DOM Studio's Tailwind sources, semantic utility mapping,
and intrinsic component styles without choosing the theme values. Copy
`theme.css` into your project when you want all of DOM Studio's defaults as a
starting point, then edit that local copy.

Some components render custom elements whose tags start with `dom-`. Tell Vue
about them in `vite.config.js`:

```js
import vue from '@vitejs/plugin-vue';

export default {
	plugins: [
		vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('dom-') } } }),
	],
};
```

## Component docs in the package

`docs/components/` has one Markdown file per component, such as
`docs/components/DomDataGrid.md`, with props, defaults, events, slots, template
ref methods, keyboard support and types. Some also include a usage guide and
working examples. Start at `docs/components/README.md`. Coding agents can read
these files directly from `node_modules/@getdom/studio`.

The explicit Vue entry point exports the same component surface:

```js
import { DomButton } from '@getdom/studio/vue';
```

Register the framework-neutral custom elements when required:

```js
import '@getdom/studio/headless';
```

Embed the DOM designer (beta) from its own entry point, which includes the Vue
template compiler. Pass the components people can insert and where to keep
their work:

```js
import * as studio from '@getdom/studio/vue';
import { DomDesigner, catalogFromExports, createHttpStorage } from '@getdom/studio/designer';

const catalog = catalogFromExports(studio);
const storage = createHttpStorage({ endpoint: '/api/designs' });
// <DomDesigner :catalog="catalog" :storage="storage" storage-key="home-page" />
```

The same entry exports the editor core: documents, operations, history,
storage adapters, and Vue import and export with source maps.

## Examples and walkthroughs

Every component page includes live examples, copyable Vue source, its public
props and events, and implementation notes:

- [Install and theme setup](https://getdom.studio/install)
- [DataGrid examples](https://getdom.studio/data/data-grid)
- [Kanban, DataGrid, and calendar sharing one resource list](https://getdom.studio/data/kanban)
- [Media browser and file-picker walkthrough](https://getdom.studio/data/media-browser)
- [Month calendar planning examples](https://getdom.studio/data/month-calendar)
- [Week planner and drag-to-create scheduling](https://getdom.studio/data/week-planner)
- [Application blocks](https://getdom.studio/blocks)
- [Theming guide](https://getdom.studio/theming)
- [Designer and embedding `DomDesigner`](https://getdom.studio/designer)

## Peer dependencies

- Vue 3.5 or later.
- Tailwind CSS 4.2 or later configured in the consuming application.
- Vue Router 4.6 or later.
- Pinia 2.3 or 3.

## Licence

The package is publicly downloadable for local evaluation. A paid DOM Studio
licence is required for production, deployed, distributed, commercial, or
client use. See `LICENSE.md` in this package for the complete terms.

Documentation, examples, licences, and source access are available from
[getdom.studio](https://getdom.studio).

## Charts and reporting

Data Visualisation lives at `/charts`. Use `DomLineChart`, `DomAreaChart`, `DomBarChart`, `DomDonutChart`, and `DomSparkline` for application-owned records, `DomMetricCard` for summary measurements, and `DomDateRangePicker` for inclusive reporting dates and comparison periods. The chart family uses Unovis 1.7 and loads the drawing engine after browser mount. Headings and data tables render on the server.

Cartesian charts accept `rows`, `xKey`, and `series` definitions with stable keys, labels, and optional colours. Use `xType="time"` for proportional date spacing and `xType="number"` for numeric coordinates. Default category axes preserve record order. Missing measurements remain distinct from zero. Percentage stacks require non-negative values; `format="percent"` expects fractional values. Applications own aggregation, queries, and comparison calculations.

Chart colours use `--chart-1` through `--chart-5` from the default theme. Consumers supplying their own theme should define these tokens; charts fall back to the primary colour. `DomChartContainer`, `DomChartLegend`, and `DomChartTooltip` are available for custom Unovis compositions. Unovis dependencies are included with the package; source-copy consumers must also install matching `@unovis/vue` and `@unovis/ts` versions (`1.7.0`).
