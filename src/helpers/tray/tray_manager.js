import path from 'path';
import { app, Tray, Menu } from 'electron';
import { trayMenuTemplate } from '../../menu/tray_menu_template';
import { IS_MAC, IS_LINUX, IS_WINDOWS, SETTING_TRAY_ENABLED } from '../../constants';
import settings from 'electron-settings';

// TODO: Make this static
export default class TrayManager {
  constructor() {
    // Must declare reference to instance of Tray as a variable, not a const, or bad/weird things happen!
    this._tray = null;
    // Enable tray/menu bar icon by default except on Linux -- the system having a tray is less of a guarantee on Linux.
    this._enabled = settings.get(SETTING_TRAY_ENABLED, (!IS_LINUX));
    this._iconPath = this.setTrayIconPath();
    this._overlayIconPath = this.setOverlayIconPath();
    this._overlayVisible = false;

    this.handleTrayEnabledToggle = this.handleTrayEnabledToggle.bind(this);
  }

  get tray() {
    return this._tray;
  }

  set tray(trayInstance) {
    this._tray = trayInstance;
  }

  get enabled() {
    return this._enabled;
  }

  set enabled(enabled) {
    this._enabled = enabled;
  }

  get trayIconPath() {
    return this._iconPath;
  }

  get overlayIconPath() {
    return this._overlayIconPath;
  }

  get overlayVisible() {
    return this._overlayVisible;
  }

  set overlayVisible(visible) {
    this._overlayVisible = visible;
  }

  setTrayIconPath() {
    if (IS_WINDOWS) {
        // Re-use regular app .ico for the tray icon on Windows.
        return path.join(__dirname, '..', 'resources', 'icon.ico');
    } else {
        // Mac tray icon filename MUST end in 'Template' and contain only black and transparent pixels.
        // Otherwise, automatic inversion and dark mode appearance won't work.
        const trayIconFileName = IS_MAC ? 'icon_macTemplate.png' : 'icon.png';
        return path.join(__dirname, '..', 'resources', 'tray', trayIconFileName);
    }
  }

  setOverlayIconPath() {
    if (IS_WINDOWS) {
      return path.join(__dirname, '..', 'resources', 'tray', 'tray_with_badge.ico');
    }
    return null;
  }

  startIfEnabled() {
    if (this.enabled) {
      this.tray = new Tray(this.trayIconPath);
      let trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
      this.tray.setContextMenu(trayContextMenu);

      if (IS_WINDOWS) {
        this.tray.on('double-click', (event) => {
          event.preventDefault();
          if (app.mainWindow) {
            app.mainWindow.show();
          }
        });
      }

      // This actually has no effect. Electron docs say that click event is ignored on Linux for
      // AppIndicator tray, but I can't find a way to not use AppIndicator for Linux tray.
      if (IS_LINUX) {
        this.tray.on('click', () => {
          if (app.mainWindow) {
            app.mainWindow.show();
          }
        });
      }
    }
  }

  destroy() {
    this.tray.destroy();
    this.tray = null;
  }

  showMinimizeToTrayWarning() {
    if (IS_WINDOWS && this.enabled) {
      const seenMinimizeToTrayWarning = settings.get('seenMinimizeToTrayWarningPref', false);
      if (!seenMinimizeToTrayWarning) {
        this.tray.displayBalloon({
          title: 'Android Messages',
          content: 'Android Messages is still running in the background. To close it, use the File menu or right-click on the tray icon.'
        });
        settings.set('seenMinimizeToTrayWarningPref', true);
      }
    }
  }

  handleTrayEnabledToggle(newValue, oldValue) {
    this.enabled = newValue;
    if (newValue) {
      if (!IS_MAC) {
        // Must get a live reference to the menu item when updating their properties from outside of them.
        let liveStartInTrayMenuItemRef = Menu.getApplicationMenu().getMenuItemById('startInTrayMenuItem');
        liveStartInTrayMenuItemRef.enabled = true;
      }
      if (!this.tray) {
        this.startIfEnabled();
      }
    }
    if (!newValue) {
      if (this.tray) {
        this.destroy();
        if ((!IS_MAC) && app.mainWindow) {
          if (!app.mainWindow.isVisible()) {
            app.mainWindow.show();
          }
        }
      }
      if (!IS_MAC) {
        // If the app has no tray icon, it can be difficult or impossible to re-gain access to the window, so disallow
        // starting hidden, except on Mac, where the app window can still be un-hidden via the dock.
        settings.set('startInTrayPref', false);
        let liveStartInTrayMenuItemRef = Menu.getApplicationMenu().getMenuItemById('startInTrayMenuItem');
        liveStartInTrayMenuItemRef.enabled = false;
        liveStartInTrayMenuItemRef.checked = false;
      }
      if (IS_LINUX) {
        // On Linux, the call to tray.destroy doesn't seem to work, causing multiple instances of the tray icon.
        // Work around this by quickly restarting the app.
        app.relaunch();
        app.exit(0);
      }
    }
  }

  toggleOverlay(toggle) {
    if (IS_WINDOWS && this.tray && toggle !== this.overlayVisible) {
      if (toggle) {
        this.tray.setImage(this.overlayIconPath);
      } else {
        this.tray.setImage(this.trayIconPath);
      }
      this.overlayVisible = toggle;
    }
  }

}
