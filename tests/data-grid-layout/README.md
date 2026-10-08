# Data grid layout browser checks

Start the repository Vite server, then open `/tests/data-grid-layout/` in a
dedicated testing session. Run `check.js` with Playwright CLI:

```sh
npx @playwright/cli -s=dom-grid-layout open http://localhost:8117/tests/data-grid-layout/
npx @playwright/cli -s=dom-grid-layout run-code --filename tests/data-grid-layout/check.js
npx @playwright/cli -s=dom-grid-layout close
```

The assertions measure actual computed padding and alignment at 375px and
1280px. They cover responsive classes, a consumer CSS variable, ordinary and
virtual rows, auxiliary columns, single-column, empty/loading and overflowing
grids, default card compatibility, sorting and horizontal scrolling. Close the
testing browser and stop the server after the checks, including on failure.
