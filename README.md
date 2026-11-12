# DOM Studio

This is the main development and source repository for DOM Studio. It includes
the components, blocks, examples, documentation application, and reviewed
historical development commits. Use of the source remains subject to
[LICENSE.md](LICENSE.md).

The imported history excludes the former private application, credential files,
and internal work records. Historical release markers use the `history/` prefix.
See [repository migration](docs/repository-migration.md) for the history boundary
and the separate production deployment and npm publishing cutover.

DOM Studio is a complete Vue and Web Component UI system you can own, edit, and ship with humans and LLMs working from the same component contract.

It includes:

- Vue components exported from `@getdom/studio/vue`.
- Framework-neutral custom elements registered from `@getdom/studio/headless`.
- The DOM designer and its editor core from `@getdom/studio/designer` (beta).
- Repository-local, auto-discovered blocks in `src/pages/blocks` for app shells, communication surfaces, conversion flows, operations consoles, and form-led product moments.
- Studio metadata, examples, prop docs, and `llms.txt` so generated apps stay inspectable and editable.

## Usage

The complete quick-start stylesheet includes Tailwind, DOM Studio's component
integration, and the default light and dark themes:

```js
import { DomButton, DomCard, DomForm, DomTextInput } from '@getdom/studio/vue';
import '@getdom/studio/headless';
import '@getdom/studio/style.css';
```

For production applications, import `@getdom/studio/tailwind.css` from the
application's Tailwind stylesheet and keep the semantic theme values in that
application. `@getdom/studio/theme.css` contains copyable defaults.

The package root exports the same Vue surface as `@getdom/studio/vue`, so
`import { DomButton } from '@getdom/studio'` also works when you want a shorter
import path.

Headless primitives use the `dom-*` custom element prefix:

```html
<dom-dialog>
	<button slot="trigger">Open</button>
	<form method="dialog">...</form>
</dom-dialog>
```

The published package exports the Vue layer, headless primitives, styles, and AI context files. Block implementations remain in this repository's source tree for direct reuse and adaptation rather than as a versioned import surface.

## Why the components live in the website

The DOM Studio website is the working documentation for the same components exported by the package. Component implementations, runnable examples, and documentation live together under `src/pages`, so the website demonstrates the actual components you use in an application.

The repeatable folder structure keeps that context together:

```text
component-name/
	DomComponentName.vue
	examples/
		Basic.vue
	Index.vue
```

`DomComponentName.vue` contains the implementation, props, and `__doc` metadata. `examples/` shows how to compose and use it. `Index.vue` is the documentation page, bringing the component, examples, and reference material together. Components without a custom `Index.vue` can use generated documentation from their metadata.

Keeping library source inside a website's page tree is a little unusual, but it gives humans and AI agents a predictable place to look. An agent can read how a component works, how it should be used, and how it is explained without searching across separate documentation and library projects. When changing a component, its examples and docs are nearby to update and check together.

