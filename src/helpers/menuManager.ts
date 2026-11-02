import { Menu } from "electron";
import { baseMenuTemplate } from "../menu/baseMenu";
import { devMenuTemplate } from "../menu/devMenu";
import { helpMenuTemplate } from "../menu/helpMenu";
import { IS_DEV } from "./constants";

export class MenuManager {
  private applicationMenu: null | Menu;
  constructor() {
    const menus = baseMenuTemplate;
    if (IS_DEV) {
      menus.push(devMenuTemplate);
    }
    menus.push(helpMenuTemplate);
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
    this.applicationMenu = Menu.getApplicationMenu();
  }
}
