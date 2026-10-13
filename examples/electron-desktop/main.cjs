const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');

const previewUrl = 'http://localhost:8110/blocks/app-shells/desktop-workspace/preview/DesktopWorkspace';
app.setPath('userData', path.join(app.getPath('appData'), 'DOM Studio Desktop Demo'));

/** Reject document navigation outside this local example, including redirect attempts. */
function guardNavigation(event, url) {
	if (url !== previewUrl) event.preventDefault();
}
/** Deny renderer-created windows; apps should route within the existing stage. */
function denyWindow() {
	return { action: 'deny' };
}
/** Deny device and other permissions because this layout preview needs none. */
function denyPermission(_contents, _permission, callback) {
	callback(false);
}
/** Reject synchronous permission checks for the isolated preview session. */
function denyPermissionCheck() {
	return false;
}
/** Prevent downloads from escaping this development-only example. */
function denyDownload(event) {
	event.preventDefault();
}
/** Create the native demo window using the shared web frontend and an ephemeral session. */
async function createWindow() {
	const previewSession = session.fromPartition('dom-studio-desktop-demo');
	previewSession.setPermissionRequestHandler(denyPermission);
	previewSession.setPermissionCheckHandler(denyPermissionCheck);
	previewSession.removeListener('will-download', denyDownload);
	previewSession.on('will-download', denyDownload);
	const window = new BrowserWindow({
		title: 'DOM Studio · Desktop workspace',
		width: 1280,
		height: 860,
		minWidth: 380,
		minHeight: 500,
		webPreferences: {
			session: previewSession,
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
			navigateOnDragDrop: false,
		},
	});
	window.webContents.setWindowOpenHandler(denyWindow);
	window.webContents.on('will-navigate', guardNavigation);
	window.webContents.on('will-redirect', guardNavigation);
	try {
		await window.loadURL(previewUrl);
	} catch (error) {
		console.error('Start npm run dev:screenshot in the repository before opening the desktop demo.', error.message);
		app.quit();
	}
}
/** Open a new window when macOS activates the app after its last window closes. */
function activate() {
	if (BrowserWindow.getAllWindows().length === 0) void createWindow();
}
/** End the application when its windows close on platforms without a persistent dock. */
function allWindowsClosed() {
	if (process.platform !== 'darwin') app.quit();
}
app.whenReady().then(createWindow);
app.on('activate', activate);
app.on('window-all-closed', allWindowsClosed);
