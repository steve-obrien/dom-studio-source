# Changelog

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
