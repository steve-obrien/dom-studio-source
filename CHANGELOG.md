# Changelog

## 0.2.6 - 2026-10-10

### Fixed

- The date and time picker scrolls its selected time option into view when the
  popover opens, including after the selected time changes between openings.
  Scrolling stays within the time list and preserves calendar keyboard focus.

## 0.2.5 - 2026-10-08

### Added

- Data grids support `layout="flush"` with application-owned `gutter-class`
  padding, including responsive utilities and CSS variable values. Toolbar,
  footer and outer header/body cell edges align while middle cells retain their
  spacing. Works with ordinary and virtual rows.
- A copyable full-width article library example documents the layout contract.

### Upgrade notes

- Existing grids keep their card layout. Applications own the surrounding width
  and negative margins; flush removes side borders, corner rounding and shadow.

## 0.2.4 - 2026-10-08

Reliable chart hover values and optional sparkline tooltips.

### Added

- Opt-in sparkline tooltips with `tooltip`, showing the inspected label and
  formatted series values on hover or keyboard navigation. The floating panel
  stays outside the compact plot and escapes scrolling-table clipping.
- Website privacy policy and terms pages, linked from checkout and the footer.

### Improved

- Documentation explains how component source, runnable examples and reference
  pages live together, and how that structure supports human and AI development.

### Fixed

- Line and area chart tooltips update as the pointer moves between data points,
  without requiring a click. Clicking preserves and selects the hovered record.
- Shared chart bindings forward Unovis configuration using its expected names,
  including crosshair callbacks and stacked-series inspection.
- Chart values dismiss when the crosshair leaves the plot.
- Website licence checkout no longer depends on email delivery being configured.
  Existing installations receive a repair migration for missing licence columns.

### Upgrade notes

- Sparkline tooltips remain off by default. Add `tooltip` to `DomSparkline` to
  enable them; existing value and label formatters also apply to the tooltip.
- Email-based licence claiming and recovery still require a configured sender.

## 0.2.3 - 2026-09-27

Searchable Google Fonts previews, shared paginated option lists, and more reliable
selection controls.

### Added

- `DomFontPicker` with searchable family previews, incremental browsing and a
  lightweight snapshot of 1,946 Google Fonts families. Font files are not bundled;
  the mounted picker requests only selected and visible preview families, with
  text subsetting and component-owned stylesheet cleanup.
- Multiple selection in `DomSelect`, with an array model, checked options and a
  clear-all action. Selected labels are retained when searches replace remote pages.
- Shared incremental loading for Select, Combobox, Autocomplete and Tag combobox,
  using `hasMore` and `load-more` for scroll, keyboard and explicit-button paging.
  Documentation includes real HTTP examples with retry and stale-request handling.
- Query and selected-state slot data for custom option rendering, plus a matched-text
  highlighting example that keeps HTML-like labels as plain text.

### Improved

- Opening a picker shows the loaded choices without treating its committed value
  as a permanent search filter. Selected checkmarks remain distinct from keyboard
  navigation, and loaded single selections open in context.
- Select and Tag combobox documentation explains compact multi-selection versus
  removable tokens, optional custom entries and paste support, alongside their
  shared option, field-state and paging foundations.
- Public TypeScript declarations cover the font picker, multiple selection,
  retained selected records and paginated option lists.

### Fixed

- Dropdowns reopen reliably while an earlier close animation finishes, and late
  option updates no longer reopen a dismissed combobox or autocomplete.
- Selected options remain visible and checked in combobox and tag suggestions.
  Disabled and read-only controls do not commit selections through their action buttons.
- Select keeps its arrow at the right edge and centers the clear button to its
  left. Long selections truncate within narrow containers, and clearing returns
  keyboard focus to the trigger.

### Upgrade notes

- Single-select models remain scalar values. Use an array model when enabling
  `multiple`; Tag combobox continues to use an array of selected values.
- For server-filtered lists, set `filterOptions` to false and handle `query` and
  `load-more` in the application. Supply `selectedOptions` for initial selected
  records outside the loaded page. Seeking directly to a later remote page remains
  application-owned; controls do not fetch or paginate an endpoint themselves.
