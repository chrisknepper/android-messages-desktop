import { MenuItemConstructorOptions } from "electron";
import { checkForUpdate } from "../../helpers/autoUpdate";
import { IS_DEV } from "../../helpers/constants";

export const checkForUpdatesMenuItem: MenuItemConstructorOptions = {
  label: "Check for Updates…",
  click: () => {
    if (!IS_DEV) {
      checkForUpdate(true);
    }
  },
};
