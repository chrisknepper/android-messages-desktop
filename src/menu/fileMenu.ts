import { app, MenuItemConstructorOptions } from "electron";
import {
  checkForUpdatesMenuItem,
  installUpdatesMenuItem,
} from "./items/updates";
import { separator } from "./items/separator";

const submenu: MenuItemConstructorOptions[] = [
  {
    label: "Quit Android Messages",
    click: (): void => app.quit(),
  },
  separator,
  checkForUpdatesMenuItem,
  installUpdatesMenuItem,
];

export const fileMenuTemplate: MenuItemConstructorOptions = {
  label: "&File",
  submenu,
};
