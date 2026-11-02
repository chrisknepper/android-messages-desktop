import { MenuItemConstructorOptions } from "electron";
import { IS_MAC } from "../helpers/constants";
import { appMenuTemplate } from "./appMenu";
import { editMenuTemplate } from "./editMenu";
import { fileMenuTemplate } from "./fileMenu";
import { settingsMenu } from "./settingsMenu";
import { viewMenuTemplate } from "./viewMenu";
import { windowMenuTemplate } from "./windowMenu";

const baseMenuTemplate: MenuItemConstructorOptions[] = [
  editMenuTemplate,
  viewMenuTemplate,
  windowMenuTemplate,
];

if (IS_MAC) {
  baseMenuTemplate.unshift(appMenuTemplate);
} else {
  baseMenuTemplate.unshift(fileMenuTemplate);
  baseMenuTemplate.push(settingsMenu);
}

export { baseMenuTemplate };
