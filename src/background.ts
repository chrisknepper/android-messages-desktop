import { app, Event as ElectronEvent, ipcMain, shell } from "electron";
import { BrowserWindow } from "electron/main";
import path from "path";
import process from "process";
import { checkForUpdate } from "./helpers/autoUpdate";
import {
  IS_DEV,
  IS_LINUX,
  IS_MAC,
  IS_WINDOWS,
  RESOURCES_PATH,
} from "./helpers/constants";
import { MenuManager } from "./helpers/menuManager";
import { settings } from "./helpers/settings";
import { Conversation, TrayManager } from "./helpers/trayManager";
import { popupContextMenu } from "./menu/contextMenu";

const {
  autoHideMenuEnabled,
  trayEnabled,
  savedWindowSize,
  savedWindowPosition,
  checkForUpdateOnLaunchEnabled,
} = settings;

let mainWindow: BrowserWindow;
let trayManager: TrayManager;

app.on("second-instance", () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  }
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

if (IS_MAC) {
  app.on("activate", () => {
    if (mainWindow) {
      mainWindow.show();
      app.dock.setBadge("");
    }
  });
}

app.on("ready", () => {
  if (IS_WINDOWS) {
    app.setAppUserModelId("pw.kmr.android-messages-desktop");
    app.setAsDefaultProtocolClient("android-messages-desktop");
  }

  trayManager = new TrayManager();

  new MenuManager();

  if (checkForUpdateOnLaunchEnabled.value && !IS_DEV) {
    checkForUpdate(true);
  }

  const { width, height } = savedWindowSize.value;
  const { x, y } = savedWindowPosition.value ?? {};

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    autoHideMenuBar: autoHideMenuEnabled.value,
    title: "Android Messages",
    show: false, //don't show window just yet (issue #229)
    icon: IS_LINUX
      ? path.resolve(RESOURCES_PATH, "icons", "128x128.png")
      : undefined,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: IS_DEV
        ? path.resolve(app.getAppPath(), "bridge.js")
        : path.resolve(app.getAppPath(), "app", "bridge.js"),
    },
  });

  process.env.MAIN_WINDOW_ID = mainWindow.id.toString();

  if (!(settings.trayEnabled.value && settings.startInTrayEnabled.value)) {
    mainWindow.show();
  }
  // set user agent to potentially make google fi work
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:84.0) Gecko/20100101 Firefox/84.0";

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    {
      urls: ["https://accounts.google.com/*"],
    },
    ({ requestHeaders }, callback) =>
      callback({
        requestHeaders: { ...requestHeaders, "User-Agent": userAgent },
      })
  );

  mainWindow.loadURL("https://messages.google.com/web/");

  trayManager.startIfEnabled();
  settings.showIconsInRecentConversationTrayEnabled.subscribe(() =>
    trayManager.refreshTrayMenu()
  );

  let quitViaContext = false;
  app.on("before-quit", () => {
    quitViaContext = true;
  });

  const shouldExitOnMainWindowClosed = () => {
    if (IS_MAC) {
      return quitViaContext;
    } else {
      if (trayEnabled.value) {
        return quitViaContext;
      }
      return true;
    }
  };

  mainWindow.on("close", (event: ElectronEvent) => {
    const { x, y, width, height } = mainWindow.getBounds();
    savedWindowPosition.next({ x, y });
    savedWindowSize.next({ width, height });
    if (!shouldExitOnMainWindowClosed()) {
      event.preventDefault();
      mainWindow.hide();
      trayManager?.showMinimizeToTrayWarning();
    } else {
      app.quit(); // If we don't explicitly call this, the webview and mainWindow get destroyed but background process still runs.
    }
  });

  mainWindow.webContents.on("new-window", (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.on("context-menu", popupContextMenu);

  // block Google collecting data
  mainWindow.webContents.session.webRequest.onBeforeRequest(
    {
      urls: [
        "https://messages.google.com/web/jserror?*",
        "https://play.google.com/log?*",
        "https://www.google-analytics.com/analytics.js",
      ],
    },
    (details, callback) => {
      callback({ cancel: true });
    }
  );
}); //onready

ipcMain.on("should-hide-notification-content", (event) => {
  event.returnValue = settings.hideNotificationContentEnabled.value;
});

ipcMain.on("show-main-window", () => {
  mainWindow.show();
  if (IS_MAC) {
    app.dock.setBadge("");
  }
});

ipcMain.on("flash-main-window-if-not-focused", () => {
  if (!mainWindow.isFocused()) {
    mainWindow.flashFrame(true);
    if (IS_MAC) {
      app.dock.setBadge("•");
    }
  }
});

ipcMain.on("set-unread-status", (_event, unreadStatus: boolean) => {
  trayManager.setUnread(unreadStatus);
});

ipcMain.on("set-recent-conversations", (_event, data: Conversation[]) => {
  trayManager.setRecentConversations(data);
});
