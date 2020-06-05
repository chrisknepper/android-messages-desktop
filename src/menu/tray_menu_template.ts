import { app, MenuItemConstructorOptions, BrowserWindow } from "electron";
import { IS_MAC } from "../constants";

type TOFIX = any;

export const trayMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: "Show/Hide Android Messages",
    click: (): void => {
      const mainWindow: BrowserWindow = (app as TOFIX).mainWindow;
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          if (IS_MAC) {
            app.hide();
          } else {
            mainWindow.hide();
          }
        } else {
          mainWindow.show();
        }
      }
    },
  },
  {
    type: "separator",
  },
  {
    label: "Quit Android Messages",
    click: (): void => {
      app.quit();
    },
  },
];
