import env from 'env';
import path from 'path';

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
const BASE_APP_PATH = IS_DEV ? path.join(__dirname, '..') : process.resourcesPath;
const RESOURCES_PATH = path.join(BASE_APP_PATH, 'resources');
const SPELLING_DICTIONARIES_PATH = path.join(RESOURCES_PATH, 'dictionaries');
const SUPPORTED_LANGUAGES_PATH = path.join(SPELLING_DICTIONARIES_PATH, 'supported-languages.json');

// Settings
const SETTING_TRAY_ENABLED = 'trayEnabledPref';
const SETTING_TRAY_CLICK_SHORTCUT = 'trayClickShortcut';
const SETTING_CUSTOM_WORDS = 'savedCustomDictionaryWords'

// Events
const EVENT_WEBVIEW_NOTIFICATION = 'messages-webview-notification';
const EVENT_NOTIFICATION_REFLECT_READY = 'messages-webview-reflect-ready';
const EVENT_BRIDGE_INIT = 'messages-bridge-init';
const EVENT_SPELL_ADD_CUSTOM_WORD = 'messages-spelling-add-custom-word';
const EVENT_SPELLING_REFLECT_READY = 'messages-spelling-reflect-ready';
const EVENT_UPDATE_USER_SETTING = 'messages-update-user-setting';

// Misc.
const DICTIONARY_CACHE_TIME = 2592000000; // 30 days in milliseconds
const MEDIA_DOWNLOAD_IDENTIFIER = 'isMessagesFileDownloadLink';

export {
    osName,
    osNameFriendly,
    IS_WINDOWS,
    IS_MAC,
    IS_LINUX,
    IS_DEV,
    BASE_APP_PATH,
    RESOURCES_PATH,
    SPELLING_DICTIONARIES_PATH,
    SUPPORTED_LANGUAGES_PATH,
    SETTING_TRAY_ENABLED,
    SETTING_TRAY_CLICK_SHORTCUT,
    SETTING_CUSTOM_WORDS,
    EVENT_WEBVIEW_NOTIFICATION,
    EVENT_NOTIFICATION_REFLECT_READY,
    EVENT_BRIDGE_INIT,
    EVENT_SPELL_ADD_CUSTOM_WORD,
    EVENT_SPELLING_REFLECT_READY,
    EVENT_UPDATE_USER_SETTING,
    DICTIONARY_CACHE_TIME,
    MEDIA_DOWNLOAD_IDENTIFIER
};
