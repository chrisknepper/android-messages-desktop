import { app } from 'electron';
import { IS_MAC } from '../constants';
import { aboutMenu } from './items/about';

// This is the "Application" menu, which is only used on macOS
let appMenuTemplate = null;

if (IS_MAC) {
    appMenuTemplate = {
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
                label: 'Quit',
                accelerator: 'Command+Q',
                click: () => app.quit(),
            }
        ]
    };
}

export { appMenuTemplate };
