import { MenuItemConstructorOptions } from "electron";
import { checkForUpdate, installUpdate } from "../../helpers/autoUpdate";

export const checkForUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Check for Updates",
  click: () => checkForUpdate(true),
};

export const installUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Intall Updates",
  click: installUpdate,
};
