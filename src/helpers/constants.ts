import process from "process";
import path from "path";

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
const OS_NAME = process.platform;
export const OS_NAME_FRIENDLY = osMap[OS_NAME];
export const IS_WINDOWS = OS_NAME === "win32";
export const IS_MAC = OS_NAME === "darwin";
export const IS_LINUX = OS_NAME === "linux";

// Environment and paths
export const IS_DEV = process.env.NODE_ENV === "development";
export const BASE_APP_PATH = path.resolve(__dirname, "..");
export const RESOURCES_PATH = path.resolve(BASE_APP_PATH, "resources");

// Events
export const EVENT_BRIDGE_INIT = "messages-bridge-init";
