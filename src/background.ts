import {
  app,
  Event as ElectronEvent,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
} from "electron";
import settings from "electron-settings";
import { autoUpdater } from "electron-updater";
import jetpack from "fs-jetpack";
import path from "path";
import {
  BASE_APP_PATH,
  EVENT_BRIDGE_INIT,
  EVENT_REFLECT_DISK_CACHE,
  EVENT_SPELLING_REFLECT_READY,
  EVENT_SPELL_ADD_CUSTOM_WORD,
  EVENT_UPDATE_USER_SETTING,
  IMG_CACHE_PATH,
  IS_DEV,
  IS_LINUX,
  IS_MAC,
  IS_WINDOWS,
  RESOURCES_PATH,
  SETTING_CUSTOM_WORDS,
  SETTING_TRAY_ENABLED,
} from "./helpers/constants";
import { getDictionary } from "./helpers/dictionaryManager";
import { SettingsManager } from "./helpers/settingsManager";
import { TrayManager } from "./helpers/trayManager";
import { CustomBrowserWindow } from "./helpers/window";
import { baseMenuTemplate } from "./menu/baseMenu";
import { devMenuTemplate } from "./menu/devMenu";
import { helpMenuTemplate } from "./menu/helpMenu";

const state = {
  bridgeInitDone: false,
};

type CustomWords = Record<string, string[]>;

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
        menuInstance.getMenuItemById("autoHideMenuBarMenuItem").checked =
          settingsManager.autoHideMenu;
        trayMenuItem.enabled = trayManager.enabled;
      }

      trayMenuItem.checked = settingsManager.startInTray;
      enableTrayIconMenuItem.checked = trayManager.enabled;

      notificationSoundEnabledMenuItem.checked =
        settingsManager.notificationSound;
      pressEnterToSendMenuItem.checked = settingsManager.enterToSend;
      hideNotificationContentMenuItem.checked =
        settingsManager.hideNotificationContent;
      useSystemDarkModeMenuItem.checked = settingsManager.systemDarkMode;
    }

    autoUpdater.checkForUpdatesAndNotify();

    mainWindow = new CustomBrowserWindow("main", {
      width: 1100,
      height: 800,
      autoHideMenuBar: settingsManager.autoHideMenu,
      show: !settingsManager.startInTray, //Starts in tray if set
      titleBarStyle: IS_MAC ? "hiddenInset" : "default", //Turn on hidden frame on a Mac
      icon: IS_LINUX
        ? path.resolve(RESOURCES_PATH, "icons", "128x128.png")
        : undefined,
      webPreferences: {
        nodeIntegration: true,
        webviewTag: true,
        enableRemoteModule: true,
      },
    });
    mainWindow.loadFile(path.resolve(BASE_APP_PATH, "app", "index.html"));

    // Quick and dirty way for renderer process to access mainWindow for communication
    app.mainWindow = mainWindow;

    trayManager.startIfEnabled();

    mainWindow.on("focus", () => {
      if (IS_WINDOWS && trayManager?.overlayVisible) {
        trayManager.toggleOverlay(false);
      }
    });

    ipcMain.on(EVENT_BRIDGE_INIT, async (event) => {
      if (state.bridgeInitDone) {
        return;
      }

      state.bridgeInitDone = true;
      // We have to send un-solicited events (i.e. an event not the result of an event sent to this process) to the webview bridge
      // via the renderer process. I'm not sure of a way to get a reference to the androidMessagesWebview inside the renderer from
      // here. There may be a legit way to do it, or we can do it a dirty way like how we pass this process to the renderer.
      mainWindow.webContents.send(EVENT_UPDATE_USER_SETTING, {
        enterToSend: settingsManager.enterToSend,
        useDarkMode: settingsManager.systemDarkMode
          ? nativeTheme.shouldUseDarkColors
          : null,
      });
      const basePath = IMG_CACHE_PATH();
      const imgDir = jetpack.dir(IMG_CACHE_PATH());
      const contents = await imgDir.listAsync(".");
      if (contents) {
        const cache: Record<string, string> = {};
        for (const file of contents) {
          const key = file.substr(0, file.length - 4);
          cache[key] = path.resolve(IMG_CACHE_PATH(), file);
        }
        event.sender.send(EVENT_REFLECT_DISK_CACHE, { cache, basePath });
      }

      const locale = app.getLocale();

      // Spellchecking is supported for the current language
      const spellCheckFiles = await getDictionary(locale);
      const customWords = settings.get(SETTING_CUSTOM_WORDS, {}) as CustomWords;

      // We send an event with the language key and array of custom words to the webview bridge which contains the
      // instance of the spellchecker. Done this way because passing class instances (i.e. of the spellchecker)
      // between electron processes is hacky at best and impossible at worst.

      event.sender.send(EVENT_SPELLING_REFLECT_READY, {
        locale,
        spellCheckFiles,
        customWords,
      });
    });

    ipcMain.on(EVENT_SPELL_ADD_CUSTOM_WORD, (_event, msg) => {
      // Add custom words picked by the user to a persistent data store because they must be added to
      // the instance of Hunspell on each launch of the app/loading of the dictionary.
      const { newCustomWord } = msg;
      const currentLanguage = app.getLocale();
      const existingCustomWords = settings.get(
        SETTING_CUSTOM_WORDS,
        {}
      ) as CustomWords;
      if (!(currentLanguage in existingCustomWords)) {
        existingCustomWords[currentLanguage] = [];
      }
      if (
        newCustomWord &&
        !existingCustomWords[currentLanguage].includes(newCustomWord)
      ) {
        existingCustomWords[currentLanguage].push(newCustomWord);
        settings.set(SETTING_CUSTOM_WORDS, existingCustomWords);
      }
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
