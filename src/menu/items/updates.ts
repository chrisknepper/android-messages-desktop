import { MenuItemConstructorOptions } from "electron";
import { checkForUpdate, installUpdate } from "../../helpers/autoUpdate";
import { settings } from "../../helpers/settings";

export const checkForUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Check for Updates",
  click: () => checkForUpdate(true),
};

export const installUpdatesMenuItem: MenuItemConstructorOptions = {
  id: "installUpdateMenuItem",
  label: "Install Updates",
  visible: settings.isUpdate.value,
  click: installUpdate,
};
