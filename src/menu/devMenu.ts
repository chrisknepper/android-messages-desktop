import { app, MenuItemConstructorOptions } from "electron";
import { settings } from "../helpers/settings";

const { showBridgeWebtoolsOnLaunch } = settings;

export const devMenuTemplate: MenuItemConstructorOptions = {
  label: "&Development",
  submenu: [
    {
      label: "Reload",
      accelerator: "CmdOrCtrl+R",
      click: (): void => app.mainWindow?.webContents.reloadIgnoringCache(),
    },
    {
      label: "Bridge Dev Tools on Launch",
      type: "checkbox",
      checked: showBridgeWebtoolsOnLaunch.value,
      click: (item) => showBridgeWebtoolsOnLaunch.next(item.checked),
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
