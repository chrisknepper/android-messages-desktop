import { app } from 'electron';
import { checkForUpdatesMenuItem } from './items/check_for_updates';

export const fileMenuTemplate = {
    label: 'File',
    submenu: [
        checkForUpdatesMenuItem,
        {
            type: 'separator'
        },
        {
            label: 'Quit Android Messages',
            click: () => app.quit()
        }
    ]
};
