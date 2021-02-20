import { autoUpdater } from "electron-updater";
import { app, Notification } from "electron";
import path from "path";
import { RESOURCES_PATH } from "./constants";

function setUpdaterSettings(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
}

/**
 * Returns true if there is an update.
 */
export async function checkForUpdate(
  showNotification: boolean
): Promise<boolean> {
  setUpdaterSettings();
  const results = await autoUpdater.checkForUpdates();
  const isUpdate = results.updateInfo.version != app.getVersion();
  if (isUpdate && showNotification) {
    const notification = new Notification({
      title: "Update Available",
      body:
        'There is an update available. Click "Install Update"' +
        " in the file or app menu.",
      icon: path.resolve(RESOURCES_PATH, "icons", "64x64.png"),
    });
    notification.show();
  }
  return isUpdate;
}

/**
 * Checks for update, downloads, quits, and installs app.
 */
export async function installUpdate(): Promise<void> {
  setUpdaterSettings();
  if (await checkForUpdate(false)) {
    await autoUpdater.downloadUpdate();
    autoUpdater.quitAndInstall();
  }
}
