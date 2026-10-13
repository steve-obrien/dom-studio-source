# Desktop workspace in Electron

This isolated development host runs the same Vue layout as the website. It does
not add Electron dependencies to the UI package or expose Node APIs to Vue.

From the repository root:

```sh
npm run dev:screenshot
# In another terminal:
npm install --prefix examples/electron-desktop
npm start --prefix examples/electron-desktop
```

The window loads only the local desktop preview on port 8110. Native window
controls remain platform-owned. BrowserWindow uses sandboxing, context isolation,
and no Node integration or preload bridge. Its session is ephemeral; its profile
is separate from normal browsers. Permissions, downloads, new windows, and
navigation outside the exact preview URL are denied. See the official
[Electron security guide](https://www.electronjs.org/docs/latest/tutorial/security).

The local preview has mock app installation and conversations. Its state lasts
until reload; there is no provider connection, real plugin loading, or disk
persistence. The server must be running, and a load failure exits with a helpful
terminal message. To stop, quit Electron with Cmd+Q (macOS) or close the window
(other platforms), then stop the server with Ctrl+C.

For a distributed app, supply bundled frontend assets, a packaged-app protocol,
reviewed native capabilities, code signing, and an update strategy. This example
is intentionally a local host, not a packaged release.
