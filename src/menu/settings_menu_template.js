import { dialog } from 'electron';
import settings from "electron-settings";
import { separator } from './items/separator';
import { IS_LINUX, IS_MAC, IS_WINDOWS, SETTING_TRAY_ENABLED, SETTING_TRAY_CLICK_SHORTCUT } from '../constants';

export const settingsMenu = {
  label: IS_MAC ? 'Preferences' : 'Settings',
  submenu: [
    {
      // This option doesn't apply to Mac, so this hides it but keeps the order of menu items
      // to make updating based on array indices easier.
      visible: (!IS_MAC),
      id: 'autoHideMenuBarMenuItem',
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
      id: 'enableTrayIconMenuItem',
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
            confirmClose = false;
            item.checked = true; // Don't incorrectly flip checkmark if user canceled the dialog
          }
        }

        if (confirmClose) {
          settings.set(SETTING_TRAY_ENABLED, trayEnabledPref);
          item.checked = trayEnabledPref;
        }
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
    }
  ]
};

// Electron doesn't seem to support the visible property for submenus, so push it instead of hiding it in non-Windows
// See: https://github.com/electron/electron/issues/8703
if (IS_WINDOWS) {
  settingsMenu.submenu.push(
    {
      id: 'trayClickShortcutMenuItem',
      label: 'Open from Tray On...',
      submenu: [
        {
          label: 'Double-click',
          type: 'radio',
          click: (item) => {
            settings.set(SETTING_TRAY_CLICK_SHORTCUT, 'double-click');
            item.checked = true;
          }
        },
        {
          label: 'Single-click',
          type: 'radio',
          click: (item) => {
            settings.set(SETTING_TRAY_CLICK_SHORTCUT, 'click');
            item.checked = true;
          }
        }
      ]
    }
  );
}

settingsMenu.submenu.push(
  separator,
  {
    id: 'notificationSoundEnabledMenuItem',
    label: 'Play Notification Sound',
    type: 'checkbox',
    click: (item) => {
      settings.set('notificationSoundEnabledPref', item.checked);
    }
  },
  separator,
  {
    id: 'pressEnterToSendMenuItem',
    label: 'Press Enter to Send Message',
    type: 'checkbox',
    click: (item) => {
      settings.set('pressEnterToSendPref', item.checked);
    }
  }
);


