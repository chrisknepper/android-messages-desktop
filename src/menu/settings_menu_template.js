import settings from "electron-settings";
import { IS_MAC } from '../constants';

export const settingsMenu = {
  label: IS_MAC ? 'Preferences' : 'Settings',
  submenu: [
    {
      // This option doesn't apply to Mac, so this hides it but keeps the order of menu items
      // to make updating based on array indices easier.
      visible: (!IS_MAC),
      label: 'Auto Hide Menu Bar',
      type: 'checkbox',
      click: (item, window) => {
        const autoHideMenuPref = !settings.get('autoHideMenuPref');
        settings.set('autoHideMenuPref', autoHideMenuPref);
        item.checked = autoHideMenuPref;
        window.setAutoHideMenuBar(autoHideMenuPref);
      }
    },
    {
      enabled: true,
      label: IS_MAC ? 'Start Hidden' : 'Start In Tray',
      type: 'checkbox',
      click: (item) => {
        const startInTrayPref = !settings.get('startInTrayPref');
        settings.set('startInTrayPref', startInTrayPref);
        item.checked = startInTrayPref;
      }
    },
    {
      label: IS_MAC ? 'Enable Menu Bar Icon' : 'Enable Tray Icon',
      type: 'checkbox',
      click: (item) => {
        const trayEnabledPref = !settings.get('trayEnabledPref');
        settings.set('trayEnabledPref', trayEnabledPref);
        item.checked = trayEnabledPref;
        //window.setAutoHideMenuBar(trayEnabledPref);
      }
    }
  ]
};
