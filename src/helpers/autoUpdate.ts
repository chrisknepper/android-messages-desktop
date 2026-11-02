import { autoUpdater } from "electron-updater";
import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import { IS_DEV, RESOURCES_PATH } from "./constants";

// Updates are fully manual: we never download or install without the user
// asking. The flow below drives everything off electron-updater's events so we
// can surface progress and errors instead of failing silently.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

const icon = (): string => path.resolve(RESOURCES_PATH, "icons", "64x64.png");

// The window used to parent update dialogs and show download progress in the
// dock/taskbar. Set once the main window exists.
let updateWindow: BrowserWindow | null = null;
export function setUpdateWindow(win: BrowserWindow): void {
  updateWindow = win;
}

// Whether the in-flight check was triggered explicitly by the user (a menu
// item) rather than the silent check on launch. Both surface the "update
// available" dialog; only interactive checks also surface "up to date" and
// error states, so a launch with no network doesn't pop dialogs.
let interactiveCheck = false;
// Guards against overlapping checks/downloads if the user clicks repeatedly.
let busy = false;

function showDialog(
  options: Electron.MessageBoxOptions
): Promise<Electron.MessageBoxReturnValue> {
  return updateWindow
    ? dialog.showMessageBox(updateWindow, options)
    : dialog.showMessageBox(options);
}

function setProgress(fraction: number): void {
  // -1 removes the progress bar.
  updateWindow?.setProgressBar(fraction);
}

function reportError(err: unknown): void {
  setProgress(-1);
  busy = false;
  console.error("Update error:", err);
  if (interactiveCheck) {
    showDialog({
      type: "error",
      title: "Update Error",
      message: "Couldn't complete the update.",
      detail: err instanceof Error ? err.message : String(err),
      icon: icon(),
    });
  }
}

autoUpdater.on("update-not-available", () => {
  busy = false;
  if (interactiveCheck) {
    showDialog({
      type: "info",
      title: "No Update Found",
      message: "You're up to date.",
      detail: `Android Messages Desktop ${app.getVersion()} is the latest version.`,
      icon: icon(),
    });
  }
});

autoUpdater.on("update-available", async (info) => {
  const { response } = await showDialog({
    type: "info",
    buttons: ["Download & Install", "Later"],
    defaultId: 0,
    cancelId: 1,
    title: "Update Available",
    message: `Version ${info.version} is available.`,
    detail: `You're on ${app.getVersion()}. Download and install it now? The app will restart to finish.`,
    icon: icon(),
  });

  if (response === 0) {
    setProgress(2); // indeterminate until the first progress event arrives
    autoUpdater.downloadUpdate().catch(reportError);
  } else {
    busy = false;
  }
});

autoUpdater.on("download-progress", (progress) => {
  setProgress(progress.percent / 100);
});

autoUpdater.on("update-downloaded", async (info) => {
  setProgress(-1);
  const { response } = await showDialog({
    type: "info",
    buttons: ["Restart Now", "Later"],
    defaultId: 0,
    cancelId: 1,
    title: "Update Ready",
    message: `Version ${info.version} has been downloaded.`,
    detail:
      "Restart now to finish installing, or it will be installed the next time you quit.",
    icon: icon(),
  });

  if (response === 0) {
    autoUpdater.quitAndInstall();
  } else {
    // Install on next quit so the download isn't wasted.
    autoUpdater.autoInstallOnAppQuit = true;
    busy = false;
  }
});

/**
 * Checks for an update and, if found, walks the user through downloading and
 * installing it.
 *
 * @param interactive true when the user explicitly asked (shows "up to date"
 *   and error dialogs); false for the silent check on launch.
 */
export function checkForUpdate(interactive: boolean): void {
  if (IS_DEV || busy) {
    return;
  }
  interactiveCheck = interactive;
  busy = true;
  autoUpdater.checkForUpdates().catch(reportError);
}
