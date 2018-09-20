import { app, BrowserWindow } from "electron";
import { IS_MAC } from "../constants";
import settings from "electron-settings";

export const viewMenuTemplate = {
  label: "View",
  submenu: [
    {
      label: "Toggle Fullscreen",
      accelerator: "F11",
      type: "checkbox",
      click: (item, window) => {
        const fullscreen = window.isFullScreen();
        const autoHideMenuPref = settings.get('autoHideMenuPref', false);

        // Only makes changes to menu bar settings when not on macOS
        if (!IS_MAC) {
          window.setMenuBarVisibility(fullscreen ? !autoHideMenuPref : false);
          window.setAutoHideMenuBar(fullscreen ? autoHideMenuPref : true);
        }
        item.checked = !fullscreen;
        window.setFullScreen(!fullscreen);
      }
    },
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: (item, window) => {
        window.webContents.reloadIgnoringCache();
      }
    }
  ]
};
