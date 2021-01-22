import {
  app,
  Event as ElectronEvent,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
} from "electron";
import { autoUpdater } from "electron-updater";
import path from "path";
import {
  BASE_APP_PATH,
  EVENT_BRIDGE_INIT,
  EVENT_UPDATE_USER_SETTING,
  IS_DEV,
  IS_LINUX,
  IS_MAC,
  IS_WINDOWS,
  RESOURCES_PATH,
  SETTING_TRAY_ENABLED,
} from "./helpers/constants";
import { SettingsManager } from "./helpers/settingsManager";
import { TrayManager } from "./helpers/trayManager";
import { CustomBrowserWindow } from "./helpers/window";
import { baseMenuTemplate } from "./menu/baseMenu";
import { devMenuTemplate } from "./menu/devMenu";
import { helpMenuTemplate } from "./menu/helpMenu";

const state = {
  bridgeInitDone: false,
};

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
  let settingsManager: SettingsManager;

  app.on("ready", () => {
    trayManager = new TrayManager();
    settingsManager = new SettingsManager();
    settingsManager.addWatcher(
      SETTING_TRAY_ENABLED,
      trayManager.handleTrayEnabledToggle
    );

    setApplicationMenu();
    const menuInstance = Menu.getApplicationMenu();

    if (IS_MAC) {
      app.on("activate", () => {
        mainWindow.show();
      });
    }

    nativeTheme.on("updated", () => {
      if (settingsManager.systemDarkMode) {
        mainWindow.webContents.send(EVENT_UPDATE_USER_SETTING, {
          useDarkMode: nativeTheme.shouldUseDarkColors,
        });
      }
    });

    if (menuInstance != null) {
      const trayMenuItem = menuInstance.getMenuItemById("startInTrayMenuItem");
      const enableTrayIconMenuItem = menuInstance.getMenuItemById(
        "enableTrayIconMenuItem"
      );
      const notificationSoundEnabledMenuItem = menuInstance.getMenuItemById(
        "notificationSoundEnabledMenuItem"
      );
      const pressEnterToSendMenuItem = menuInstance.getMenuItemById(
        "pressEnterToSendMenuItem"
      );
      const hideNotificationContentMenuItem = menuInstance.getMenuItemById(
        "hideNotificationContentMenuItem"
      );
      const useSystemDarkModeMenuItem = menuInstance.getMenuItemById(
        "useSystemDarkModeMenuItem"
      );

      if (!IS_MAC) {
        // Sets checked status based on user prefs
        (menuInstance.getMenuItemById(
          "autoHideMenuBarMenuItem"
        ) as Electron.MenuItem).checked = settingsManager.autoHideMenu;
        (trayMenuItem as Electron.MenuItem).enabled = trayManager.enabled;
      }

      (trayMenuItem as Electron.MenuItem).checked = settingsManager.startInTray;
      (enableTrayIconMenuItem as Electron.MenuItem).checked =
        trayManager.enabled;

      (notificationSoundEnabledMenuItem as Electron.MenuItem).checked =
        settingsManager.notificationSound;
      (pressEnterToSendMenuItem as Electron.MenuItem).checked =
        settingsManager.enterToSend;
      (hideNotificationContentMenuItem as Electron.MenuItem).checked =
        settingsManager.hideNotificationContent;
      (useSystemDarkModeMenuItem as Electron.MenuItem).checked =
        settingsManager.systemDarkMode;
    }

    autoUpdater.checkForUpdatesAndNotify();

    mainWindow = new CustomBrowserWindow("main", {
      width: 1100,
      height: 800,
      autoHideMenuBar: settingsManager.autoHideMenu,
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

    trayManager.startIfEnabled();

    ipcMain.on(EVENT_BRIDGE_INIT, async (_event) => {
      if (state.bridgeInitDone) {
        return;
      }

      state.bridgeInitDone = true;

      // a work around issue #229 (https://github.com/OrangeDrangon/android-messages-desktop/issues/229)
      if (!settingsManager.startInTray) mainWindow.show();

      // We have to send un-solicited events (i.e. an event not the result of an event sent to this process) to the webview bridge
      // via the renderer process. I'm not sure of a way to get a reference to the androidMessagesWebview inside the renderer from
      // here. There may be a legit way to do it, or we can do it a dirty way like how we pass this process to the renderer.
      mainWindow.webContents.send(EVENT_UPDATE_USER_SETTING, {
        enterToSend: settingsManager.enterToSend,
        useDarkMode: settingsManager.systemDarkMode
          ? nativeTheme.shouldUseDarkColors
          : null,
      });
    });

    let quitViaContext = false;
    app.on("before-quit", () => {
      quitViaContext = true;
    });

    const shouldExitOnMainWindowClosed = () => {
      if (IS_MAC) {
        return quitViaContext;
      } else {
        if (trayManager?.enabled) {
          return quitViaContext;
        }
        return true;
      }
    };

    mainWindow.on("close", (event: ElectronEvent) => {
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

        contents.on("destroyed", () => {
          // we will need to re-init on reload
          state.bridgeInitDone = false;
        });

        contents.on("will-navigate", (e, url) => {
          if (url === "https://messages.google.com/web/authentication") {
            // we were logged out, let's display a notification to the user about this in the future
            state.bridgeInitDone = false;
          }
        });
      }
    });
  });
}
