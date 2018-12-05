import { shell } from 'electron';
import { IS_MAC, IS_WINDOWS } from '../constants';
import { aboutMenuItem } from './items/about';
import { checkForUpdatesMenuItem } from './items/check_for_updates';
import { separator } from './items/separator';

const submenu = [{
    label: 'Learn More',
    click: () => shell.openExternal('https://github.com/chrisknepper/android-messages-desktop/')
},
{
    label: 'Changelog',
    click: () => shell.openExternal('https://github.com/chrisknepper/android-messages-desktop/blob/master/CHANGELOG.md')
}
];

if (IS_WINDOWS) {
    submenu.push(separator);
    submenu.push(checkForUpdatesMenuItem);
}

if (!IS_MAC) {
    submenu.push(separator);
    submenu.push(aboutMenuItem);
}

export const helpMenuTemplate = {
    label: 'Help',
    submenu
};
