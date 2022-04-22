import { ipcRenderer } from "electron";
import path from "path";
import {
  INITIAL_ICON_IMAGE,
  IS_MAC,
  RESOURCES_PATH,
} from "./helpers/constants";
import {
  createRecentThreadObserver,
  createUnreadObserver,
  focusFunctions,
  recentThreadObserver,
} from "./helpers/observers";
import { getProfileImg } from "./helpers/profileImage";

window.addEventListener("load", () => {
  if (IS_MAC) {
    const titlebarStyle = `#amd-titlebar {
      -webkit-app-region: drag;
      position: fixed;
      width: 100%;
      height: 64px;
      top: 0;
      left: 0;
      background: none;
      pointer-events: none;
    }`;

    document.body.appendChild(
      Object.assign(document.createElement("style"), {
        textContent: titlebarStyle,
      })
    );

    const titlebar = document.createElement("div");
    titlebar.id = "amd-titlebar";
    document.querySelector("mw-app")?.parentNode?.prepend(titlebar);
  }

  const conversationListObserver = new MutationObserver(() => {
    if (document.querySelector("mws-conversations-list") != null) {
      createUnreadObserver();
      createRecentThreadObserver();

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
            recentThreadObserver();
            // refresh for profile image loads after letter loads.
            setTimeout(recentThreadObserver, 3000);
            clearInterval(interval);
          }
        }
      }, 250);
      conversationListObserver.disconnect();
    }

    const title = document.head.querySelector("title");
    if (title != null) {
      title.innerText = "Android Messages";
    }
  });

  conversationListObserver.observe(document.body, {
    attributes: false,
    subtree: true,
    childList: true,
  });
});

const OldNotification = window.Notification;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.Notification = function (title: string, options: NotificationOptions) {
  const icon = getProfileImg(title);

  const hideContent = ipcRenderer.sendSync("should-hide-notification-content");

  const notificationOpts: NotificationOptions = hideContent
    ? {
        body: "Click to open",
        icon: path.resolve(RESOURCES_PATH, "icons", "64x64.png"),
      }
    : {
        icon: icon?.toDataURL(),
        body: options.body || "",
      };

  const newTitle = hideContent ? "New Message" : title;
  const notification = new OldNotification(newTitle, notificationOpts);
  notification.addEventListener("click", () => {
    ipcRenderer.send("show-main-window");
    document.dispatchEvent(new Event("focus"));
  });
  ipcRenderer.send("flash-main-window-if-not-focused");
  return notification;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
window.Notification.permission = "granted";
window.Notification.requestPermission = async () => "granted";

ipcRenderer.on("focus-conversation", (event, i) => {
  focusFunctions[i]();
});
