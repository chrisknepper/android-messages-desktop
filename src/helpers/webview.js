// This script is injected into the webview.
// Newer ES6 features (import/export syntax etc...) are not allowed here nor in any JS which this imports.

const popupContextMenu = require('./context_menu.js');

// Electron (or the build of Chromium it uses?) does not seem to have any default right-click menu, this adds our own.
window.addEventListener('contextmenu', popupContextMenu);
