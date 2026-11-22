# Licence button click reporting

DOM Studio records anonymous, first-party counts for both signed-out and
signed-in **Get a licence** buttons, including the compact **Get** variant.
The existing checkout URL carries a fixed source and layout tag. The server
records an eligible navigation and continues to the same Stripe checkout.
Other checkout links and the account menu's **Get a production licence** action are
not included in this metric. A click is counted even if checkout subsequently
fails; it is not evidence of a purchase or a unique person.

## Enable recording

Run `npm run db:migrate` against the intended database, then deploy the client
and server changes together. Production enables recording by default.
`ACCESS_CLICK_TRACKING=0` disables it. Development and preview test environments
should set this to `0`; development is disabled by default, and an isolated
test database can opt in with `ACCESS_CLICK_TRACKING=1`.

The migration creates `access_click_daily`. Counters survive process restarts
and combine atomically across server workers. They start at deployment; earlier
clicks cannot be reconstructed. Deploying only the migration or only the server
does not instrument older, untagged buttons.

Production deployment remains separate from this development repository; a
local commit or source push does not start collection on getdom.studio.

## Read the private report

Run these commands on the application server, or with a securely configured
connection to its database. There is no public reporting HTTP endpoint.

```sh
npm run report:access-clicks
npm run report:access-clicks -- --days 7
npm run report:access-clicks -- --from 2026-11-01 --to 2026-11-30
npm run --silent report:access-clicks -- --days 30 --format csv > access-clicks.csv
npm run --silent report:access-clicks -- --days 30 --format json
```

The default window is 30 inclusive UTC days, including today. A report can
cover up to 366 days. Text and JSON include the total, a daily series with
quiet days filled as zero, and breakdowns by button layout, page section,
device, browser and navigation signal. CSV contains the underlying daily
aggregate rows. Empty results mean no recorded clicks, not proof of no visitors;
check deployment, configuration and operational logs before interpreting zeros.
A missing migration or database failure returns an error, not a zero report.

## What is stored

Only the UTC day, `standard`/`compact` button layout, allowlisted top-level
page section, coarse device and browser family, navigation signal and count.
No raw IP address, raw user agent, cookie, account identifier, full URL,
query string, hash, exact event timestamp or persistent visitor ID is stored.
Private/unrecognised page paths are grouped under `other`; unavailable
referrers are `unknown`. Device/browser classification is approximate; for
example, an iPad using a desktop user agent can appear as a desktop.

The counter adds no browser storage, third-party request, or tracking script.
It is separate from optional Google Analytics. DNT and Global Privacy Control
request headers disable this counter for that request. Existing web server
and infrastructure logs have their own configuration; this feature does not
change their retention or contents. Anonymous aggregates are retained until
the operator deletes them.

## Filtering and reliability

- Accept only tagged GET navigations from the configured site. Requests with
	cross-site metadata/referrers, non-document destinations or fetch/XHR modes
	are excluded. The trusted origin uses `BILLING_PUBLIC_URL` (with both official
	getdom.studio hostnames allowed for the official deployment).
- Exclude known bot/headless/tool user agents and prefetch/prerender headers.
- `user-activated` means the browser supplied `Sec-Fetch-User: ?1`.
	`navigation` is the fallback for browsers without that signal, using the
	other navigation headers or a same-site referrer. Keep this distinction
	when assessing the quality of the count. [Fetch Metadata documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-User)
	describes the signal and its browser limitations.
- Debounce clicks from one network address for two seconds and accept at most
	ten per minute per worker. A randomly keyed digest exists only in server
	memory for up to one minute; neither it nor the address reaches the database.
	The map is bounded to 10,000 addresses. This is abuse protection, not visitor
	tracking or a unique-visitor estimate. Shared networks may be undercounted;
	limits reset on restart and are independent across workers.
- Forwarded addresses are trusted only through `BILLING_TRUST_PROXY_IPS`,
	using the existing checkout security helper. Configure exact controlled
	proxy addresses; otherwise proxied visitors share the proxy's rate limit.
- Recording uses a separate two-connection pool and at most four pending
	writes. Database acquisition/query timeouts and a one-minute error backoff
	protect checkout. Recording runs without waiting in the checkout handler;
	failed, overloaded or interrupted writes can lose clicks. There is no
	client retry or durable event queue, and no false success log.

Headers can be forged and browser automation can resemble a human. The report
is a useful filtered indication of interest, not a bot-free audited count.
Page sections describe where the button was clicked; no external acquisition
source, location or conversion rate is inferred from them.

## Verification

```sh
npm run check:access-clicks
# Creates and drops a dedicated temporary database; refuses non-local MySQL.
ACCESS_CLICKS_TEST_MYSQL=1 npm run check:access-clicks
node --test server/lib/billingCheckout.test.js
npm run build
```
