import * as process from "process";
import * as path from "path";
import { app } from "electron";

export const osMap = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux",
  aix: "AIX",
  android: "Android",
  freebsd: "FreeBSD",
  openbsd: "OpenBSD",
  sunos: "SunOS",
  cygwin: "CygWin",
  netbsd: "NetBSD",
};

// Operating system
export const osName = process.platform;
export const osNameFriendly = osMap[osName];
export const IS_WINDOWS = osName === "win32";
export const IS_MAC = osName === "darwin";
export const IS_LINUX = osName === "linux";

// Environment and paths
export const IS_DEV = process.env.NODE_ENV === "development";
export const BASE_APP_PATH = path.resolve(__dirname, "..");
export const RESOURCES_PATH = path.resolve(BASE_APP_PATH, "resources");
export const USER_DATA_PATH = (): string => app.getPath("userData"); // This has to be a function call because app.ready callback must be fired before this path can be used
export const SPELLING_DICTIONARIES_PATH = (): string =>
  path.resolve(USER_DATA_PATH(), "dictionaries");

// Settings
export const SETTING_TRAY_ENABLED = "trayEnabledPref";
export const SETTING_CUSTOM_WORDS = "savedCustomDictionaryWords";

// Events
export const EVENT_WEBVIEW_NOTIFICATION = "messages-webview-notification";
export const EVENT_NOTIFICATION_REFLECT_READY =
  "messages-webview-reflect-ready";
export const EVENT_BRIDGE_INIT = "messages-bridge-init";
export const EVENT_SPELL_ADD_CUSTOM_WORD = "messages-spelling-add-custom-word";
export const EVENT_SPELLING_REFLECT_READY = "messages-spelling-reflect-ready";
export const EVENT_UPDATE_USER_SETTING = "messages-update-user-setting";

// Misc.
export const DICTIONARY_CACHE_TIME = 2592000000; // 30 days in milliseconds
