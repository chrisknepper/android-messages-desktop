// This script is injected into the webview.

import { popupContextMenu } from "./context_menu";
import {
  EVENT_WEBVIEW_NOTIFICATION,
  EVENT_NOTIFICATION_REFLECT_READY,
  EVENT_BRIDGE_INIT,
  EVENT_SPELLING_REFLECT_READY,
  EVENT_UPDATE_USER_SETTING,
} from "../../constants";
import { ipcRenderer, remote } from "electron";
import { handleEnterPrefToggle } from "./input_manager";
import fs from "fs";
import {
  SpellCheckerProvider,
  attachSpellCheckProvider,
} from "electron-hunspell";

// Electron (or the build of Chromium it uses?) does not seem to have any default right-click menu, this adds our own.
remote.getCurrentWebContents().addListener("context-menu", popupContextMenu);

window.onload = () => {
  // Conditionally let the main process know the page is (essentially) done loading.
  // This should defer spellchecker downloading in a way that avoids blocking the page UI :D

  // Without observing the DOM, we don't have a reliable way to let the main process know once
  // (and only once) that the main part of the app (not the QR code screen) has loaded, which is
  // when we need to init the spellchecker
  const onMutation = (
    mutationsList: MutationRecord[],
    observer: MutationObserver
  ) => {
    if (document.querySelector("mw-main-nav")) {
      // we're definitely logged-in if this is in the DOM
      ipcRenderer.send(EVENT_BRIDGE_INIT);
      observer.disconnect();
    }
    //   // In the future we could detect the "you've been signed in elsewhere" modal and notify the user here
  };

  const observer = new MutationObserver(onMutation);
  // There is always a body so TS is being dumb
  observer.observe((document.querySelector("body") as unknown) as HTMLElement, {
    childList: true,
    attributes: true,
  });
};

// The main process, once receiving EVENT_BRIDGE_INIT, determines whether the user's current language allows for spellchecking
// and if so, (down)loads the necessary files, then sends an event to which the following listener responds and
// loads the spellchecker, if needed.
ipcRenderer.once(
  EVENT_SPELLING_REFLECT_READY,
  async (event, { dictionaryLocaleKey, spellCheckFiles, customWords }) => {
    if (
      dictionaryLocaleKey &&
      spellCheckFiles &&
      spellCheckFiles.userLanguageAffFile &&
      spellCheckFiles.userLanguageDicFile
    ) {
      const provider = new SpellCheckerProvider();
      window.spellCheckHandler = provider;
      await provider.initialize({}); // Empty brace correct, see: https://github.com/kwonoj/electron-hunspell/blob/master/example/browserWindow.ts

      await provider.loadDictionary(
        dictionaryLocaleKey,
        fs.readFileSync(spellCheckFiles.userLanguageDicFile),
        fs.readFileSync(spellCheckFiles.userLanguageAffFile)
      );

      const attached = await attachSpellCheckProvider(provider);
      attached.switchLanguage(dictionaryLocaleKey);

      if (dictionaryLocaleKey in customWords) {
        for (
          let i = 0, n = customWords[dictionaryLocaleKey].length;
          i < n;
          i++
        ) {
          const word = customWords[dictionaryLocaleKey][i];
          window.spellCheckHandler.addWord(dictionaryLocaleKey, word);
        }
      }
    }
  }
);

ipcRenderer.on(EVENT_UPDATE_USER_SETTING, (event, settingsList) => {
  if ("useDarkMode" in settingsList && settingsList.useDarkMode !== null) {
    if (settingsList.useDarkMode) {
      // Props to Google for making the web app use dark mode entirely based on this class
      // and for making the class name semantic!
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }
  if ("enterToSend" in settingsList) {
    handleEnterPrefToggle(settingsList.enterToSend);
  }
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
// It hurts but this is so antipattern I am telling the ts compiler to screw itself
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
Notification = function (title: string, options?: NotificationOptions) {
  const notificationToSend = new OriginalBrowserNotification(title, options); // Still send the webview notification event so the rest of this code runs (and the ipc event fires)

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

  type Type = "click" | "close" | "error" | "show";
  type Listener = (ev: NotificationEventMap[Type]) => unknown;
  type Options = undefined | boolean | AddEventListenerOptions;
  let originalClickListener: Listener | null = null;

  const originalAddEventListener = notificationToSend.addEventListener;
  // Seems silly to have these be correct as there is no way to mess it up
  notificationToSend.addEventListener = (
    type: Type,
    listener: Listener,
    options?: Options
  ) => {
    if (type === "click") {
      originalClickListener = listener;
    } else {
      // Let all other event listeners be called, though they shouldn't have any effect
      // because the original notification is blocked in the renderer process.
      originalAddEventListener.call(
        notificationToSend,
        type,
        listener,
        options
      );
    }
  };

  ipcRenderer.once(EVENT_NOTIFICATION_REFLECT_READY, () => {
    const theHookedUpNotification = remote.getGlobal("currentNotification");
    if (
      typeof theHookedUpNotification === "object" &&
      typeof originalClickListener === "function"
    ) {
      theHookedUpNotification.once("click", originalClickListener);
    }
  });

  ipcRenderer.send(EVENT_WEBVIEW_NOTIFICATION, {
    title,
    options,
  });

  return notificationToSend;
};
Notification.prototype = OriginalBrowserNotification.prototype;
// It hurts but this is so antipattern I am telling the ts compiler to screw itself
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
Notification.permission = OriginalBrowserNotification.permission;
Notification.requestPermission = OriginalBrowserNotification.requestPermission;
