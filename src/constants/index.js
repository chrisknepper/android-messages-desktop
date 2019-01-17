import env from 'env';

const osMap = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
};

// Operating system
const osName = process.platform;
const osNameFriendly = osMap[osName];
const IS_WINDOWS = (osName === 'win32');
const IS_MAC = (osName === 'darwin');
const IS_LINUX = (osName === 'linux');

// Environment
const IS_DEV = (env.name === 'development');

// Settings
const SETTING_TRAY_ENABLED = 'trayEnabledPref';
const SETTING_TRAY_CLICK_SHORTCUT = 'trayClickShortcut';

// Events
const EVENT_WEBVIEW_NOTIFICATION = 'messages-webview-notification';
const EVENT_NOTIFICATION_REFLECT_READY = 'messages-webview-reflect-ready';
const EVENT_BRIDGE_INIT = 'messages-bridge-init';
const EVENT_WINDOWS_LINUX_ONLY_CUSTOM_WORD = 'messages-windows-linux-only-custom-word';
const EVENT_SPELLING_REFLECT_READY = 'messages-spelling-reflect-ready';

export {
    osName,
    osNameFriendly,
    IS_WINDOWS,
    IS_MAC,
    IS_LINUX,
    IS_DEV,
    SETTING_TRAY_ENABLED,
    SETTING_TRAY_CLICK_SHORTCUT,
    EVENT_WEBVIEW_NOTIFICATION,
    EVENT_NOTIFICATION_REFLECT_READY,
    EVENT_BRIDGE_INIT,
    EVENT_WINDOWS_LINUX_ONLY_CUSTOM_WORD,
    EVENT_SPELLING_REFLECT_READY
};
