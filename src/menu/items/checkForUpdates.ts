import { autoUpdater } from "electron-updater";
import { MenuItemConstructorOptions } from "electron";

export const checkForUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Check for Updates",
  click: (): void => {
    autoUpdater.checkForUpdatesAndNotify();
  },
};
