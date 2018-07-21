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

// Events
const EVENT_WEBVIEW_NOTIFICATION = 'messages-webview-notification';

export {
    osName,
    osNameFriendly,
    IS_WINDOWS,
    IS_MAC,
    IS_LINUX,
    IS_DEV,
    SETTING_TRAY_ENABLED,
    EVENT_WEBVIEW_NOTIFICATION
};