This is DOM Studio's source organisation. Applications can import the public package or copy its source without adopting the website's routing or documentation shell. See [AI Builders](https://getdom.studio/ai/builders#component-context) for the reasoning behind this convention.

## Component Areas

Component docs are grouped by purpose: `/ai` for AI conversations and media controls, `/components` for general primitives, `/forms` for inputs, `/visual` for presentational UI, `/data` for API-shaped data-driven workflows, `/dev` for code and payload inspection utilities, and `/mobile` for app-shell controls.

The AI section brings agent chat, conversation lists, audio controls, microphone input, camera input, and audio visualisation together. `/ai/ui` covers interaction design, streaming, tools, review, voice, accessibility, and recovery. `/ai/builders` covers generating interfaces with DOM Studio. Existing component URLs and imports stay stable; `__doc.nav.section: 'ai'` groups a component under AI in navigation, search, and the overview.

Multi-line form work uses `DomTextareaInput`, which can stay fixed-height or grow continuously with `autosize` and an optional `maxRows`. Use `DomTextareaComposer` when attachments, supporting controls, and submit behavior need to live inside the same autosizing field frame.

Data views are designed to project application-owned resource rows instead of inventing a new record shape for every surface. For example, `DomFilterBar` can emit the logical query for a resource store while the same release list uses `status` and `position` in `DomKanban`, exposes `status` as a `DomDataGrid` column, maps `createdAt` into `DomActivityTimeline`, and uses `dueDate` in `DomMonthCalendar`; the application remains responsible for switching views, choosing query windows, and persisting mutations.

`DomGantt` projects people or feature rows and dated items onto a horizontal timeline for resource planning, project schedules, and roadmaps. It supports month/week/day zoom, hourly working-time visibility, overlapping bookings, and pointer or keyboard planning. Opt into item movement and right-edge resizing; allow row changes for resource bookings while keeping feature rows fixed. Items use a start date plus an exclusive end or positive duration; applications own creation, editing, and persistence. See `/data/gantt` for interactive examples and run `npm run check:gantt` for date and compressed-axis checks.

General navigation includes controlled `DomStepper` progress for multi-step workflows and `DomBreadcrumbs` for Vue Router, native-link, or application-owned destinations. Their public prop objects are exported as `stepperProps` and `breadcrumbsProps`; Data exports `filterBarProps` and `activityTimelineProps` for wrapper components and tooling.

`DomNotificationInbox` pairs an unread bell and polished popover inbox with
application-owned durable records. Its item contract matches db3.ai in-app
messages, including plain-text content, severity, presentation intent, action,
timestamps, and independent read, dismissal, and archive state. It emits read,
unread, archive, refresh, pagination, and action intents; applications retain
authorization, HTTP, realtime invalidation, cursors, persistence, and retry
policy. Use `notificationToast()` only for newly observed live arrivals, then
render it with `DomToastStack`; never replay loaded inbox history as fresh toasts.

`DomVideoFeed` presents application-owned videos in a vertical, snap-scrolling feed with touch, wheel, keyboard, and desktop button navigation. It plays only the visible video, supports WebVTT captions, and provides caption/action slots. Use `height` for embedded feeds; the default is `100dvh`. See `/components/video-feed` for the interactive example and openly licensed Blender demo media credits.

## Audio and camera input

`DomAudioControls` turns a click-to-talk button into stop, a live waveform, mute, and microphone selection. `DomAudioInput` provides a standalone microphone setup; `DomCameraInput` provides independent webcam selection and a local preview. Capture starts explicitly and emits a `MediaStream` through `@stream`, with `null` on stop. The capture component owns and releases its tracks. `DomAudioVisualizer` observes an existing stream without requesting or owning the device. These components do not record, transmit, or process audio for AI. See `/components/audio-controls` for the working examples and stream lifecycle contract.

## Contained nested menus

`DomMenuStack` uses the App stack engine for sliding menu pages inside any bounded
container, including `DomPopover`. Both desktop and mobile show Back and the
current title. Supply `items` with unique string `id` values (`root` is reserved)
and `label`. Add nested `children`, a Vue `component` with `props`, or a named
`slot` for page content above the child rows. Component objects in reactive data
should use Vue's `markRaw`. Leaf items accept `to` / `href` or emit `select` for
application actions; page items open their contained page. Use a separate child
link when a branch also has an overview route.

Use `height` to bound the menu and `v-model:path` to control navigation, starting
with `['root']`. Visited content and scroll positions stay mounted until the menu
unmounts. The containing popover owns dismissal: close it on `select` when desired.
The root slot and item-named slots receive `{ screen, stack }`; custom components
receive the same props. `stack.push(id)` and `stack.back()` support custom controls.
See `/components/menu-stack` for a profile, editable page, five-level navigation,
and a popover example. Rows use native button/link keyboard behaviour so custom
forms remain ordinary tab stops.

## Desktop app layout

`DomDesktopLayout` provides a pinned app rail, hover and keyboard-focus shortcuts,
an optional resizable left or right sidebar using `DomSplitterPanel`, and a scrollable workspace. Supply ordered
`apps` records and an active ID through `v-model`; compose app-specific content
through the scoped `sidebar` and default slots. Applications own installation,
pinned order, routing, and persistence. Bind `v-model:sidebar-size` to save the desktop width. Compact screens use toggleable navigation. The full demo includes an organization switcher built with `DomDropdown`.

See `/components/desktop-layout` for the component contract and
`/blocks/app-shells/desktop-workspace` for an assistant, pages, code, and installable
calendar demo. `examples/electron-desktop` hosts the same preview in an isolated
native development window; its README contains setup and scope.

## Mobile app layout

`DomAppShell` and `DomAppStack` fill `100dvh` by default. Use a CSS length such as
`height="36rem"` for an embedded app, or `height="100%"` inside a parent with an
explicit height. When nesting a stack in a shell, set the shell's
`:content-scroll="false"` and the stack's `height="100%"`; the stack owns each
screen's scrolling. Safe areas are reserved once. Enable `viewport-fit=cover`
in the viewport meta tag for an edge-to-edge iOS webview.

Mobile stack navigation uses a back button and current title that slide with
the screen. Desktop keeps breadcrumbs. Use the `header` slot to customize the
mobile bar and `breadcrumb` for desktop. The root has no back action. Visited
screens retain local state and scroll until the stack is unmounted.

Stack screens accept any Vue content through slots or components. The settings
example combines `DomAppProfile` (image, name, email, and profile action), grouped
navigation rows, forms, and switches across five levels of navigation.

`DomActionSheet` works without a wrapper as a viewport overlay, including on
desktop. Put it in `DomAppShell`'s `overlay` slot for an app-contained sheet.
`DomAppListItem as="div"` supports rows containing switches or inputs without
nesting interactive controls inside a button.

Existing embedded shells/stacks that previously relied on inherited height
should now specify `height="100%"` explicitly.

`DomSwipeActions` wraps an ordinary row with leading/trailing actions and an
explicit Actions button. Full-swipe shortcuts require opt-in on both the component
and that side's first action. Applications own mutations and undo.
`DomBottomSheet` adds configurable snap heights, a draggable/keyboard-operable
handle, scrolling content, and a pinned footer on the shared drawer foundation.
Use it standalone or in the shell's `overlay` slot.

The shell detects keyboard-sized visual viewport changes while editing. Use
`hide-bottom-on-keyboard` for navigation; leave it off for a bottom composer.
Native hosts can supply `keyboard-inset` in CSS pixels or set
`keyboard-behavior="none"` when they own resizing. Automatic detection is a
viewport heuristic; check target devices and native resize modes. Try
`/mobile/inbox?preview=1` outside the iframe preview for device keyboard testing.

## Block Routing

Block pages are auto-discovered from nested folders under `src/pages/blocks`, so the folder path is the canonical route. For example, `src/pages/blocks/operations/scheduling/resource-scheduler/Index.vue` becomes `/blocks/operations/scheduling/resource-scheduler`.

The router also preserves legacy flat block URLs such as `/blocks/resource-scheduler` by redirecting them to the nested route. That means category reorganisation does not require manual redirect entries for existing block pages.

## LLMs

Point agents at [`public/llms.txt`](public/llms.txt), install the local [`SKILL.md`](SKILL.md) instructions, or use [`public/skills.sh`](public/skills.sh) when you want them to prefer DOM Studio primitives, blocks, theme tokens, and Studio specs.

When consuming the published package, those agent context files are available at `@getdom/studio/llms.txt`, `@getdom/studio/skill`, and `@getdom/studio/skills.sh`.

## Commercial Model

The public `@getdom/studio` package may be installed for local evaluation. A
paid Individual or Team licence is required for production, deployed,
distributed, or client use.

See [`LICENSE.md`](LICENSE.md) for the evaluation grant, commercial permissions,
and redistribution restrictions.

## Package inspection

Build and inspect the npm package locally without publishing it:

```sh
npm run package:check
npm run package:smoke
```

The generated package lives in `dist/npm`. It includes the public runtime,
types, component guides, styles, and agent context. The website, application
server, billing code, and repository-local blocks are excluded from that package.
Use `npm run package:pack` to create a tarball for inspection.

This source repository does not deploy the official website or publish npm
releases. Published package notes are available at
[DOM Studio releases](https://getdom.studio/releases). See
[local package checks](docs/releases.md) for the commands available here.

## Development

Use Node.js 22.12 or newer; Node.js 24 LTS is recommended for this checkout.
Start the documentation app without connecting any external services:

```sh
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:8100`. The development server and Vite live reload share
that port; no local certificate or reverse proxy is required. Most component
pages and in-memory block demos work without database or provider credentials.
Some account, billing, blog, and AI features need their own service configuration
and are unavailable until it is supplied. Do not use production credentials for
local evaluation. See [local development](docs/local-development.md).

```sh
npm run dev:screenshot
npm run build
npm run preview
npm run types:generate
```

The screenshot server uses `http://localhost:8110`; production-build preview uses
`http://localhost:8102`. To run Now's focused tests, install its separate dependencies
once with `npm ci --prefix packages/now`.

The reusable SSR/backend framework prototype lives in `packages/now`.

```sh
npm run check:form-definition
npm run check:theme-ai
npm run now:test
```

Use `npm run check:form-definition` for the fastest structural validation of the form-definition helpers and `npm run now:test` for the reusable SSR/runtime package tests.

Use `npm run types:generate` after changing the public Vue or headless export surface so the published declaration files stay aligned with the package API.

See [component authoring](docs/component-authoring.md) for catalogue generation, docs routing, and source integration, and [Studio renderer data](docs/studio-specs.md) for the saved layout format.

### Motion debugging

The development client can slow every CSS animation and transition to make
visual timing issues easier to inspect:

- Hold Option+A on macOS, or Alt+A on other platforms, for momentary slow motion.
- Double-tap Option+A or Alt+A within 500ms to lock slow motion on; double-tap it
  again to unlock it.
- Releasing either key ends momentary slow motion. Alt alone leaves other shortcuts alone.
- The shortcut is ignored while editing text.
- A fixed badge shows when motion debugging is active and whether it is locked.

The debug duration defaults to four seconds and can be changed with
`--dom-studio-motion-debug-duration`. The keyboard controls and CSS load only
in development mode and are excluded from production builds.

Use `npm run check:theme-ai` only when the theme AI endpoint is reachable. By default it posts to `http://localhost:8100/api/ai/theme`, or you can override that with `THEME_AI_ENDPOINT` and either `THEME_AI_PUBLIC_TOKEN` or `VITE_THEME_AI_PUBLIC_TOKEN`.

The root app is served by Now through `server.js`; `npm run dev`, `npm run build`, and `npm run preview` all use that SSR path.

Use `npm run dev:screenshot` when you need a stable local target for browser or screenshot automation. It binds the dev server to `http://localhost:8110` (bound to `127.0.0.1`).

The public site is configured for `https://getdom.studio`.

## Sitemap

`npm run seo:generate`, included in the build and deployment, scans public page sources and local blog Markdown once and writes `dist/server/sitemap-routes.json`. Each production worker loads this inventory once and merges current `blog_articles` rows when `/sitemap.xml` is requested. Sitemap responses are not cached, so newly published, updated, or deleted database articles are reflected on the next request without rescanning the source tree or redeploying. Development continues to discover source edits on each sitemap request. Builds also write `dist/client/sitemap.xml` as a source-only static fallback.

Static page `lastmod` dates use source-file modification times. The homepage includes `src/pages/Index.vue` and its supporting files under `src/pages/_home`; changing the route table does not override a known page-source date.

## Charts and reporting

The website records anonymous server-side totals for its Get full access buttons.
Run `npm run report:access-clicks` for a private daily report, with CSV and JSON
exports available. See [click reporting](docs/access-click-reporting.md) for the
migration, configuration, privacy boundaries and bot-filtering limitations.

Data Visualisation lives at `/charts`. Use `DomLineChart`, `DomAreaChart`, `DomBarChart`, `DomDonutChart`, and `DomSparkline` for application-owned records, `DomMetricCard` for summary measurements, and `DomDateRangePicker` for inclusive reporting dates and comparison periods. The chart family uses Unovis 1.7 and loads the drawing engine after browser mount. Headings and data tables render on the server.

Cartesian charts accept `rows`, `xKey`, and `series` definitions with stable keys, labels, and optional colours. Use `xType="time"` for proportional date spacing and `xType="number"` for numeric coordinates. Default category axes preserve record order. Missing measurements remain distinct from zero. Percentage stacks require non-negative values; `format="percent"` expects fractional values. Applications own aggregation, queries, and comparison calculations.

Chart colours use `--chart-1` through `--chart-5` from the default theme. Consumers supplying their own theme should define these tokens; charts fall back to the primary colour. `DomChartContainer`, `DomChartLegend`, and `DomChartTooltip` are available for custom Unovis compositions. Unovis dependencies are included with the package; source-copy consumers must also install matching `@unovis/vue` and `@unovis/ts` versions (`1.7.0`).

## UI designer (Beta)

`/designer/frames` demonstrates nested flow, flex, grid and absolute frames plus
Tailwind HTML import. `DomDesignerFrame` renders a native container and owns only
child layout; its placement in a parent remains independent. Pair it with
`DomFrameLayoutEditor` for controlled settings. The demo preserves source classes,
captures immediate child bounds on entry to absolute layout, restores previous
absolute positions on return, and exports plain HTML fragments. Imported HTML is
allowlisted and rendered in a script-disabled iframe; the existing server compiler
generates missing Tailwind utilities. Responsive classes remain active until the
user applies explicit layout overrides. See `/designer/frame` for the contract.

`DomDesignerStage` has an opt-in `frameScoped` prop. Mark containers with
`data-designer-frame` and their layout mode to limit free movement to children of
absolute frames and snapping to their containing frame and siblings. The default
remains the existing stage-wide behaviour used by the poster. Run
`node --test scripts/check-designer-frames.mjs` for nested layout and export checks.

`/designer` groups independent creation-tool controls and working HTML examples.
`DomColorSwatch` and `DomShadowEditor` share the theme editor controls;
`DomDesignerLayers` shares Studio's layer tree and forwards the `DomTreeView` contract.
`DomDesignerStage` accepts normal slot HTML marked with unique `data-designer-id`
values. Bind the selected string ID with `v-model`; opt into `positioning` to
emit `{ id, style }` patches through `style-change`. Apply those patches to your
model. Positionable elements must have a positioned containing block within the
stage; untransformed rectangular layers are supported. Rotated elements and
independently transformed ancestors are outside this beta contract. Selection
overlays are editor-only and are never included in your model.

Enable `snapping` (off by default) for pointer movement and resizing against stage edges/centres
and other visible marked layers. The poster demo exposes a Snap checkbox; hold
Control while moving or resizing to bypass it (on macOS, start dragging before pressing Control). Guides use a 6-screen-pixel acquisition distance
and a 10-pixel release distance, independent of zoom. Eight resize handles snap their moving edges while keeping opposite edges fixed.
Corner handles resize both axes; edge midpoints resize one axis. `DesignerBounds.vue`
owns the overlay, `resizeGeometry.js` owns resize maths, and the stage coordinates gestures.
Keyboard nudges remain precise, unsnapped operations. Padding, gaps and equal spacing are not adjusted.
Targets are measured and sorted once per drag, then queried with binary searches;
pointer updates are coalesced to animation frames. Hidden, off-stage, descendant
and ancestor layers are excluded. Locked visible layers remain alignment targets.
Targets stay fixed during a gesture and are refreshed on the next drag.
Run `node --test scripts/check-designer-snap.mjs` for geometry and large-index checks.

Opt into `spacingSnapping` separately to repeat positive gaps between neighbouring
layers while dragging. `snapPipeline.js` gives edge/centre alignment priority;
`spacingGeometry.js` fills free axes with before/after gap targets. The stage
and moving layer are excluded from the gap index. It snapshots visible layers
once per gesture with O(n log n) construction and O(n) targets. Spacing uses the
same 6px acquisition / 10px release screen distances; Control bypasses both
stages. Gap rulers show document pixels. Resizing, keyboard nudges and padding
are unchanged. This does not distribute layers or prevent overlap. The option
defaults off, including the poster's independent Spacing toggle. See the live,
copyable `/designer/stage#spacing` example and run
`node --test scripts/check-designer-spacing.mjs scripts/check-designer-snap.mjs`.

Use `interactive` to pass clicks through to preview controls. Movement uses pointer
capture; arrow keys on the selection move, Shift steps by 10px and Alt resizes.
Apps own persistence, undo and export. The social-card demo is session-only and
copies HTML. `/designer/canvas` is the full designer (`DomDesigner`), with a
two-way code view that can use Monaco through `DomMonacoCodeView`.

`DomShadowEditor` uses `v-model` with shadow-layer records; use `createShadow()`
for a default record and `shadowListToCss(layers)` for a CSS `box-shadow` value.
It emits independent arrays and `change: { layers, css }`, without mutating props.
These APIs are beta.

The `/designer/poster` example composes these primitives into a portrait flyer
editor with image, text and shape layers, lock/hide and stacking controls,
typography, image filters, fit/percentage zoom, and undo/redo. Both side panels
use `DomSplitterPanel`; Cmd/Ctrl + mouse wheel zooms around the pointer (5–300%).
It edits real HTML
at the original frame dimensions and exports a standalone HTML document.
Uploaded raster images stay in the browser and are embedded in the export;
linked photos still need a network connection. Edits are session-only. Run
`node --test scripts/check-designer.mjs scripts/check-poster.mjs` for model and
export checks.

`/designer/assembly` pairs the demos with assembly documentation and three
working, copyable Vue examples: a linked HTML stage/tree/inspector, composed
appearance controls, and a minimal Vue Flow editor. It explains model ownership,
viewport scaling, source projection, history/export boundaries and Studio's
repository-local modules. Each demo links to its recipe; the guide includes the
actual poster, social-card and flowchart sources.

The isolated `/designer/flowchart` beta uses Vue Flow, the same graph library
as Platform's flow designer, without depending on Platform's workflow runtime.
It provides draggable HTML steps, SVG connections, an unbounded pan area,
wheel/pinch zoom, a minimap, a resizable inspector, and JSON export including
the viewport. Edits are session-only; this example does not execute workflows.

`DomBorderEditor` reuses the CSS button creator border controls with an immutable
`v-model` record: enabled, width (pixels), style and color. `createDesignerBorder()`
creates defaults and `borderToCss()` serializes CSS; `change` emits { border, css }.
See `/designer/border-editor` and `/designer/shadow-editor` for live examples and
style binding. The poster applies these styles inline; layer IDs link selection,
not generated CSS selectors. Border-box sizing preserves each layer's outer size.

`DomBackgroundEditor` and `DomBackdropEditor` share the theme designer controls.
Background records contain enabled fills (solid, linear or radial); use
`createBackgroundState()`, `createFill()` and `backgroundImageToCss()`.
Backdrop records contain enabled, blur (pixels) and saturate (multiplier); use
`createBackdrop()` and `backdropToCss()`. Both emit copied v-model records and
`change` payloads with the record and CSS. Backdrop filters need a translucent
surface to reveal the content behind it. The poster exposes both on text and
shape layers and includes their CSS in HTML exports. See `/designer/background-editor`
and `/designer/backdrop-editor` for interactive examples and API guidance.
