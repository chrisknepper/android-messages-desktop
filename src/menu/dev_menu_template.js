import { app, BrowserWindow } from "electron";
import { IS_MAC } from "../constants";
import settings from "electron-settings";

export const devMenuTemplate = {
  label: "Development",
  submenu: [
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
      }
    },
    {
      label: "Toggle Fullscreen",
      accelerator: "F11",
      click: (item, window) => {
        const fullscreen = window.isFullScreen();
        const autoHideMenuPref = settings.get('autoHideMenuPref', false);

        // Only makes changes to menu bar settings when not on macOS
        if (!IS_MAC) {
          window.setMenuBarVisibility(fullscreen ? !autoHideMenuPref : false);
          window.setAutoHideMenuBar(fullscreen ? autoHideMenuPref : true);
        }

        window.setFullScreen(!fullscreen);
      }
    },
    {
      label: "Toggle DevTools",
      accelerator: "Alt+CmdOrCtrl+I",
      click: () => {
        BrowserWindow.getFocusedWindow().toggleDevTools();
      }
    },
    {
      label: "Quit",
      accelerator: "CmdOrCtrl+Q",
      click: () => {
        app.quit();
      }
    }
  ]
};
