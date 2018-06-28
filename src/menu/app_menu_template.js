import { app } from 'electron';
import { aboutMenu } from './items/about';

// This is the "Application" menu, which is only used on macOS
export const appMenuTemplate = {
    label: 'Android Messages',
    submenu: [,
        {
            label: 'About Android Messages Desktop',
            click: () => aboutMenu()
        },
        {
            type: 'separator',
        },
        {
            label: 'Hide Android Messages Desktop',
            accelerator: 'Command+H',
            click: () => app.mainWindow && app.mainWindow.hide()
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
