import { shell } from 'electron';
import { IS_MAC } from '../constants';
import { aboutMenuItem } from './items/about';

export const helpMenuTemplate = {
  label: 'Help',
  submenu: [
    {
        label: 'Learn More',
        click: () => shell.openExternal('https://github.com/chrisknepper/android-messages-desktop/')
    },
    {
        label: 'Changelog',
        click: () => shell.openExternal('https://github.com/chrisknepper/android-messages-desktop/blob/master/CHANGELOG.md')
    }
  ]
};

if (!IS_MAC) {
    helpMenuTemplate.submenu.push(aboutMenuItem);
}
