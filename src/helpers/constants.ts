import process from "process";
import path from "path";
import { app } from "electron";

// Operating system
const OS_NAME = process.platform;
export const IS_WINDOWS = OS_NAME === "win32";
export const IS_MAC = OS_NAME === "darwin";
export const IS_LINUX = OS_NAME === "linux";

// Environment and paths
export const IS_DEV = process.env.NODE_ENV == "development";
export const BASE_APP_PATH = path.resolve(__dirname, "..");
export const RESOURCES_PATH = path.resolve(BASE_APP_PATH, "resources");
// needs to be a function because app is not initialized yet otherwise?
export const SETTINGS_FILE = (): string => {
  return path.resolve(app.getPath("userData"), `settings.json`);
};

// Tray
/**
 * Logical size (in points) that recent-conversation avatars are resized to in
 * the tray menu so every row has a uniform, compact height.
 */
export const TRAY_AVATAR_SIZE = 28;

// UUID
/**
 * An arbitrary v4 uuid generated on https://www.uuidgenerator.net/version4
 */
export const UUID_NAMESPACE = "ddf09da3-3df8-4417-ae3b-62d3ed4bfb72";

export { INITIAL_ICON_IMAGE } from "./constants_shared";
