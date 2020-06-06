import { app, MenuItemConstructorOptions } from "electron";
import { IS_WINDOWS } from "../helpers/constants";
import { checkForUpdatesMenuItem } from "./items/check_for_updates";
import { separator } from "./items/separator";

const submenu: MenuItemConstructorOptions[] = [
  {
    label: "Quit Android Messages",
    click: (): void => app.quit(),
  },
];

if (!IS_WINDOWS) {
  submenu.unshift(separator);
  submenu.unshift(checkForUpdatesMenuItem);
}

export const fileMenuTemplate: MenuItemConstructorOptions = {
  label: "File",
  submenu,
};
