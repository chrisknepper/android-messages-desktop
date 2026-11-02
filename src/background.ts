import "./helpers/portable";
import {
  app,
  Event as ElectronEvent,
  ipcMain,
  powerMonitor,
  shell,
} from "electron";
import { BrowserWindow } from "electron/main";
import path from "path";
import process from "process";
import { checkForUpdate, setUpdateWindow } from "./helpers/autoUpdate";
import { IS_DEV, IS_LINUX, IS_MAC, RESOURCES_PATH } from "./helpers/constants";
import { MenuManager } from "./helpers/menuManager";
import { setSettingsFlushEnabled, settings } from "./helpers/settings";
import { Conversation, TrayManager } from "./helpers/trayManager";
import { popupContextMenu } from "./menu/contextMenu";
import fs from "fs";

const {
  autoHideMenuEnabled,
  trayEnabled,
  savedWindowSize,
  savedWindowPosition,
  checkForUpdateOnLaunchEnabled,
  taskbarFlashEnabled,
  spellCheckEnabled,
} = settings;

let mainWindow: BrowserWindow;
let trayManager: TrayManager;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });
}

if (IS_MAC) {
  app.on("activate", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      app.dock?.setBadge("");
    }
  });
}

app.on("before-quit", () => {
  setSettingsFlushEnabled(false);
});

