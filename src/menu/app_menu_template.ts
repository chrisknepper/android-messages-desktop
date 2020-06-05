import { app, MenuItemConstructorOptions } from "electron";
import { aboutMenuItem } from "./items/about";
import { checkForUpdatesMenuItem } from "./items/check_for_updates";
import { settingsMenu } from "./settings_menu_template";

// This is the "Application" menu, which is only used on macOS
export const appMenuTemplate: MenuItemConstructorOptions = {
  label: "Android Messages",
  submenu: [
    aboutMenuItem,
    checkForUpdatesMenuItem,
    {
      type: "separator",
    },
    settingsMenu,
    {
      type: "separator",
    },
    {
      label: "Hide Android Messages Desktop",
      accelerator: "Command+H",
      click: (): void => app.hide(),
    },
    {
      type: "separator",
    },
    {
      label: "Quit",
      accelerator: "Command+Q",
      click: (): void => app.quit(),
    },
  ],
};
