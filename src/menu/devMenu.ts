import { app, MenuItemConstructorOptions } from "electron";
import { getMainWindow } from "../helpers/getMainWindow";

export const devMenuTemplate: MenuItemConstructorOptions = {
  label: "&Development",
  submenu: [
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: (): void => getMainWindow()?.webContents.reloadIgnoringCache(),
    },
    {
      label: "Development Tools",
      accelerator: "CmdOrCtrl+Shift+I",
      click: (): void => getMainWindow()?.webContents.toggleDevTools(),
    },
    {
      label: "Quit",
      accelerator: "CmdOrCtrl+Q",
      click: (): void => app.quit(),
    },
  ],
};
