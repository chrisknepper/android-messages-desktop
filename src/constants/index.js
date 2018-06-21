const osMap = {
    win32: "Windows",
    darwin: "macOS",
    linux: "Linux"
};

const osName = process.platform;
const osNameFriendly = osMap[osName];
const IS_WINDOWS = osName === 'win32';
const IS_MAC = osName === 'darwin';
const IS_LINUX = osName === 'linux';

export { osName, osNameFriendly, IS_WINDOWS, IS_MAC, IS_LINUX };
