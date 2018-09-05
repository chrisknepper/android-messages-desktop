import { app } from 'electron';
import { IS_WINDOWS } from '../constants';
import { checkForUpdatesMenuItem } from './items/check_for_updates';
import { separator } from './items/separator';

const submenu = [{
    label: 'Quit Android Messages',
    click: () => app.quit()
}];

if (!IS_WINDOWS) {
    submenu.unshift(separator);
    submenu.unshift(checkForUpdatesMenuItem);
}

export const fileMenuTemplate = {
    label: 'File',
    submenu
};
