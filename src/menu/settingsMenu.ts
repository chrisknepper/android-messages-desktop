import { BrowserWindow, MenuItem, MenuItemConstructorOptions } from "electron";
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
  monochromeIconEnabled,
  showIconsInRecentConversationTrayEnabled,
  trayIconRedDotEnabled,
  taskbarFlashEnabled,
} = settings;

export const settingsMenu: MenuItemConstructorOptions = {
  label: IS_MAC ? "&Preferences" : "&Settings",
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
      ...separator,
      visible: !IS_MAC,
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
    {
      id: "monochromeIconEnabledMenuItem",
      label: "Use Monochrome Tray Icon",
      type: "checkbox",
      checked: monochromeIconEnabled.value,
      enabled: trayEnabled.value,
      click: (item) => monochromeIconEnabled.next(item.checked),
    },
    {
      id: "showIconsInRecentConversationTrayEnabledMenuItem",
      label: "Show Icons in Tray Menu",
      type: "checkbox",
      checked: showIconsInRecentConversationTrayEnabled.value,
      enabled: trayEnabled.value,
      click: (item) =>
        showIconsInRecentConversationTrayEnabled.next(item.checked),
    },
    {
      id: "trayIconRedDotEnabledMenuItem",
      label: "Show Red Dot for Unread Messages",
      type: "checkbox",
      checked: trayIconRedDotEnabled.value,
      enabled: trayEnabled.value,
      click: (item) => trayIconRedDotEnabled.next(item.checked),
    },
    separator,
    {
      id: "hideNotificationContentMenuItem",
      label: "Hide Notification Content",
      type: "checkbox",
      checked: hideNotificationContentEnabled.value,
      click: (item) => hideNotificationContentEnabled.next(item.checked),
    },
    {
      id: "taskbarFlashEnabledMenuItem",
      label: "Taskbar Flash on New Message",
      type: "checkbox",
      checked: taskbarFlashEnabled.value,
      click: (item) => taskbarFlashEnabled.next(item.checked),
    },
    separator,
    {
      id: "checkForUpdateOnLaunchEnabledMenuItem",
      label: "Check for Update on Launch",
      type: "checkbox",
      checked: checkForUpdateOnLaunchEnabled.value,
      click: (item) => checkForUpdateOnLaunchEnabled.next(item.checked),
    },
  ],
};
