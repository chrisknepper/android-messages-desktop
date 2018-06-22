import { appMenuTemplate } from './app_menu_template';
import { editMenuTemplate } from './edit_menu_template';
import { IS_MAC } from '../constants';

const baseMenuTemplate = [editMenuTemplate];

if (IS_MAC) {
    baseMenuTemplate.unshift(appMenuTemplate);
}

export { baseMenuTemplate };
