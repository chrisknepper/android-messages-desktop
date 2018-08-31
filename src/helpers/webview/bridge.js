// This script is injected into the webview.
// Newer ES6 features (import/export syntax etc...) are not allowed here nor in any JS which this imports.

const popupContextMenu = require('./context_menu.js');
const { EVENT_WEBVIEW_NOTIFICATION, EVENT_NOTIFICATION_REFLECT_READY } = require('../../constants');
const { ipcRenderer, remote } = require('electron')

// Electron (or the build of Chromium it uses?) does not seem to have any default right-click menu, this adds our own.
window.addEventListener('contextmenu', popupContextMenu);

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