if (gotTheLock) {
  app.on("ready", () => app.setAppUserModelId("pw.kmr.amd"));

  app.on("ready", () => {
    trayManager = new TrayManager();

    new MenuManager();

    const { width, height } = savedWindowSize.value;
    const { x, y } = savedWindowPosition.value ?? {};

    mainWindow = new BrowserWindow({
      width,
      height,
      x,
      y,
      autoHideMenuBar: autoHideMenuEnabled.value,
      title: "Android Messages",
      show: false,
      icon: IS_LINUX
        ? path.resolve(RESOURCES_PATH, "icons", "128x128.png")
        : undefined,
      titleBarStyle: IS_MAC ? "hiddenInset" : "default",
      webPreferences: {
        preload: IS_DEV
          ? path.resolve(app.getAppPath(), "bridge.js")
          : path.resolve(app.getAppPath(), "app", "bridge.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        partition: "persist:main",
        backgroundThrottling: false,
      },
    });

    process.env.MAIN_WINDOW_ID = mainWindow.id.toString();

    setUpdateWindow(mainWindow);
    if (checkForUpdateOnLaunchEnabled.value && !IS_DEV) {
      checkForUpdate(false);
    }

    if (!(settings.trayEnabled.value && settings.startInTrayEnabled.value)) {
      mainWindow.show();
    }

    mainWindow.loadURL("https://messages.google.com/web/");

    trayManager.startIfEnabled();
    settings.showIconsInRecentConversationTrayEnabled.subscribe(() =>
      trayManager.refreshTrayMenu()
    );

    // Apply the spell-check preference on launch and whenever it is toggled.
    spellCheckEnabled.subscribe((enabled) =>
      mainWindow.webContents.session.setSpellCheckerEnabled(enabled)
    );

    let quitViaContext = false;
    app.on("before-quit", () => {
      quitViaContext = true;
    });

    const shouldExitOnMainWindowClosed = () => {
      if (IS_MAC) {
        return quitViaContext;
      }

      if (trayEnabled.value) {
        return quitViaContext;
      }

      return true;
    };

    mainWindow.on("close", (event: ElectronEvent) => {
      const { x, y, width, height } = mainWindow.getBounds();
      savedWindowPosition.next({ x, y });
      savedWindowSize.next({ width, height });

      if (!shouldExitOnMainWindowClosed()) {
        event.preventDefault();
        mainWindow.hide();
        trayManager?.showMinimizeToTrayWarning();

        if (IS_MAC) {
          app.dock?.hide();
        }
      } else {
        app.quit();
      }
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
      const url = details.url;

      const isGoogleAuthWindow =
        url.startsWith("https://accounts.google.com/") ||
        url.startsWith("https://google.com/") ||
        url.startsWith("https://www.google.com/") ||
        url.startsWith("https://messages.google.com/");

      if (isGoogleAuthWindow) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            width: 500,
            height: 700,
            parent: mainWindow,
            modal: true,
            autoHideMenuBar: true,
            titleBarStyle: "default",
            webPreferences: {
              preload: IS_DEV
                ? path.resolve(app.getAppPath(), "bridge.js")
                : path.resolve(app.getAppPath(), "app", "bridge.js"),
              contextIsolation: true,
              nodeIntegration: false,
              sandbox: false,
              partition: "persist:main",
            },
          },
        };
      }

      shell.openExternal(url);
      return { action: "deny" };
    });

    let reloadTimeout: NodeJS.Timeout | null = null;
    let pendingResume = false;
    let hasFailedLoad = false;
    let isNetworkOffline = false;

    const reloadMainWindow = (delayMs = 0) => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      reloadTimeout = setTimeout(() => {
        reloadTimeout = null;
        if (!mainWindow || mainWindow.isDestroyed()) {
          return;
        }
        const currentUrl = mainWindow.webContents.getURL();
        if (
          !currentUrl ||
          currentUrl.startsWith("chrome-error://") ||
          currentUrl === "about:blank"
        ) {
          mainWindow.loadURL("https://messages.google.com/web/");
        } else {
          mainWindow.webContents.reload();
        }
      }, delayMs);
    };

    mainWindow.webContents.on("did-finish-load", () => {
      pendingResume = false;
      hasFailedLoad = false;
    });

    mainWindow.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription, validatedURL) => {
        console.log("did-fail-load", {
          errorCode,
          errorDescription,
          validatedURL,
        });
        // -3 is ERR_ABORTED (navigation superseded/cancelled). For all other network failures, retry.
        if (errorCode !== -3 && !mainWindow.isDestroyed()) {
          hasFailedLoad = true;
          reloadMainWindow(3000);
        }
      }
    );

    mainWindow.webContents.on(
      "did-redirect-navigation",
      (_event, url, isInPlace, isMainFrame) => {
        console.log("did-redirect-navigation", {
          url,
          isInPlace,
          isMainFrame,
        });
      }
    );

    mainWindow.webContents.on("console-message", (_event, level, message) => {
      console.log("renderer console:", level, message);
    });

    mainWindow.webContents.on("context-menu", popupContextMenu);

    // The Google Messages web app frequently ends up on a blank white screen or
    // loses its connection to the phone after the machine resumes from suspend (#505, #605).
    // Allow a short delay for network interfaces (Wi-Fi/DHCP) to re-associate, and reload.
    powerMonitor.on("resume", () => {
      if (!mainWindow.isDestroyed()) {
        pendingResume = true;
        reloadMainWindow(2500);
      }
    });

    // The OS can also kill the renderer outright while suspended (memory
    // reclaim), which leaves the same blank screen. Reload to recover unless it
    // exited cleanly (e.g. during shutdown).
    mainWindow.webContents.on("render-process-gone", (_event, details) => {
      console.log("render-process-gone", details);
      if (details.reason !== "clean-exit" && !mainWindow.isDestroyed()) {
        reloadMainWindow(1000);
      }
    });

    ipcMain.on("network-online", () => {
      const wasOffline = isNetworkOffline;
      isNetworkOffline = false;
      if (pendingResume || hasFailedLoad || wasOffline) {
        reloadMainWindow(1000);
      }
    });

    ipcMain.on("network-offline", () => {
      isNetworkOffline = true;
    });
  });

  ipcMain.on("should-hide-notification-content", (event) => {
    event.returnValue = settings.hideNotificationContentEnabled.value;
  });

  ipcMain.on("show-main-window", () => {
    mainWindow.show();
    mainWindow.focus();

    if (IS_MAC) {
      app.dock?.setBadge("");
    }
  });

  ipcMain.on("flash-main-window-if-not-focused", () => {
    if (!mainWindow.isFocused() && taskbarFlashEnabled.value) {
      mainWindow.flashFrame(true);

      if (IS_MAC) {
        app.dock?.setBadge("•");
      }
    }
  });

  ipcMain.on("set-unread-status", (_event, unreadStatus: boolean) => {
    trayManager.setUnread(unreadStatus);
  });

  ipcMain.on("set-recent-conversations", (_event, data: Conversation[]) => {
    trayManager.setRecentConversations(data);
  });

  ipcMain.handle("get-icon", () => {
    const bitmap = fs.readFileSync(
      path.resolve(RESOURCES_PATH, "icons", "64x64.png")
    );

    return Buffer.from(bitmap).toString("base64");
  });
}
