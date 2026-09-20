# Changelog

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
