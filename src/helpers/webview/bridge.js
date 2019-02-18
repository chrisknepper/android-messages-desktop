// This script is injected into the webview.

import { popupContextMenu } from './context_menu';
import { EVENT_WEBVIEW_NOTIFICATION, EVENT_NOTIFICATION_REFLECT_READY, EVENT_BRIDGE_INIT, EVENT_SPELLING_REFLECT_READY, EVENT_UPDATE_USER_SETTING } from '../../constants';
import { ipcRenderer, remote } from 'electron';
import InputManager from './input_manager';
import { ENVIRONMENT } from 'hunspell-asm';
import { SpellCheckerProvider } from 'electron-hunspell';


// Electron (or the build of Chromium it uses?) does not seem to have any default right-click menu, this adds our own.
remote.getCurrentWebContents().addListener('context-menu', popupContextMenu);

window.onload = () => {
    InputManager.setupLinksListener();
    // Let the main process know the page is (essentially) done loading.
    // This should defer spellchecker downloading in a way that avoids blocking the page UI :D
    ipcRenderer.send(EVENT_BRIDGE_INIT);
}

// The main process, once receiving EVENT_BRIDGE_INIT, determines whether the user's current language allows for spellchecking
// and if so, (down)loads the necessary files, then sends an event to which the following listener responds and
// loads the spellchecker, if needed.
ipcRenderer.once(EVENT_SPELLING_REFLECT_READY, async (event, { dictionaryLocaleKey, spellCheckFiles, customWords }) => {
    if (dictionaryLocaleKey && spellCheckFiles.userLanguageAffFile && spellCheckFiles.userLanguageDicFile) {
        const provider = new SpellCheckerProvider();
        window.spellCheckHandler = provider;
        await provider.initialize({ environment: ENVIRONMENT.NODE });
        await window.spellCheckHandler.loadDictionary(dictionaryLocaleKey, spellCheckFiles.userLanguageDicFile,spellCheckFiles.userLanguageAffFile);
        window.spellCheckHandler.switchDictionary(dictionaryLocaleKey);
        if (window.spellCheckHandler.selectedDictionary in customWords) {
            for (let i = 0, n = customWords[window.spellCheckHandler.selectedDictionary].length; i < n; i++) {
                const word = customWords[window.spellCheckHandler.selectedDictionary][i];
                window.spellCheckHandler.spellCheckerTable[window.spellCheckHandler.selectedDictionary].spellChecker.addWord(word);
            }
        }
    }
});

ipcRenderer.on(EVENT_UPDATE_USER_SETTING, (event, { enterToSend }) => {
    InputManager.handleEnterPrefToggle(enterToSend);
});

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
