import { app, MenuItemConstructorOptions } from "electron";
import { checkForUpdatesMenuItem } from "./items/updates";
import { separator } from "./items/separator";

export const fileMenuTemplate: MenuItemConstructorOptions = {
  label: "&File",
  submenu: [
    checkForUpdatesMenuItem,
    separator,
    {
      label: "Quit Android Messages",
      click: (): void => app.quit(),
    },
  ],
};
