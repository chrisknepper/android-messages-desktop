import { remote, NotificationConstructorOptions } from "electron";
import path from "path";
import {
  INITIAL_ICON_IMAGE,
  IS_DEV,
  RECENT_CONVERSATION_TRAY_COUNT,
  RESOURCES_PATH,
} from "./helpers/constants";
import { getProfileImg } from "./helpers/profileImage";
import { popupContextMenu } from "./menu/contextMenu";

const { Notification: ElectronNotification, app, dialog } = remote;

function unreadObserver() {
  if (document.querySelector(".unread") != null) {
    app.trayManager?.setUnread(true);
  } else {
    app.trayManager?.setUnread(false);
  }
}

function createUnreadObserver() {
  const observer = new MutationObserver(unreadObserver);
  observer.observe(
    (document.body.querySelector(
      "mws-conversations-list"
    ) as unknown) as Element,
    {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-e2e-is-unread"],
    }
  );
  return observer;
}

function recentThreadObserver() {
  const conversations = Array.from(
    document.body.querySelectorAll("mws-conversation-list-item")
  ).slice(0, RECENT_CONVERSATION_TRAY_COUNT);

  const data = conversations.map((conversation) => {
    const name = conversation.querySelector("a div.text-content h3.name span")
      ?.textContent;
    const canvas = conversation.querySelector(
      "a div.avatar-container canvas"
    ) as HTMLCanvasElement | null;

    const image = canvas?.toDataURL();

    const recentMessage = conversation.querySelector(
      "a div.text-content div.snippet-text mws-conversation-snippet span"
    )?.textContent;

    const click = () => void conversation.querySelector("a")?.click();

    return { name, image, recentMessage, click };
  });
  app.trayManager?.setRecentConversations(data);
}

function createRecentThreadObserver() {
  const observer = new MutationObserver(recentThreadObserver);
  observer.observe(
    (document.body.querySelector(
      "mws-conversations-list"
    ) as unknown) as Element,
    {
      attributes: false,
      subtree: true,
      childList: true,
    }
  );
  return observer;
}

window.addEventListener("load", () => {
  const conversationListObserver = new MutationObserver(() => {
    if (document.querySelector("mws-conversations-list") != null) {
      createUnreadObserver();
      createRecentThreadObserver();
      app.settings?.showIconsInRecentConversationTrayEnabled.subscribe(
        recentThreadObserver
      );
      app.settings?.trayEnabled.subscribe(recentThreadObserver);

      // keep trying to get an image that isnt blank until they load
      const interval = setInterval(() => {
        const conversation = document.body.querySelector(
          "mws-conversation-list-item"
        );
        if (conversation) {
          const canvas = conversation.querySelector(
            "a div.avatar-container canvas"
          ) as HTMLCanvasElement | null;

          if (canvas != null && canvas.toDataURL() != INITIAL_ICON_IMAGE) {
            console.log(canvas.toDataURL());
            recentThreadObserver();
            clearInterval(interval);
          }
        }
      }, 250);
      conversationListObserver.disconnect();
    }
  });

  conversationListObserver.observe(document.body, {
    attributes: false,
    subtree: true,
    childList: true,
  });

  // a work around issue #229 (https://github.com/OrangeDrangon/android-messages-desktop/issues/229)
  if (
    !(app.settings?.startInTrayEnabled.value && app.settings?.trayEnabled.value)
  ) {
    app.mainWindow?.show();
  }

  // Note: this hides this during dev
  // remove the condition for testing
  if (!IS_DEV && !app.settings?.seenResetSettingsWarning.value) {
    const message = `
The settings for this app have been reset.

This is a one time occurance and is the result of behind the scenes work to clean up the code.

You may notice three missing settings:

  - Enter to Send: Moved to the 3 dots menu
  - Notification Sound: Moved to the 3 dots menu
  - Use System Theme: Removed for the time being in favor of manual operation
    `;
    dialog.showMessageBox({
      type: "info",
      buttons: ["OK"],
      title: "Settings Reset",
      message,
    });
    app.settings?.seenResetSettingsWarning.next(true);
  }
});

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
  const icon = getProfileImg(title);

  const notificationOpts: NotificationConstructorOptions = app.settings
    ?.hideNotificationContentEnabled.value
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

  // let google handle making the noise
  notificationOpts.silent = true;

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
