import { appMenuTemplate } from './app_menu_template';
import { editMenuTemplate } from './edit_menu_template';
import { settingsMenu } from './settings_menu_template';
import { IS_MAC } from '../constants';


const baseMenuTemplate = [editMenuTemplate];

if (IS_MAC) {
    baseMenuTemplate.unshift(appMenuTemplate);
} else {
    baseMenuTemplate.push(settingsMenu)
}

export { baseMenuTemplate };
