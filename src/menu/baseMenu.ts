import { appMenuTemplate } from "./appMenu";
import { fileMenuTemplate } from "./fileMenu";
import { editMenuTemplate } from "./editMenu";
import { settingsMenu } from "./settingsMenu";
import { viewMenuTemplate } from "./viewMenu";
import { windowMenuTemplate } from "./windowMenu";
import { IS_MAC } from "../helpers/constants";
import { MenuItemConstructorOptions } from "electron";

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
