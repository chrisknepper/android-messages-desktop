// This script is injected into the webview.
// Newer ES6 features (import/export syntax etc...) are not allowed here nor in any JS which this imports.

//const popupContextMenu = require('./context_menu.js');
const { EVENT_WEBVIEW_NOTIFICATION, EVENT_NOTIFICATION_REFLECT_READY } = require('../../constants');
const { ipcRenderer, remote } = require('electron')

var webFrame = require('electron').webFrame;
var SpellCheckProvider = require('electron-spell-check-provider');
// `remote.require` since `Menu` is a main-process module.
var buildEditorContextMenu = remote.require('electron-editor-context-menu');

var selection;
function resetSelection() {
    selection = {
        isMisspelled: false,
        spellingSuggestions: []
    };
}
resetSelection();

// Reset the selection when clicking around, before the spell-checker runs and the context menu shows.
window.addEventListener('mousedown', resetSelection);

// The spell-checker runs when the user clicks on text and before the 'contextmenu' event fires.
// Thus, we may retrieve spell-checking suggestions to put in the menu just before it shows.
webFrame.setSpellCheckProvider(
    'en-US',
    // Not sure what this parameter (`autoCorrectWord`) does: https://github.com/atom/electron/issues/4371
    // The documentation for `webFrame.setSpellCheckProvider` passes `true` so we do too.
    true,
    new SpellCheckProvider('en-US').on('misspelling', function (suggestions) {
        // Prime the context menu with spelling suggestions _if_ the user has selected text. Electron
        // may sometimes re-run the spell-check provider for an outdated selection e.g. if the user
        // right-clicks some misspelled text and then an image.
        if (window.getSelection().toString()) {
            selection.isMisspelled = true;
            // Take the first three suggestions if any.
            selection.spellingSuggestions = suggestions.slice(0, 3);
        }
    }));

window.addEventListener('contextmenu', function (e) {
    // Only show the context menu in text editors.
    if (!e.target.closest('textarea, input, [contenteditable="true"]')) return;

    console.log('we got a thing boss', selection);
    var menu = buildEditorContextMenu(selection);

    // The 'contextmenu' event is emitted after 'selectionchange' has fired but possibly before the
    // visible selection has changed. Try to wait to show the menu until after that, otherwise the
    // visible selection will update after the menu dismisses and look weird.
    setTimeout(function () {
        menu.popup(remote.getCurrentWindow());
    }, 30);
});

// Electron (or the build of Chromium it uses?) does not seem to have any default right-click menu, this adds our own.
//window.addEventListener('contextmenu', popupContextMenu);

const OriginalBrowserNotification = Notification;

/*
 * Override the webview's window's instance of the Notification class and forward their data to the
 * main process. This is Necessary to generate and send a custom notification via Electron instead
 * of just forwarding the webview (Google) ones.
 *
 * Derived from:
 * https://github.com/electron/electron/blob/master/docs/api/ipc-main.md#sending-messages
 * https://stackoverflow.com/questions/2891096/addeventlistener-using-apply
 * https://stackoverflow.com/questions/31231622/event-listener-for-web-notification
 * https://stackoverflow.com/questions/1421257/intercept-javascript-event
 */
Notification = function (title, options) {
    let notificationToSend = new OriginalBrowserNotification(title, options); // Still send the webview notification event so the rest of this code runs (and the ipc event fires)

    /*
     * Google's own notifications have a click event listener which takes care of highlighting
     * the conversation a notification belongs to, but this click listener does not carry over
     * when we block Google's and create our own Electron notification.
     *
     * What I would like to do here is just pass the listener function over IPC and call it in
     * the main process.
     *
     * However, Electron does not support sending functions or otherwise non-JSON data across IPC.
     * To solve this and be able to have both our click event listener (so we can show the app
     * window) and Google's (so the converstaion gets selected/highlighted), when the main process
     * asyncronously receives the notification data, it asyncronously sends a message back at which
     * time we can reliably get a reference to the Electron notification and attach Google's click
     * event listener.
     */
    let originalClickListener = null;

    const originalAddEventListener = notificationToSend.addEventListener;
    notificationToSend.addEventListener = function (type, listener, options) {
        if (type === 'click') {
            originalClickListener = listener;
        } else {
            // Let all other event listeners be called, though they shouldn't have any effect
            // because the original notification is blocked in the renderer process.
            originalAddEventListener.call(notificationToSend, type, listener, options);
        }
    }

    ipcRenderer.once(EVENT_NOTIFICATION_REFLECT_READY, (event, arg) => {
        let theHookedUpNotification = remote.getGlobal('currentNotification');
        if (typeof theHookedUpNotification === 'object' && typeof originalClickListener === 'function') {
            theHookedUpNotification.once('click', originalClickListener);
        }
    });

    ipcRenderer.send(EVENT_WEBVIEW_NOTIFICATION, {
        title,
        options
    });

    return notificationToSend;
};
Notification.prototype = OriginalBrowserNotification.prototype;
Notification.permission = OriginalBrowserNotification.permission;
Notification.requestPermission = OriginalBrowserNotification.requestPermission;
