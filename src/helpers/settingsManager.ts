import settings from "electron-settings";
import {
  SETTING_AUTOHIDE_MENU,
  SETTING_ENTER_TO_SEND,
  SETTING_HIDE_NOTIFICATION,
  SETTING_NOTIFICATION_SOUND,
  SETTING_START_IN_TRAY,
  SETTING_SYSTEM_DARK_MODE,
} from "./constants";

export class SettingsManager {
  public startInTray = settings.get(SETTING_START_IN_TRAY, false) as boolean;
  public autoHideMenu = settings.get(SETTING_AUTOHIDE_MENU, false) as boolean;
  public enterToSend = settings.get(SETTING_ENTER_TO_SEND, true) as boolean;

  public notificationSound = settings.get(
    SETTING_NOTIFICATION_SOUND,
    true
  ) as boolean;
  public hideNotificationContent = settings.get(
    SETTING_HIDE_NOTIFICATION,
    false
  ) as boolean;
  public systemDarkMode = settings.get(
    SETTING_SYSTEM_DARK_MODE,
    true
  ) as boolean;

  private watchers: Set<string> = new Set();

  constructor() {
    this.addWatcher<boolean>(
      SETTING_START_IN_TRAY,
      (newVal) => (this.startInTray = newVal)
    );
    this.addWatcher<boolean>(
      SETTING_AUTOHIDE_MENU,
      (newVal) => (this.autoHideMenu = newVal)
    );
    this.addWatcher<boolean>(
      SETTING_ENTER_TO_SEND,
      (newVal) => (this.enterToSend = newVal)
    );
    this.addWatcher<boolean>(
      SETTING_NOTIFICATION_SOUND,
      (newVal) => (this.notificationSound = newVal)
    );
    this.addWatcher<boolean>(
      SETTING_HIDE_NOTIFICATION,
      (newVal) => (this.hideNotificationContent = newVal)
    );
    this.addWatcher<boolean>(
      SETTING_SYSTEM_DARK_MODE,
      (newVal) => (this.systemDarkMode = newVal)
    );
  }

  public addWatcher<T>(name: string, callback: (newVal: T) => unknown): void {
    settings.watch(name, callback);
    this.watchers.add(name);
  }

  public clearWatchers(): void {
    this.watchers.forEach((name) => settings.removeAllListeners(name));
  }
}
