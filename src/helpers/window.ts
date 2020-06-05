// This helper remembers the size and position of your windows (and restores
// them in that place after app relaunch).
// Can be used for more than one window, just construct many
// instances of it and give each different name.

import {
  app,
  BrowserWindow,
  screen,
  BrowserWindowConstructorOptions,
} from "electron";
import * as jetpack from "fs-jetpack";

interface Size {
  width: number;
  height: number;
}

interface Position extends Size {
  x: number;
  y: number;
}
/**
 * Custom window class that has some utility methods.
 * Seems largely uneeded but the code here before used these methods and needed structure.
 * This is an improvement over the previous confusion.
 *
 * @export
 * @class Window
 * @extends {BrowserWindow}
 */
export class Window extends BrowserWindow {
  private userDataDir = jetpack.cwd(app.getPath("userData"));

  private stateStoreFile: string;
  private defaultSize: Position;
  private state: Size;

  constructor(name: string, options?: BrowserWindowConstructorOptions) {
    super(options);
    this.stateStoreFile = `window-state-${name}.json`;
    this.defaultSize = {
      width: options?.width || 800,
      height: options?.height || 800,
      x: 0,
      y: 0,
    };
    this.resetToDefaults();
    this.state = this.ensureVisibleOnSomeDisplay();
    this.on("close", () => this.saveState());
  }

  /**
   * Loads the Position data from cold store.
   *
   * @returns {Position}
   * @memberof Window
   */
  public restore(): Position {
    let restoredState = {};
    try {
      restoredState = this.userDataDir.read(this.stateStoreFile, "json");
    } catch (_err) {
      // For some reason json can't be read (might be corrupted).
      // No worries, we have defaults.
    }
    this.defaultSize = { ...this.defaultSize, ...restoredState };
    return this.defaultSize;
  }

  /**
   * Gets the current window state
   *
   * @returns {Position} current window state
   * @memberof Window
   */
  public getCurrentPosition(): Position {
    const position = this.getPosition();
    const size = this.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  }

  /**
   * Checks if the window overlaps with the provided bounds
   *
   * @param {Position} bounds bounds to check if overlapping
   * @returns {boolean} if it overlapped
   * @memberof Window
   */
  public windowWithinBounds(bounds: Position): boolean {
    const windowState = this.getCurrentPosition();
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    );
  }

  /**
   * Resets the default state back to the default
   *
   * @returns {Position} returns the default Position.
   * @memberof Window
   */
  public resetToDefaults = (): Position => {
    const bounds = screen.getPrimaryDisplay().bounds;
    this.defaultSize = {
      ...this.defaultSize,
      x: (bounds.width - this.defaultSize.width) / 2,
      y: (bounds.height - this.defaultSize.height) / 2,
    };
    return this.defaultSize;
  };

  /**
   * Makes sure the window appears on the display and if not forces it back to the default size
   *
   * @returns {Position} Returns current window position
   * @memberof Window
   */
  public ensureVisibleOnSomeDisplay(): Position {
    const visible = screen.getAllDisplays().some((display) => {
      return this.windowWithinBounds(display.bounds);
    });
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return this.resetToDefaults();
    }
    return this.getCurrentPosition();
  }

  public saveState(): void {
    if (this.isMinimized() && !this.isMaximized()) {
      this.state = { ...this.state, ...this.getCurrentPosition() };
    }
    this.userDataDir.write(this.stateStoreFile, this.state, { atomic: true });
  }
}
