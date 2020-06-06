import { app } from "electron";

export const devMenuTemplate = {
  label: "Development",
  submenu: [
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: (): void => app.mainWindow?.webContents.reloadIgnoringCache(),
    },
    {
      label: "Developer Tools",
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
