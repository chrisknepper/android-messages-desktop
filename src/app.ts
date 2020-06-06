import "./stylesheets/main.css";

import { ipcRenderer, remote, WebviewTag } from "electron";
import { EVENT_UPDATE_USER_SETTING, IS_MAC } from "./helpers/constants";

const app = remote.app;

const androidMessagesWebview = document.getElementById(
  "androidMessagesWebview"
) as WebviewTag;

androidMessagesWebview.addEventListener("dom-ready", () => {
  app.mainWindow?.on("focus", () => {
    // Dispatches a focus event for QOL allowing the webview to put our cursor where it belongs
    androidMessagesWebview.dispatchEvent(new Event("focus"));
  });

  // Make the title centered so that it won't get weirdly covered by the traffic light on mac
  // 10px should make it look roughly centered
  // TODO: Use more sophisticated CSS which doesn't rely on Google's obfuscated class names to do this
  if (IS_MAC) {
    androidMessagesWebview.insertCSS(
      ".main-nav-header .logo {text-align:center; transform: translateX(10px)}"
    );
  }
});

// Forward event from main process to webview bridge
ipcRenderer.on(EVENT_UPDATE_USER_SETTING, (_event, settingsList) => {
  androidMessagesWebview.send(EVENT_UPDATE_USER_SETTING, settingsList);
});
