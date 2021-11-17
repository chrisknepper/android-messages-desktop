import { MenuItemConstructorOptions } from "electron";
import { checkForUpdate, installUpdate } from "../../helpers/autoUpdate";
import { IS_DEV } from "../../helpers/constants";
import { settings } from "../../helpers/settings";

export const checkForUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Check for Updates",
  click: () => {
    if (!IS_DEV) {
      checkForUpdate(true);
    }
  },
};

export const installUpdatesMenuItem: MenuItemConstructorOptions = {
  id: "installUpdateMenuItem",
  label: "Install Updates",
  visible: settings.isUpdate.value,
  click: installUpdate,
};
