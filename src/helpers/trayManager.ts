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
import { getMainWindow } from "./getMainWindow";

// bring the settings into scoped
const {
  trayEnabled,
  seenMinimizeToTrayWarning,
  monochromeIconEnabled,
  showIconsInRecentConversationTrayEnabled,
  trayIconRedDotEnabled,
} = settings;

export interface Conversation {
  name: string | null | undefined;
  image: string | undefined;
  recentMessage: string | null | undefined;
  i: number;
}

export class TrayManager {
  public enabled = trayEnabled.value;
  private messagesAreUnread = false;
  private recentConversations: Conversation[] = [];

  public tray: Tray | null = null;

  constructor() {
    trayEnabled.subscribe((val) => this.handleTrayEnabledToggle(val));
    monochromeIconEnabled.subscribe(() =>
      this.tray?.setImage(this.getIconPath())
    );
    trayIconRedDotEnabled.subscribe(() => {
      this.tray?.setImage(this.getIconPath());
    });
  }

  public startIfEnabled(): void {
    if (!this.tray) {
      if (this.enabled) {
        // if the os is windows generate guid otherwise it is undefined
        const guid = IS_WINDOWS
          ? uuidv5(
              `${app.getName()}${
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
    this.recentConversations = data;
    this.refreshTrayMenu();
  }

  public refreshTrayMenu() {
    const conversationMenuItems: MenuItemConstructorOptions[] =
      this.recentConversations.map(({ name, image, recentMessage, i }) => {
        const icon =
          image != null &&
          image != INITIAL_ICON_IMAGE &&
          showIconsInRecentConversationTrayEnabled.value
            ? nativeImage.createFromDataURL(image)
            : undefined;

        return {
          label: name || "Name not Found",
          sublabel: recentMessage || undefined,
          icon,
          click: () => {
            getMainWindow()?.show();
            getMainWindow()?.webContents.send("focus-conversation", i);
          },
        };
      });
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
      const unread =
        this.messagesAreUnread && trayIconRedDotEnabled.value ? "unread_" : "";
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

  private handleTrayClick() {
    const mainWindow = getMainWindow();
    mainWindow?.show();
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
    const menuItemIds = [
      "startInTrayMenuItem",
      "monochromeIconEnabledMenuItem",
      "showIconsInRecentConversationTrayEnabledMenuItem",
      "trayIconRedDotEnabledMenuItem",
    ];

    if (newValue) {
      this.startIfEnabled();
      this.refreshTrayMenu();
    } else {
      this.destroy();
      const mainWindow = getMainWindow();
      if (!mainWindow?.isVisible()) {
        mainWindow?.show();
      }
    }

    for (const id of menuItemIds) {
      const item = Menu.getApplicationMenu()?.getMenuItemById(id);
      if (item != null) {
        item.enabled = newValue;
      }
    }
  }
}
