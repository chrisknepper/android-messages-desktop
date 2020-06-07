// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import * as path from "path";
import {
  app,
  Menu,
  ipcMain,
  Notification,
  shell,
  nativeTheme,
  MenuItemConstructorOptions,
  BrowserWindowConstructorOptions,
  nativeImage,
} from "electron";
import { autoUpdater } from "electron-updater";
import { baseMenuTemplate } from "./menu/baseMenu";
import { devMenuTemplate } from "./menu/devMenu";
import { helpMenuTemplate } from "./menu/helpMenu";
import { CustomBrowserWindow } from "./helpers/window";
import { getDictionary } from "./helpers/dictionaryManager";
import { TrayManager } from "./helpers/trayManager";
import * as settings from "electron-settings";
import {
  IS_MAC,
  IS_WINDOWS,
  IS_LINUX,
  IS_DEV,
  SETTING_TRAY_ENABLED,
  SETTING_CUSTOM_WORDS,
  EVENT_WEBVIEW_NOTIFICATION,
  EVENT_NOTIFICATION_REFLECT_READY,
  EVENT_BRIDGE_INIT,
  EVENT_SPELL_ADD_CUSTOM_WORD,
  EVENT_SPELLING_REFLECT_READY,
  EVENT_UPDATE_USER_SETTING,
  BASE_APP_PATH,
  RESOURCES_PATH,
} from "./helpers/constants";

const state = {
  unreadNotificationCount: 0,
  notificationSoundEnabled: true,
  notificationContentHidden: false,
  bridgeInitDone: false,
  useSystemDarkMode: true,
};

type CustomWords = Record<string, string[]>;

let mainWindow: CustomBrowserWindow;

