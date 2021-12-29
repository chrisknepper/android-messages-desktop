import { autoUpdater } from "electron-updater";
import { app, Menu, Notification } from "electron";
import path from "path";
import { IS_DEV, RESOURCES_PATH } from "./constants";
import { settings } from "./settings";

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
  const results = await autoUpdater.checkForUpdates().catch(() => null);
  let isUpdate = false;
  if (results != null) {
    console.log(
      results.updateInfo.version,
      app.getVersion(),
      results.updateInfo.version > app.getVersion()
    );

    isUpdate = results.updateInfo.version > app.getVersion();
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
  }
  const installUpdateMenuItem = Menu.getApplicationMenu()?.getMenuItemById(
    "installUpdateMenuItem"
  );
  if (installUpdateMenuItem != null) {
    installUpdateMenuItem.visible = isUpdate;
  }
  settings.isUpdate.next(isUpdate);
  return isUpdate;
}

/**
 * Checks for update, downloads, quits, and installs app.
 */
export async function installUpdate(): Promise<void> {
  if (!IS_DEV) {
    setUpdaterSettings();
    if (await checkForUpdate(false)) {
      await autoUpdater.downloadUpdate();
      settings.isUpdate.next(false);
      autoUpdater.quitAndInstall();
    }
  }
}
