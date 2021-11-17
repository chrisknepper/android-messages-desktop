import { app, MenuItemConstructorOptions } from "electron";

export const devMenuTemplate: MenuItemConstructorOptions = {
  label: "&Development",
  submenu: [
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: (): void => app.mainWindow?.webContents.reloadIgnoringCache(),
    },
    {
      label: "App Dev Tools",
      accelerator: "CmdOrCtrl+Shift+I",
      click: (): void => app.mainWindow?.webContents.openDevTools(),
    },
    {
      label: "Quit",
      accelerator: "CmdOrCtrl+Q",
      click: (): void => app.quit(),
    },
  ],
};
