import {
  BrowserWindow,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
} from "electron";
import { IS_MAC } from "../helpers/constants";
import { settings } from "../helpers/settings";
import { separator } from "./items/separator";

// bring the settings into scope
const {
  autoHideMenuEnabled,
  trayEnabled,
  startInTrayEnabled,
  hideNotificationContentEnabled,
  checkForUpdateOnLaunchEnabled,
} = settings;

export const settingsMenu: MenuItemConstructorOptions = {
  label: IS_MAC ? "&Preferences" : "&Settings",
  accelerator: IS_MAC ? "Alt+P" : "Alt+S",
  submenu: [
    {
      // This option doesn't apply to Mac, so this hides it but keeps the order of menu items
      // to make updating based on array indices easier.
      visible: !IS_MAC,
      id: "autoHideMenuBarMenuItem",
      label: "Auto Hide Menu Bar",
      type: "checkbox",
      checked: autoHideMenuEnabled.value,
      click: (item: MenuItem, window?: BrowserWindow): void => {
        autoHideMenuEnabled.next(item.checked);
        window?.setMenuBarVisibility(!autoHideMenuEnabled.value);
        window?.setAutoHideMenuBar(autoHideMenuEnabled.value);
      },
    },
    {
      id: "enableTrayIconMenuItem",
      label: IS_MAC ? "Enable Menu Bar Icon" : "Enable Tray Icon",
      type: "checkbox",
      checked: trayEnabled.value,
      click: async (item: MenuItem): Promise<void> =>
        trayEnabled.next(item.checked),
    },
    {
      id: "startInTrayMenuItem",
      label: IS_MAC ? "Start Hidden" : "Start In Tray",
      type: "checkbox",
      checked: startInTrayEnabled.value,
      enabled: trayEnabled.value,
      click: (item: MenuItem): void => startInTrayEnabled.next(item.checked),
    },
  ],
};

if (settingsMenu.submenu != null && !(settingsMenu.submenu instanceof Menu)) {
  // Electron doesn't seem to support the visible property for submenus, so push it instead of hiding it in non-Windows
  // See: https://github.com/electron/electron/issues/8703

  settingsMenu.submenu.push(
    separator,
    {
      id: "hideNotificationContentMenuItem",
      label: "Hide Notification Content",
      type: "checkbox",
      checked: notificationSoundEnabled.value,
      click: (item) => hideNotificationContentEnabled.next(item.checked),
    },
    separator,
    {
      id: "checkForUpdateOnLaunchEnabledMenuItem",
      label: "Check for Update on Launch",
      type: "checkbox",
      checked: checkForUpdateOnLaunchEnabled.value,
      click: (item) => checkForUpdateOnLaunchEnabled.next(item.checked),
    }
  );
}
