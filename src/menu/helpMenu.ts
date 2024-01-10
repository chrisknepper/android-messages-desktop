import { MenuItemConstructorOptions, shell } from "electron";
import { IS_MAC, IS_WINDOWS } from "../helpers/constants";
import { aboutMenuItem } from "./items/about";
import { checkForUpdatesMenuItem } from "./items/updates";
import { separator } from "./items/separator";

const submenu: MenuItemConstructorOptions[] = [
  {
    label: "Learn More",
    click: async (): Promise<void> =>
      await shell.openExternal(
        "https://github.com/orangedrangon/android-messages-desktop/"
      ),
  },
];

if (IS_WINDOWS) {
  submenu.push(separator);
  submenu.push(checkForUpdatesMenuItem);
}

if (!IS_MAC) {
  submenu.push(separator);
  submenu.push(aboutMenuItem);
}

export const helpMenuTemplate: MenuItemConstructorOptions = {
  label: "&Help",
  submenu,
};
