import { autoUpdater } from 'electron-updater';

export const checkForUpdatesMenuItem = {
    label: 'Check for Updates',
    click: () => {
        autoUpdater.checkForUpdatesAndNotify();
    }
};
