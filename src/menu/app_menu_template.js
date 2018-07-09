import { app } from 'electron';
import { aboutMenuItem } from './items/about';
import { checkForUpdatesMenuItem } from './items/check_for_updates';

// This is the "Application" menu, which is only used on macOS
export const appMenuTemplate = {
    label: 'Android Messages',
    submenu: [,
        aboutMenuItem,
        {
            type: 'separator',
        },
        checkForUpdatesMenuItem,
        {
            type: 'separator'
        },
        {
            label: 'Hide Android Messages Desktop',
            accelerator: 'Command+H',
            click: () => app.hide()
        },
        {
            type: 'separator',
        },
        {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => app.quit(),
        }
    ]
};
