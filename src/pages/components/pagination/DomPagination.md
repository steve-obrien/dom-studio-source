# Pagination

`DomPagination` keeps page selection controlled by the application. Bind
`v-model:page`, provide `total` and `pageSize`, and fetch records when the page
changes. If the API supplies a page count directly, use `pageCount` instead.

## Large datasets

Use `variant="input"` for database tables and other views with hundreds or
thousands of pages. It shows an editable **Page X of Y** field with Go and
previous/next controls. First/last controls also appear on larger screens;
`compact` hides them at every size.

Typing and leaving the field do not navigate. Press **Enter** or choose **Go**
to commit a whole number between 1 and the page count. Invalid entries show an
error without requesting data. **Escape** restores the current page.

The field shares the number input's drag handle, focused mouse-wheel adjustment
and arrow-key stepping. These adjust the draft only; Enter or Go still commits
the page. Hold Shift to adjust ten pages at a time. Mouse adjustments stop at the
first and last page, while invalid typed values retain the validation above.

<!-- example: LargeDataset -->

## Numbered pages

The default `variant="pages"` shows the current page, its neighbours and the
first/last page numbers. `siblingCount` and `boundaryCount` control that window.
Each ellipsis opens a small **Go to page** popover instead of listing every
omitted page. Both ellipses accept any page in the dataset.

You can also **drag the dots horizontally**. The dots preview a number within
their omitted range; releasing the mouse navigates to that page once. Dragging
left decreases and right increases; Shift speeds up by ten. Escape cancels.
The left gap starts at its nearest page before the current selection, and the
right gap starts at its nearest page after it. A simple click still opens the
popover. Touch gestures keep their normal scrolling behavior.

Opening the popover focuses and selects the page number. Escape dismisses it
and restores trigger focus; a successful jump focuses the current page button.
The popover stays within the viewport. On narrow containers, the numbered strip
can scroll horizontally; use the input variant for a more compact footer.

<!-- example: ResourcePages -->

## Application ownership

The component emits `update:page` and `page-change` only for a different valid
page. It does not fetch data. Use `disabled` while navigation is unavailable.
The `page-change` payload contains `page`, `previousPage` and `pageCount`.

Keep the rows-per-page selector in the application. When filters, page size or
the dataset change, update the controlled page as appropriate, usually to 1.
The component bounds its displayed page to the available range without emitting
an unsolicited request; the application must reconcile its own query state.

`compact` retains its existing meaning: hide first/last arrow buttons. It does
not select the input variant. `activeStyle` applies to numbered page buttons.
