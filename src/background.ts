import { app, Event as ElectronEvent, Menu, shell } from "electron";
import path from "path";
import { checkForUpdate } from "./helpers/autoUpdate";
import {
  BASE_APP_PATH,
  IS_DEV,
  IS_LINUX,
  IS_MAC,
  IS_WINDOWS,
  RESOURCES_PATH,
} from "./helpers/constants";
import { settings } from "./helpers/settings";
import { TrayManager } from "./helpers/trayManager";
import { CustomBrowserWindow } from "./helpers/window";
import { baseMenuTemplate } from "./menu/baseMenu";
import { devMenuTemplate } from "./menu/devMenu";
import { helpMenuTemplate } from "./menu/helpMenu";

// bring the settings into scope
const {
  autoHideMenuEnabled,
  trayEnabled,
  savedWindowSize,
  savedWindowPosition,
  checkForUpdateOnLaunchEnabled,
} = settings;

let mainWindow: CustomBrowserWindow;

/**
 * Prevent multiple instances of the app which causes many problems with an app like ours
 * Without this, if an instance were minimized to the tray in Windows, clicking a shortcut would launch another instance, icky
 * Adapted from https://www.electronjs.org/docs/api/app#apprequestsingleinstancelock
 */
const isFirstInstance = app.requestSingleInstanceLock();

if (!isFirstInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
    }
  });

  const setApplicationMenu = () => {
    const menus = baseMenuTemplate;
    if (IS_DEV) {
      menus.push(devMenuTemplate);
    }
    menus.push(helpMenuTemplate);
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
  };

  /**
   * Save userData in separate folders for each environment.
   * Thanks to this you can use production and development versions of the app
   * on same machine like those are two separate apps.
   */
  if (IS_DEV) {
    const userDataPath = app.getPath("userData");
    app.setPath("userData", `${userDataPath}-(${process.env.NODE_ENV})`);
  }

  if (IS_WINDOWS) {
    // Stupid, DUMB calls that have to be made to let notifications come through on Windows (only Windows 10?)
    // See: https://github.com/electron/electron/issues/10864#issuecomment-382519150
    app.setAppUserModelId("pw.kmr.android-messages-desktop");
    app.setAsDefaultProtocolClient("android-messages-desktop");
  }

  let trayManager: TrayManager;

  app.on("ready", () => {
    trayManager = new TrayManager();

    setApplicationMenu();

    if (IS_MAC) {
      app.on("activate", () => {
        mainWindow.show();
      });
    }

    if (checkForUpdateOnLaunchEnabled.value) {
      checkForUpdate(true);
    }

    // destructure from the settings
    const { width, height } = savedWindowSize.value;
    // provide empty object if savedWindowPosition is null
    const { x, y } = savedWindowPosition.value || {};

    mainWindow = new CustomBrowserWindow("main", {
      width,
      height,
      x,
      y,
      autoHideMenuBar: autoHideMenuEnabled.value,
      show: false, //don't show window just yet (issue #229)
      icon: IS_LINUX
        ? path.resolve(RESOURCES_PATH, "icons", "128x128.png")
        : undefined,
      webPreferences: {
        nodeIntegration: true,
        webviewTag: true,
        enableRemoteModule: true,
      },
    });

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

    mainWindow.loadFile(path.resolve(BASE_APP_PATH, "app", "index.html"));

    // Quick and dirty way for renderer process to access mainWindow for communication
    app.mainWindow = mainWindow;
    app.trayManager = trayManager;
    app.settings = settings;

    trayManager.startIfEnabled();

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

    app.on("web-contents-created", (e, contents) => {
      // Check for a webview
      if (contents.getType() == "webview") {
        // Listen for any new window events
        contents.on("new-window", (e, url) => {
          e.preventDefault();
          shell.openExternal(url);
        });
      }
    });

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
}
