import { dialog } from 'electron';
import settings from "electron-settings";
import { IS_MAC, SETTING_TRAY_ENABLED, IS_LINUX } from '../constants';

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
      id: 'startInTrayMenuItem',
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
        const trayEnabledPref = !settings.get(SETTING_TRAY_ENABLED);
        let confirmClose = true;
        if (IS_LINUX && !trayEnabledPref) {
          let dialogAnswer = dialog.showMessageBox({
            type: 'question',
            buttons: ['Restart', 'Cancel'],
            title: 'App Restart Required',
            message: 'Changing this setting requires Android Messages to be restarted.\n\nUnsent text messages may be deleted. Click Restart to apply this setting change and restart Android Messages.'
          });
          if (dialogAnswer === 1) {
            confirmClose = true;
            item.checked = true; // Don't incorrectly flip checkmark if user canceled the dialog
          }
        }

        if (confirmClose) {
          settings.set(SETTING_TRAY_ENABLED, trayEnabledPref);
          item.checked = trayEnabledPref;
        }
      }
    }
  ]
};
