## When to use it

Use `DomDataGrid` for tables of records people scan, sort, filter, select and edit: admin lists, database tables, ledgers, logs and spreadsheet-style screens. It handles virtual scrolling, typed filters, sorting, row selection, inline editing, range copy and paste, grouping with totals, pinned columns and CSV or Excel export.

The grid never changes your data. It renders the rows you pass, reports what the person did through events, and leaves saving to you.

## Quick start

```vue
<script setup>
import { ref } from 'vue';
import { DomDataGrid } from '@getdom/studio';

const rows = ref([
	{ id: 1, customer: 'Atlas Works', status: 'paid', amount: 1234.5, orderedAt: '2026-03-14' },
	{ id: 2, customer: 'Northstar Labs', status: 'pending', amount: 89, orderedAt: '2026-03-15' },
]);

const columns = [
	{ key: 'id', label: 'Order #', type: 'number', width: 96 },
	{ key: 'customer', label: 'Customer' },
	{ key: 'status', label: 'Status', type: 'select', options: ['pending', 'paid', 'shipped'] },
	{ key: 'amount', label: 'Amount', type: 'currency', currency: 'USD', locale: 'en-US' },
	{ key: 'orderedAt', label: 'Ordered', type: 'date' },
];
</script>

<template>
	<DomDataGrid :rows="rows" :columns="columns" title="Orders" resource-label="orders" />
</template>
```

The grid uses DOM Studio's styles and one custom element for its popovers. Set both up once per app, as the package README describes: import `@getdom/studio/style.css` (or `@getdom/studio/tailwind.css` from your own Tailwind stylesheet), and tell Vue that tags starting with `dom-` are custom elements in `vite.config.js`:

```js
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('dom-') } } })
```

## Defaults to check first

The grid starts as a full spreadsheet. Turn off what a simple list doesn't need.

| Prop | Default | Change it when |
| --- | --- | --- |
| `selectable` | `true` | Rows can't be selected: `:selectable="false"`. |
| `showRowNumbers` | `true` | You don't want the 1, 2, 3 column: `:show-row-numbers="false"`. |
| `showColumnLetters` | `true` | You don't want the A, B, C row above the headers: `:show-column-letters="false"`. |
| `resizableColumns` | `true` | Columns should keep fixed widths. |
| `toolbar` | `true` | You render your own title, search and counts: `:toolbar="false"`. |
| `title` | `'Data grid'` | Always set it, or hide the toolbar. |
| `height` | `'34rem'` | This is a maximum height for the scrolling body. Use a CSS size or pixels. |
| `density` | `'compact'` | Rows should breathe: `density="comfortable"`. |
| column `currency` | `'GBP'` | Set `currency` on every currency column, such as `'USD'`. |
| column `locale` | `'en-GB'` | Set `locale`, such as `'en-US'`, for US dates and number formats. |

Currency cells drop the minor units at 1,000 and above (`£1,235`). Pass `format` and `formatAggregate` when you need exact amounts such as `$1,234.50`.

## Columns

Each column is a plain object. `key` is required and is also the row property to read unless you set `field` or `accessor`. The column `type` decides sorting, formatting, alignment, the filter control and the editor.

| `type` | Sorts as | Filter control | Editor | Default width and alignment |
| --- | --- | --- | --- | --- |
| `text` | Case-insensitive text | Contains text | Text input | 13rem, left |
| `number` | Number | Min and max | Number input | 7rem, right |
| `currency` | Number | Min and max | Number input | 8.5rem, right |
| `date` | Date | Date range | Date input | 9.5rem, left |
| `boolean` | false before true | Yes or no | Toggle on Space or double-click | 7rem, center |
| `select` | Option value as text | Checklist of options | Select list | 9rem, left |

Useful column options:

- `options` on select columns: strings or `{ label, value, tone }` objects. `tone` (green, amber, red, blue) colours the status pill. Always supply options on large data sets; otherwise the grid scans every row to find them.
- `format(value, row, column)` returns the display text. Global search matches this text, not the raw value.
- `accessor(row, column)` computes a value, such as `quantity * price`. Columns with an accessor are read-only.
- `sortAccessor(row, column)` sorts by something other than the cell value.
- `sortable: false`, `filterable: false`, `searchable: false`, `resizable: false`, `exportable: false` and `hidden: true` turn features off per column.
- `pinned: 'left'` or `'right'` keeps the column in view while the grid scrolls sideways.
- `component` renders every cell with your Vue component. It receives `row`, `column`, `value`, `formatted`, `rowIndex` and `rowKey`, can emit `update:value` to change the cell and `action` to send a command, which the grid re-emits as `cell-action`.

