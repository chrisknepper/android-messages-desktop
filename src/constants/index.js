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

export {
    osName,
    osNameFriendly,
    IS_WINDOWS,
    IS_MAC,
    IS_LINUX,
    IS_DEV
};
