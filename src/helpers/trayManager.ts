import { app, Menu, Tray } from "electron";
import path from "path";
import { trayMenuTemplate } from "../menu/trayMenu";
import {
  IS_DEV,
  IS_LINUX,
  IS_MAC,
  IS_WINDOWS,
  RESOURCES_PATH,
  UUID_NAMESPACE,
} from "./constants";
import { settings } from "./settings";
import { v5 as uuidv5 } from "uuid";

// bring the settings into scoped
const { trayEnabled, startInTrayEnabled, seenMinimizeToTrayWarning } = settings;

export class TrayManager {
  public enabled = trayEnabled.value;
  public iconPath = this.getIconPath();
  public overlayIconPath = this.getOverlayIconPath();
  private lastIcon = this.iconPath;

  public tray: Tray | null = null;

  constructor() {
    trayEnabled.subscribe((val) => this.handleTrayEnabledToggle(val));
  }
  private getIconPath(): string {
    if (IS_WINDOWS) {
      // Re-use regular app .ico for the tray icon on Windows.
      return path.resolve(RESOURCES_PATH, "icon.ico");
    } else {
      // Mac tray icon filename MUST end in 'Template' and contain only black and transparent pixels.
      // Otherwise, automatic inversion and dark mode appearance won't work.
      // See: https://stackoverflow.com/questions/41664208/electron-tray-icon-change
      const trayIconFileName = IS_MAC ? "icon_macTemplate.png" : "icon.png";
      return path.resolve(RESOURCES_PATH, "tray", trayIconFileName);
    }
  }

  private getOverlayIconPath(): string | null {
    if (IS_WINDOWS) {
      return path.resolve(RESOURCES_PATH, "tray", "unread_icon.ico");
    } else if (IS_LINUX) {
      return path.resolve(RESOURCES_PATH, "tray", "unread_icon.png");
    }
    return null;
  }

  public startIfEnabled(): void {
    if (!this.tray) {
      if (this.enabled) {
        // if the os is windows generate guid otherwise it is undefined
        const guid = IS_WINDOWS
          ? uuidv5(
              `android-messages-desktop${
                // if is dev add an identifier
                IS_DEV ? "-development" : ""
                // append the app path incase that changes for some reason
              }-${app.getAppPath()}`,
              UUID_NAMESPACE
            )
          : undefined;
        this.tray = new Tray(this.lastIcon, guid);
        const trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
        this.tray.setContextMenu(trayContextMenu);
        this.tray.setToolTip("Android Messages");
        this.setupEventListeners();
      }
    }
  }

  private setupEventListeners() {
    if (this.tray != null) {
      this.tray.on("click", this.handleTrayClick);
    }
  }

  private destroyEventListeners() {
    if (this.tray != null) {
      this.tray.removeListener("click", this.handleTrayClick);
      this.tray.removeListener("double-click", this.handleTrayClick);
    }
  }

  private handleTrayClick(_event: Electron.KeyboardEvent) {
    app.mainWindow?.show();
  }

  private destroy(): void {
    if (this.tray) {
      this.destroyEventListeners();
      this.tray.destroy();
      this.tray = null;
    }
  }

  public showMinimizeToTrayWarning(): void {
    if (IS_WINDOWS && trayEnabled.value) {
      if (!seenMinimizeToTrayWarning.value && this.tray != null) {
        this.tray.displayBalloon({
          title: "Android Messages",
          content:
            "Android Messages is still running in the background. To close it, use the File menu or right-click on the tray icon.",
        });
        seenMinimizeToTrayWarning.next(true);
      }
    }
  }

  public handleTrayEnabledToggle(newValue: boolean): void {
    this.enabled = newValue;
    const liveStartInTrayMenuItemRef = Menu.getApplicationMenu()?.getMenuItemById(
      "startInTrayMenuItem"
    );

    if (newValue) {
      this.startIfEnabled();
      if (liveStartInTrayMenuItemRef != null) {
        liveStartInTrayMenuItemRef.enabled = true;
      }
    }
    if (!newValue) {
      this.destroy();
      startInTrayEnabled.next(false);

      if (liveStartInTrayMenuItemRef != null) {
        liveStartInTrayMenuItemRef.enabled = false;
        liveStartInTrayMenuItemRef.checked = false;
      }

      if (!app.mainWindow?.isVisible()) {
        app.mainWindow?.show();
      }
    }
  }

  public setUnreadIcon(toggle: boolean): void {
    if (this.overlayIconPath != null) {
      if (toggle) {
        this.lastIcon = this.overlayIconPath;
      } else {
        this.lastIcon = this.iconPath;
      }
    }
    if (this.tray) {
      this.tray.setImage(this.lastIcon);
    }
  }
}
