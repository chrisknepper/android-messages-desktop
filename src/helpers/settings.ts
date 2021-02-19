import { BehaviorSubject } from "rxjs";
import jetpack from "fs-jetpack";

const settingsFile = "settings.json";

function getSetting(key: string): boolean | undefined {
  return (jetpack.read(settingsFile, "json") || {})[key];
}

type Setting = BehaviorSubject<boolean>;
/**
 *
 * initial must be a json serializable type
 *
 * @param key name of setting
 * @param initial initial value if unset
 */
function createSetting(key: string, initial: boolean): Setting {
  const savedVal = getSetting(key);
  const val = savedVal != null ? savedVal : initial;
  return new BehaviorSubject(val);
}

export const trayEnabled = createSetting("trayEnabled", false);

export const notificationSoundEnabled = createSetting(
  "notificationSoundEnabled",
  false
);
export const enterToSendEnabled = createSetting("enterToSendEnabled", true);
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

export interface Settings {
  trayEnabled: Setting;
  notificationSoundEnabled: Setting;
  enterToSendEnabled: Setting;
  hideNotificationContentEnabled: Setting;
  respectSystemDarkModeEnabled: Setting;
  startInTrayEnabled: Setting;
  autoHideMenuEnabled: Setting;
  seenMinimizeToTrayWarning: Setting;
}

export const settings: Settings = {
  trayEnabled,
  notificationSoundEnabled,
  enterToSendEnabled,
  hideNotificationContentEnabled,
  respectSystemDarkModeEnabled,
  startInTrayEnabled,
  autoHideMenuEnabled,
  seenMinimizeToTrayWarning,
};

if (!jetpack.exists(settingsFile)) {
  jetpack.write(settingsFile, {});
}

Object.entries(settings).forEach(([name, setting]) => {
  setting.subscribe((val: boolean) => {
    const data = jetpack.read(settingsFile, "json") || {};
    data[name] = val;
    jetpack.write(settingsFile, data);
  });
});