// Prevent multiple instances of the app which causes many problems with an app like ours
// Without this, if an instance were minimized to the tray in Windows, clicking a shortcut would launch another instance, icky
// Adapted from https://github.com/electron/electron/blob/v4.0.4/docs/api/app.md#apprequestsingleinstancelock
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

  let trayManager: TrayManager | null = null;

  const setApplicationMenu = () => {
    const menus: Array<MenuItemConstructorOptions> = baseMenuTemplate;
    if (IS_DEV) {
      menus.push(devMenuTemplate);
    }
    menus.push(helpMenuTemplate);
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
  };

  // Save userData in separate folders for each environment.
  // Thanks to this you can use production and development versions of the app
  // on same machine like those are two separate apps.
  if (IS_DEV) {
    const userDataPath = app.getPath("userData");
    app.setPath("userData", `${userDataPath} (${process.env.name})`);
  }

  if (IS_WINDOWS) {
    // Stupid, DUMB calls that have to be made to let notifications come through on Windows (only Windows 10?)
    // See: https://github.com/electron/electron/issues/10864#issuecomment-382519150
    app.setAppUserModelId("com.knepper.android-messages-desktop");
    app.setAsDefaultProtocolClient("android-messages-desktop");
  }

  app.on("ready", () => {
    trayManager = new TrayManager();

    // TODO: Create a preference manager which handles all of these
    const autoHideMenuBar = settings.get("autoHideMenuPref", false) as boolean;
    const startInTray = settings.get("startInTrayPref", false) as boolean;
    const notificationSoundEnabled = settings.get(
      "notificationSoundEnabledPref",
      true
    ) as boolean;
    const pressEnterToSendEnabled = settings.get(
      "pressEnterToSendPref",
      true
    ) as boolean;
    const hideNotificationContent = settings.get(
      "hideNotificationContentPref",
      false
    ) as boolean;
    const useSystemDarkMode = settings.get(
      "useSystemDarkModePref",
      true
    ) as boolean;
    settings.watch(SETTING_TRAY_ENABLED, trayManager.handleTrayEnabledToggle);
    settings.watch("notificationSoundEnabledPref", (newValue) => {
      state.notificationSoundEnabled = newValue;
    });
    settings.watch("pressEnterToSendPref", (newValue) => {
      mainWindow.webContents.send(EVENT_UPDATE_USER_SETTING, {
        enterToSend: newValue,
      });
    });
    settings.watch("hideNotificationContentPref", (newValue) => {
      state.notificationContentHidden = newValue;
    });
    settings.watch("useSystemDarkModePref", (newValue) => {
      state.useSystemDarkMode = newValue;
    });

    setApplicationMenu();
    const menuInstance = Menu.getApplicationMenu();

    if (IS_MAC) {
      app.on("activate", () => {
        mainWindow.show();
      });
    }

    nativeTheme.on("updated", () => {
      if (state.useSystemDarkMode) {
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
        menuInstance.getMenuItemById(
          "autoHideMenuBarMenuItem"
        ).checked = autoHideMenuBar;
        trayMenuItem.enabled = trayManager.enabled;
      }

      trayMenuItem.checked = startInTray;
      enableTrayIconMenuItem.checked = trayManager.enabled;

      if (IS_WINDOWS) {
        const trayClickShortcutMenuItem = menuInstance.getMenuItemById(
          "trayClickShortcutMenuItem"
        );
        trayClickShortcutMenuItem.enabled = trayManager.enabled;
      }

      notificationSoundEnabledMenuItem.checked = notificationSoundEnabled;
      pressEnterToSendMenuItem.checked = pressEnterToSendEnabled;
      hideNotificationContentMenuItem.checked = hideNotificationContent;
      useSystemDarkModeMenuItem.checked = useSystemDarkMode;

      state.notificationSoundEnabled = notificationSoundEnabled;
      state.notificationContentHidden = hideNotificationContent;
      state.useSystemDarkMode = useSystemDarkMode;
    }

    autoUpdater.checkForUpdatesAndNotify();

    const mainWindowOptions: BrowserWindowConstructorOptions = {
      width: 1100,
      height: 800,
      autoHideMenuBar: autoHideMenuBar,
      show: !startInTray, //Starts in tray if set
      titleBarStyle: IS_MAC ? "hiddenInset" : "default", //Turn on hidden frame on a Mac
      webPreferences: {
        nodeIntegration: true,
        webviewTag: true,
        enableRemoteModule: true,
      },
    };

    if (IS_LINUX) {
      // Setting the icon in Linux tends to be finicky without explicitly setting it like this.
      // See: https://github.com/electron/electron/issues/6205
      mainWindowOptions.icon = path.resolve(
        RESOURCES_PATH,
        "icons",
        "128x128.png"
      );
    }

    mainWindow = new CustomBrowserWindow("main", mainWindowOptions);

    mainWindow.loadFile(path.resolve(BASE_APP_PATH, "app", "index.html"));

    trayManager.startIfEnabled();

    app.mainWindow = mainWindow; // Quick and dirty way for renderer process to access mainWindow for communication

    mainWindow.on("focus", () => {
      if (IS_MAC) {
        state.unreadNotificationCount = 0;
        app.dock.setBadge("");
      }

      if (IS_WINDOWS && trayManager?.overlayVisible) {
        trayManager.toggleOverlay(false);
      }
    });

    ipcMain.on(
      EVENT_WEBVIEW_NOTIFICATION,
      (
        event,
        { title, options }: { title: string; options?: NotificationOptions }
      ) => {
        if (options) {
          const notificationOpts: Electron.NotificationConstructorOptions = state.notificationContentHidden
            ? {
                title: "Android Messages Desktop",
                body: "New Message",
              }
            : {
                title,
                /*
                 * This is what we call absolute shenanigans. Above we call a function in the render process
                 * That function calls another function in the webView retrieving the name of the message at the top and the respective image
                 * It could technically be done without polluting the window but it would have been ugly as hell (as if this is not)
                 * Bellow it makes sure everything is defined and checks if the author matches the title of the notification
                 * If something is undefined it falls back to a generic icon in the resources folder.
                 */
                icon:
                  options.image != null
                    ? nativeImage.createFromDataURL(options.image)
                    : path.resolve(RESOURCES_PATH, "icons", "64x64.png"),
                body: options.body || "",
              };
          notificationOpts.silent = !state.notificationSoundEnabled;
          const customNotification = new Notification(notificationOpts);

          if (IS_MAC) {
            if (!mainWindow.isFocused()) {
              state.unreadNotificationCount += 1;
              app.dock.setBadge("" + state.unreadNotificationCount);
            }
          }

          trayManager?.toggleOverlay(true);

          customNotification.once("click", () => {
            mainWindow.show();
          });

          // Allows us to marry our custom notification and its behavior with the helpful behavior
          // (conversation highlighting) that Google provides. See the webview bridge for details.
          global.currentNotification = customNotification;
          event.sender.send(EVENT_NOTIFICATION_REFLECT_READY, true);

          customNotification.show();
        }
      }
    );

    ipcMain.on(EVENT_BRIDGE_INIT, async (event) => {
      if (state.bridgeInitDone) {
        return;
      }

      state.bridgeInitDone = true;
      // We have to send un-solicited events (i.e. an event not the result of an event sent to this process) to the webview bridge
      // via the renderer process. I'm not sure of a way to get a reference to the androidMessagesWebview inside the renderer from
      // here. There may be a legit way to do it, or we can do it a dirty way like how we pass this process to the renderer.
      mainWindow.webContents.send(EVENT_UPDATE_USER_SETTING, {
        enterToSend: pressEnterToSendEnabled,
        useDarkMode: useSystemDarkMode ? nativeTheme.shouldUseDarkColors : null,
      });
      const locale = app.getLocale();

      try {
        // Spellchecking is supported for the current language
        const spellCheckFiles = await getDictionary(locale);
        const customWords = settings.get(
          SETTING_CUSTOM_WORDS,
          {}
        ) as CustomWords;

        // We send an event with the language key and array of custom words to the webview bridge which contains the
        // instance of the spellchecker. Done this way because passing class instances (i.e. of the spellchecker)
        // between electron processes is hacky at best and impossible at worst.

        event.sender.send(EVENT_SPELLING_REFLECT_READY, {
          locale,
          spellCheckFiles,
          customWords,
        });
      } catch (error) {
        // TODO: Display this as an error message to the user?
      }
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

    mainWindow.on("close", (event: Electron.Event) => {
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
