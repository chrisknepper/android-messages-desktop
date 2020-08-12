import {
  ipcRenderer,
  remote,
  NativeImage,
  NotificationConstructorOptions,
} from "electron";
import path from "path";
import { CacheManager } from "./helpers/cacheManager";
import {
  EVENT_BRIDGE_INIT,
  EVENT_REFLECT_DISK_CACHE,
  EVENT_UPDATE_USER_SETTING,
  SETTING_HIDE_NOTIFICATION,
  RESOURCES_PATH,
  SETTING_NOTIFICATION_SOUND,
} from "./helpers/constants";
import { handleEnterPrefToggle } from "./helpers/inputManager";
import { popupContextMenu } from "./menu/contextMenu";
import settings from "electron-settings";

const { Notification: ElectronNotification, app, nativeImage } = remote;

// Electron (or the build of Chromium it uses?) does not seem to have any default right-click menu, this adds our own.
remote.getCurrentWebContents().addListener("context-menu", popupContextMenu);

let cacheManager: CacheManager | undefined;

window.addEventListener("load", () => {
  // Conditionally let the main process know the page is (essentially) done loading.
  // This should defer spellchecker downloading in a way that avoids blocking the page UI :D

  // Without observing the DOM, we don't have a reliable way to let the main process know once
  // (and only once) that the main part of the app (not the QR code screen) has loaded, which is
  // when we need to init the spellchecker
  const onMutation = (
    _mutationsList: MutationRecord[],
    observer: MutationObserver
  ) => {
    if (document.querySelector("mw-main-nav")) {
      // we're definitely logged-in if this is in the DOM
      ipcRenderer.send(EVENT_BRIDGE_INIT);
      observer.disconnect();
    }
    // In the future we could detect the "you've been signed in elsewhere" modal and notify the user here
  };

  const observer = new MutationObserver(onMutation);
  observer.observe(document.body, {
    childList: true,
    attributes: true,
  });
});

ipcRenderer.on(EVENT_UPDATE_USER_SETTING, (_event, settingsList) => {
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

/**
 *
 * Recieves the paths for all the disk cahed images along with the base path for adding new files to the cache
 * This is because this part of electron cannot use path.resolve and the constant relies on that in a function form due to
 * reasons documented elsewhere
 *
 */
ipcRenderer.once(
  EVENT_REFLECT_DISK_CACHE,
  (
    _event,
    { cache, basePath }: { basePath: string; cache: Record<string, string> }
  ): void => {
    cacheManager = new CacheManager(basePath, new Map(Object.entries(cache)));
  }
);

/**
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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.Notification = function (title: string, options: NotificationOptions) {
  let icon: NativeImage | undefined;
  if (cacheManager != null) {
    const potentialImg = cacheManager.getProfileImg(title);
    if (potentialImg != null) {
      if (typeof potentialImg === "string") {
        icon = nativeImage.createFromDataURL(potentialImg);
      } else {
        potentialImg();
      }
    }
  }

  const hideContent = settings.get(SETTING_HIDE_NOTIFICATION, false) as boolean;

  const notificationOpts: NotificationConstructorOptions = hideContent
    ? {
        title: "New Message",
        body: "Click to open",
        icon: path.resolve(RESOURCES_PATH, "icons", "64x64.png"),
      }
    : {
        title,
        icon,
        body: options.body || "",
      };

  notificationOpts.silent = settings.get(
    SETTING_NOTIFICATION_SOUND,
    true
  ) as boolean;

  const notification = new ElectronNotification(notificationOpts);
  notification.addListener("click", () => {
    app.mainWindow?.show();
    document.dispatchEvent(new Event("focus"));
  });
  // Mock the api for adding event listeners for a normal Browser notification
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  notification.addEventListener = notification.addListener;
  notification.show();
  if (!app.mainWindow?.isFocused()) {
    app.mainWindow?.flashFrame(true);
  }
  return notification;
};
// THIS IS NEEDED FOR GOOGLE TO ISSUE NOTIFICATIONS
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
Notification.permission = "granted";
Notification.requestPermission = async () => "granted";
