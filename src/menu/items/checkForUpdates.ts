import { MenuItemConstructorOptions } from "electron";
import { checkForUpdate } from "../../helpers/autoUpdate";

export const checkForUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Check for Updates",
  click: checkForUpdate,
};
