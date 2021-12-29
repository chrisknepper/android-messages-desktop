import { app, MenuItemConstructorOptions } from "electron";
import { IS_MAC } from "../helpers/constants";
import { getMainWindow } from "../helpers/getMainWindow";
import { separator } from "./items/separator";

export const trayMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: "Show/Hide Android Messages",
    click: (): void => {
      const mainWindow = getMainWindow();
      if (mainWindow != null) {
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
  separator,
  {
    label: "Quit Android Messages",
    click: (): void => {
      app.quit();
    },
  },
];