Store dates as `YYYY-MM-DD` strings or `Date` objects. Strings in that form sort, filter and format correctly and are the cheapest to sort.

## Sorting, search and filters

Clicking a sortable header cycles ascending, descending, then unsorted. With `multi-sort`, each header click adds or changes a rule in `sort.rules`, which a server can translate into a multi-column `ORDER BY`.

Sorting, search and filters are controlled props, so you can set them from your own controls and keep them in the URL or a store:

```vue
<DomDataGrid
	v-model:sort="sort"
	v-model:search="search"
	v-model:filters="filters"
	:rows="rows"
	:columns="columns"
/>
```

- `sort` is `{ key, direction }` with direction `'asc'`, `'desc'` or `''`, or `{ rules: [...] }`.
- `search` matches the formatted text of every searchable column.
- `filters` is keyed by column key. Select columns take `{ type: 'select', values: ['paid', 'shipped'] }`, number and currency columns `{ min, max }`, date columns `{ start, end }`, boolean columns `{ value: true }`, and text columns `{ value: 'atlas', operator: 'contains' }` with operator `'contains'`, `'starts'` or `'equals'`.

Filters applied from your own controls also show as chips in the toolbar and on the column header, and "Clear filters" clears them.

## Editing

Editing takes two steps: let the cells be edited, then write each change back to your rows.

```vue
<script setup>
function applyChange({ row, column, value }) {
	row[column.field || column.key] = value;
}
</script>

<template>
	<DomDataGrid :rows="rows" :columns="columns" editable cell-selection @cell-update="applyChange" />
</template>
```

- `editable` lets every plain column be edited. Set `editable: false` on a column to lock it, or `editable: true` to allow just that column. A function `editable(row, column)` decides per cell.
- People double-click a cell to edit it. Add `cell-selection` for keyboard editing: arrow keys move between cells, Enter, F2 or typing starts an edit, Enter saves and moves down, Tab saves and moves right, Escape cancels.
- `cell-selection` also adds range selection, copy, cut, paste from Excel or Google Sheets, Delete to clear, and undo or redo.
- `validate(value, row, column)` returns `true` or an error message, which is shown and keeps the old value. Add a check for empty text if a column must not be blank.
- `parse(text, column)` converts typed or pasted text before validation.
- `cell-update` fires once per changed cell with `{ row, column, rowIndex, rowKey, value, previousValue, source }`. `cells-update` fires once per edit, paste, delete, undo or redo with every change, so you can save a batch in one request.

Edits change your rows, and sorting, grouping, filters and totals follow, because the grid reads from them.

## Selection

Rows have checkboxes by default. Bind `v-model:selected-keys` to read or set the selection. Keys come from `row-key`, which defaults to the `id` field; pass a field name or a function when your rows use another key.

The header checkbox selects or clears every row that matches the current search and filters, including rows that are scrolled out of view.

## Grouping and totals

```vue
<DomDataGrid v-model:group-by="groupBy" :rows="rows" :columns="columns" show-totals column-menu />
```

- `group-by` takes a column key, or an array of keys for nested groups. Each group row shows its value, a row count and the aggregate of every column that sets `aggregate`.
- `aggregate` is `'sum'`, `'avg'`, `'count'`, `'min'`, `'max'` or a function `(values, rows, column)`.
- `show-totals` adds a totals row pinned to the bottom with the same aggregates over all filtered rows.
- `groups-expanded` sets whether groups start open. The template ref methods `expandAllGroups()` and `collapseAllGroups()` open or close all of them.
- `column-menu` adds a menu to every header so people can group by or pin any column themselves.

## Export

`exportable` adds an Export menu to the toolbar with CSV and Excel (.xlsx) downloads. Exports contain the filtered, sorted rows with typed numbers, dates and currency. To export from your own button, call `exportCsv()` or `exportExcel()` from the `toolbar-actions` slot props or a template ref:

