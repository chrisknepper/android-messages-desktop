import { BehaviorSubject } from "rxjs";
import jetpack from "fs-jetpack";
import { SETTINGS_FILE } from "./constants";

export type BoolSetting = BehaviorSubject<boolean>;
export type StringSetting = BehaviorSubject<string>;
export type NumSetting = BehaviorSubject<number>;

function getSetting(key: string): unknown | undefined {
  return (jetpack.read(SETTINGS_FILE(), "json") || {})[key];
}

/**
 *
 * initial must be a json serializable type
 *
 * @param key name of setting
 * @param initial initial value if unset
 */
function createSetting<T>(key: string, initial: T): BehaviorSubject<T> {
  const savedVal = getSetting(key);
  const val = savedVal != null ? savedVal : initial;
  return new BehaviorSubject(val) as BehaviorSubject<T>;
}

export const trayEnabled = createSetting("trayEnabled", false);

export const notificationSoundEnabled = createSetting(
  "notificationSoundEnabled",
  false
);
export const hideNotificationContentEnabled = createSetting(
  "hideNotificationContentEnabled",
  false
);
export const respectSystemDarkModeEnabled = createSetting(
  "respectSystemDarkModeEnabled",
  true
);
export const startInTrayEnabled = createSetting("startInTrayEnabled", false);
export const autoHideMenuEnabled = createSetting("autoHideMenuEnabled", false);
export const seenMinimizeToTrayWarning = createSetting(
  "seenMinimizeToTrayWarning",
  false
);
export const seenResetSettingsWarning = createSetting(
  "seenResetSettingsWarning",
  false
);

export interface Settings {
  trayEnabled: BoolSetting;
  notificationSoundEnabled: BoolSetting;
  hideNotificationContentEnabled: BoolSetting;
  respectSystemDarkModeEnabled: BoolSetting;
  startInTrayEnabled: BoolSetting;
  autoHideMenuEnabled: BoolSetting;
  seenMinimizeToTrayWarning: BoolSetting;
  seenResetSettingsWarning: BoolSetting;
}

export const settings: Settings = {
  trayEnabled,
  notificationSoundEnabled,
  hideNotificationContentEnabled,
  respectSystemDarkModeEnabled,
  startInTrayEnabled,
  autoHideMenuEnabled,
  seenMinimizeToTrayWarning,
  seenResetSettingsWarning,
};

if (!jetpack.exists(SETTINGS_FILE())) {
  jetpack.write(SETTINGS_FILE(), {});
}

Object.entries(settings).forEach(([name, setting]) => {
  setting.subscribe((val: boolean) => {
    const data = jetpack.read(SETTINGS_FILE(), "json") || {};
    data[name] = val;
    jetpack.write(SETTINGS_FILE(), data);
  });
});
