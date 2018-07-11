import { appMenuTemplate } from './app_menu_template';
import { fileMenuTemplate } from './file_menu_template';
import { editMenuTemplate } from './edit_menu_template';
import { windowMenuTemplate } from './window_menu_template';
import { settingsMenu } from './settings_menu_template';
import { IS_MAC } from '../constants';


const baseMenuTemplate = [editMenuTemplate, windowMenuTemplate];

if (IS_MAC) {
    baseMenuTemplate.unshift(appMenuTemplate);
} else {
    baseMenuTemplate.unshift(fileMenuTemplate);
    baseMenuTemplate.push(settingsMenu);
}

export { baseMenuTemplate };
