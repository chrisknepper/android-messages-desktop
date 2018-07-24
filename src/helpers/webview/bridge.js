// This script is injected into the webview.
// Newer ES6 features (import/export syntax etc...) are not allowed here nor in any JS which this imports.

const popupContextMenu = require('./context_menu.js');
const { EVENT_WEBVIEW_NOTIFICATION, EVENT_NOTIFICATION_REFLECT_READY } = require('../../constants');
const { ipcRenderer, remote } = require('electron')

// Electron (or the build of Chromium it uses?) does not seem to have any default right-click menu, this adds our own.
window.addEventListener('contextmenu', popupContextMenu);

const OriginalBrowserNotification = Notification;

// Override the webview's window's instance of the Notification class and forward them to the main process
// Necessary to generate and send a custom notification via Electron instead of just forwarding the webview one.
Notification = function (title, options) {
    let notificationToSend = new OriginalBrowserNotification(title, options); // Still send the webview notification event so the ipc event fires

    let originalClickListener = null;

    const originalAddEventListener = notificationToSend.addEventListener;
    notificationToSend.addEventListener = function (type, listener, options) {
        if (type === 'click') {
            originalClickListener = listener;
        } else {
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
