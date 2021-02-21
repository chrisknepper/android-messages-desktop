import {
  app,
  Menu,
  MenuItemConstructorOptions,
  nativeImage,
  Tray,
} from "electron";
import path from "path";
import { trayMenuTemplate } from "../menu/trayMenu";
import {
  INITIAL_ICON_IMAGE,
  IS_DEV,
  IS_MAC,
  IS_WINDOWS,
  RESOURCES_PATH,
  UUID_NAMESPACE,
} from "./constants";
import { settings } from "./settings";
import { v5 as uuidv5 } from "uuid";
import { separator } from "../menu/items/separator";

// bring the settings into scoped
const {
  trayEnabled,
  startInTrayEnabled,
  seenMinimizeToTrayWarning,
  monochromeIconEnabled,
} = settings;

interface Conversation {
  name: string | null | undefined;
  image: string | undefined;
  recentMessage: string | null | undefined;
  click: () => void;
}

export class TrayManager {
  public enabled = trayEnabled.value;
  private messagesAreUnread = false;

  public tray: Tray | null = null;

  constructor() {
    trayEnabled.subscribe((val) => this.handleTrayEnabledToggle(val));
    monochromeIconEnabled.subscribe(() =>
      this.tray?.setImage(this.getIconPath())
    );
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
        this.tray = new Tray(this.getIconPath(), guid);
        const trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
        this.tray.setContextMenu(trayContextMenu);
        this.tray.setToolTip("Android Messages");
        this.setupEventListeners();
      }
    }
  }

  /**
   *
   * Set the unread status of the tray
   *
   * @param val value to assugn to messagesAreUnread
   */
  public setUnread(val: boolean): void {
    this.messagesAreUnread = val;
    this.tray?.setImage(this.getIconPath());
  }

  public setRecentConversations(data: Conversation[]): void {
    const conversationMenuItems: MenuItemConstructorOptions[] = data.map(
      ({ name, click, image, recentMessage }) => {
        const icon =
          image != null && image != INITIAL_ICON_IMAGE
            ? nativeImage.createFromDataURL(image)
            : undefined;

        return {
          label: name || "Name not Found",
          sublabel: recentMessage || undefined,
          icon,
          click: () => {
            if (!app.mainWindow?.isVisible()) {
              app.mainWindow?.show();
            }
            click();
          },
        };
      }
    );
    this.tray?.setContextMenu(
      Menu.buildFromTemplate([
        ...conversationMenuItems,
        separator,
        ...trayMenuTemplate,
      ])
    );
  }

  /**
   * Gets the icon path taking into account all possible states and situations.
   */
  private getIconPath(): string {
    let filename: string;
    if (IS_MAC) {
      filename = "icon_macTemplate.png";
    } else {
      const unread = this.messagesAreUnread ? "unread_" : "";
      const mono = monochromeIconEnabled.value ? "_mono" : "";
      filename = `${unread}icon${mono}.png`;
    }

    return path.resolve(RESOURCES_PATH, "tray", filename);
  }

  private setupEventListeners() {
    this.tray?.on("click", this.handleTrayClick);
  }

  private destroyEventListeners() {
    this.tray?.removeListener("click", this.handleTrayClick);
    this.tray?.removeListener("double-click", this.handleTrayClick);
  }

  private handleTrayClick(_event: Electron.KeyboardEvent) {
    app.mainWindow?.show();
  }

  private destroy(): void {
    this.destroyEventListeners();
    this.tray?.destroy();
    this.tray = null;
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
}