- Google Fonts previews need no API key. Applications own loading the selected
  font for content outside the picker. A live Developer API catalogue should be
  fetched and cached server-side or at build time, with its key kept out of client code.

## 0.2.2 - 2026-09-26

More flexible calendar highlights, refined agent chat, and updated website
licensing flows.

### Added

- `DomMonthCalendar` now accepts `todayIndicator="both"` to show the cell outline
  and date circle together. `todayDateClass` customises the circle in either
  `circle` or `both` mode, with matching TypeScript declarations and an interactive
  example.
- Website support for account-optional licence checkout, downloadable purchase
  confirmations, and email-verified licence claiming. Checkout requires configured
  transactional email delivery.

### Improved

- Agent chat uses a shared centred width for messages and the composer, compact
  conversation rows with avatars and unread counts, expandable tool details,
  and clearer loading, empty, streaming, and agent-context displays.
- Default control backgrounds use the canvas colour. The command palette has
  updated translucency and theme-aware shadows.
- The homepage includes interactive workspace, agent-chat, analytics, and designer
  demos. Website pricing and checkout use consistent USD licence offers.

### Fixed

- Calendar date numbers keep consistent spacing across all today-indicator modes,
  and week numbers align with dates in the desktop grid.
- Website checkout validates the configured price and licence before redirecting
  to payment. Delayed payment handling and repeat webhook processing preserve
  the recorded licence and its fulfilment state.

### Upgrade notes

- Existing calendar indicator values remain supported; `cell` is still the default.
- `DomAgentConversation.maxMessageWidth` now controls the centred message column
  and composer together. Review custom conversation layouts after upgrading.
- Applications that supply their own theme can set `--skin-control-bg` to retain
  a different control background.

## 0.2.1 - 2026-09-21

Vue Router 5 support and a public home for DOM Studio release notes.

### Added

- A release history at `/releases`, with publication dates, version links and
  upgrade notes. Published GitHub Releases supply the notes through the server.
- A release preparation command and tag-triggered publishing workflow that checks
  the package, verifies npm publication, then creates matching GitHub Release notes.

### Improved

- Added Vue Router 5 support while retaining compatibility with Vue Router 4.
- Updated the development and package-smoke toolchains to validate the current
  Vue, Pinia, Vite, and Vue Router release line.

### Upgrade notes

- Vue must be version 3.5.34 or newer within Vue 3. Vue Router 4 remains supported.
- When using Vue Router 5.3 with Pinia, use Pinia 3.0.4 or newer within Pinia 3.
  Vue Router 5.3 also requires Vite 7.3 or 8 when Vite is installed.

## 0.2.0 - 2026-09-20

This release expands DOM Studio from its initial public package with new
application UI, reporting, media, mobile, and visual-design surfaces.

### Added

- `DomNotificationInbox` for durable, application-owned in-app notifications,
  plus `notificationTone()` and `notificationToast()` presentation helpers.
- A reporting chart family with line, area, bar, donut, sparkline, metric-card,
  date-range, legend, tooltip, and container components powered by Unovis.
- `DomGantt` for project schedules and resource planning, including keyboard and
  pointer movement, resizing, row changes, zoom levels, and working-time views.
- Audio and camera input components, audio visualisation, and a vertical video
  feed with captions and controlled playback.
- Mobile application primitives for bottom sheets, swipe actions, profile
  headers, nested stacks, keyboard-aware shells, and contained action sheets.
- `DomMenuStack` for bounded nested navigation inside popovers and other app
  surfaces.
- Responsive dialog companion panels for assistant and reference workflows.
- Beta visual designer components for frames, stages, layers, backgrounds,
  borders, shadows, snapping, spacing, and layout controls.

### Improved

- Expanded generated TypeScript declarations and public Vue exports for the new
  components, props, events, helpers, and data contracts.
- Refined touch gestures, mobile safe-area and keyboard behaviour, popovers,
  drawers, dialogs, form controls, themes, documentation, and agent guidance.