```vue
<DomDataGrid ref="grid" :rows="rows" :columns="columns" export-file-name="orders" />
<button type="button" @click="grid.exportCsv()">Export CSV</button>
```

Use `exportable: false` to leave a column out, and `exportValue(value, row, column)` to change what is exported and copied.

## Large data sets

Add `virtual-rows` for in-memory data sets above a few hundred rows. Only the rows in view, plus `virtual-row-buffer` rows above and below, are mounted, and search, filters, sorting, grouping and selection still cover every row. Rows have a fixed height from the density; set `virtual-row-height` if your custom cells are taller.

For speed on large sets, supply `options` on select columns and keep dates as `YYYY-MM-DD` strings.

## Server data

Set `remote` when a server does the searching, filtering, sorting and paging. The grid then renders `rows` exactly as given and fires `query-change` with `{ search, filters, sort }` whenever the person changes them.

```vue
<DomDataGrid
	:rows="page.rows"
	:columns="columns"
	:total-rows="page.total"
	:loading="loading"
	remote
	@query-change="load"
	@viewport-end="loadMore"
/>
```

`total-rows` sets the count in the toolbar. `viewport-end` fires near the bottom of the scroll area for cursor-based loading.

A resource API can take the query as it comes, with paging beside it. The same endpoint can serve numbered pages and cursor-based scrolling:

```js
// Request
{
	resource: 'customers',
	query: {
		search: 'atlas',
		filters: {
			status: { type: 'select', values: ['active', 'trial'] },
			arr: { type: 'currency', min: 50000, max: 250000 },
		},
		sort: { key: 'updatedAt', direction: 'desc', rules: [{ key: 'updatedAt', direction: 'desc' }, { key: 'arr', direction: 'desc' }] },
	},
	pagination: { strategy: 'page', page: 2, pageSize: 25 }, // or { strategy: 'cursor', cursor: 'customer:25', limit: 25 }
}

// Response
{
	data: [/* rows */],
	pageInfo: { strategy: 'page', page: 2, pageSize: 25, pageCount: 8, total: 184, hasNextPage: true, nextCursor: 'customer:50' },
}
```

## Layout

- `layout="flush"` removes the outer border, rounding and shadow for edge-to-edge pages; `gutter-class` aligns the outer cell padding with your page gutter.
- Narrow screens scroll the table sideways inside its frame, and pinned columns unpin themselves when they would leave too little room to scroll.
- Use the `cell` slot for one-off cell rendering, `toolbar-actions` for buttons next to search, and `empty` for a custom empty state.

## Examples

### Trading desk: edit, group, pin and export

2,500 positions grouped by desk, with Ticker pinned left and P&L pinned right. Click a cell and use the arrow keys, drag a range to see its sum, double-click or type to edit, paste from a spreadsheet, and export the current view to Excel.

<!-- example: TradingDeskGrid -->

### Database-style account table

Column filters use typed controls: date columns open a date range, number columns use min and max, and select columns use checklists. Applied filters show in both the header and the toolbar.

<!-- example: CustomerDatabase -->

### Flush page edges

`layout="flush"` with `gutter-class="px-4 sm:px-6"` lines the toolbar, footer and outer cells up with the page gutter.

<!-- example: FlushGrid -->

### Virtual rows for in-memory data

10,000 rows held in memory. Search, filters and sorting cover every row, and only the visible rows are mounted.

<!-- example: LargeMemoryGrid -->

### Keyword table sort presets

`multi-sort` turns header clicks into ordered sort rules. Click Volume, then Difficulty, to sort by both.

<!-- example: KeywordOpportunityGrid -->

### Server pagination and forever scrolling

One resource endpoint serves numbered pages and cursor-based scrolling. The grid sends search, filters and sort; the app adds paging.

<!-- example: ServerResourceGrid -->

### Live SQL query log

New rows stream into a server-backed grid while search, filters and a `duration_ms desc` sort keep the slowest statements on top.

<!-- example: LiveSqlQueryLog -->

### Column components and row actions

`column.component` renders every cell in a column with your component, here an inline name editor and a row actions menu.

<!-- example: CustomColumnComponents files: EditNameCell, RowActionsCell -->
