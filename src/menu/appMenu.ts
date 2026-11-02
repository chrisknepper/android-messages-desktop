import { app, MenuItemConstructorOptions } from "electron";
import { aboutMenuItem } from "./items/about";
import { separator } from "./items/separator";
import { checkForUpdatesMenuItem } from "./items/updates";
import { settingsMenu } from "./settingsMenu";

// This is the "Application" menu, which is only used on macOS
export const appMenuTemplate: MenuItemConstructorOptions = {
  label: "Android Messages",
  submenu: [
    aboutMenuItem,
    checkForUpdatesMenuItem,
    separator,
    {
      role: "close",
    },
    settingsMenu,
    separator,
    {
      label: "Hide Android Messages Desktop",
      accelerator: "Command+H",
      click: (): void => app.hide(),
    },
    separator,
    {
      label: "Quit",
      accelerator: "Command+Q",
      click: (): void => app.quit(),
    },
  ],
};
