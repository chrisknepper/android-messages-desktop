import { MenuItemConstructorOptions } from "electron";
import { autoUpdater } from "electron-updater";

export const checkForUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Check for Updates",
  click: (): void => {
    autoUpdater.checkForUpdatesAndNotify();
  },
};
