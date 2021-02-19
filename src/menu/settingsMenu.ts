import {
  BrowserWindow,
  dialog,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
} from "electron";
import { IS_LINUX, IS_MAC } from "../helpers/constants";
import {
  autoHideMenuEnabled,
  hideNotificationContentEnabled,
  notificationSoundEnabled,
  startInTrayEnabled,
  trayEnabled,
} from "../helpers/settings";
import { separator } from "./items/separator";

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
      click: (item: MenuItem, window?: BrowserWindow): void => {
        autoHideMenuEnabled.next(item.checked);
        window?.setMenuBarVisibility(autoHideMenuEnabled.value);
        window?.setAutoHideMenuBar(autoHideMenuEnabled.value);
      },
    },
    {
      id: "enableTrayIconMenuItem",
      label: IS_MAC ? "Enable Menu Bar Icon" : "Enable Tray Icon",
      type: "checkbox",
      click: async (item: MenuItem): Promise<void> => {
        let confirmClose = true;
        if (IS_LINUX && !trayEnabled.value) {
          const dialogAnswer = await dialog.showMessageBox({
            type: "question",
            buttons: ["Restart", "Cancel"],
            title: "App Restart Required",
            message:
              "Changing this setting requires Android Messages to be restarted.\n\nUnsent text messages may be deleted. Click Restart to apply this setting change and restart Android Messages.",
          });
          if (dialogAnswer.response === 1) {
            confirmClose = false;
            item.checked = true; // Don't incorrectly flip checkmark if user canceled the dialog
          }
        }

        if (confirmClose) {
          trayEnabled.next(item.checked);
        }
      },
    },
    {
      id: "startInTrayMenuItem",
      label: IS_MAC ? "Start Hidden" : "Start In Tray",
      type: "checkbox",
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
      id: "notificationSoundEnabledMenuItem",
      label: "Play Notification Sound",
      type: "checkbox",
      click: (item) => notificationSoundEnabled.next(item.checked),
    },
    separator,
    {
      id: "hideNotificationContentMenuItem",
      label: "Hide Notification Content",
      type: "checkbox",
      click: (item) => hideNotificationContentEnabled.next(item.checked),
    }
  );
}
