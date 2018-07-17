import path from 'path';
import { app, Tray, Menu } from 'electron';
import { trayMenuTemplate } from '../../menu/tray_menu_template';
import { IS_MAC, IS_LINUX, IS_WINDOWS } from '../../constants';
import settings from 'electron-settings';

export default class TrayManager {
  constructor() {
    // Must declare reference to instance of Tray as a variable, not a const, or bad/weird things happen!
    this._tray = null;
    // Enable tray/menu bar icon by default except on Linux -- the system having a tray is less of a guarantee on Linux.
    this._enabled = settings.get('trayEnabledPref', (!IS_LINUX));
    this._iconPath = this._enabled ? this.setTrayIconPath() : null;
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

  setTrayIconPath() {
    if (IS_WINDOWS) {
        // Re-use regular app .ico for the tray icon on Windows
        return path.join(__dirname, '..', 'resources', 'icon.ico');
    } else {
        const trayIconFileName = IS_MAC ? 'icon_mac.png' : 'icon.png';
        return path.join(__dirname, '..', 'resources', 'tray', trayIconFileName);
    }
  }

  setupEventListeners() {
    if (IS_MAC) {
      app.on('activate', () => {
        mainWindow.show();
      });
    }

    if (this.enabled && IS_WINDOWS) {
      this.tray.on('double-click', (event) => {
        event.preventDefault();
        mainWindow.show();
      });
    }

    if (this.enabled && IS_LINUX) {
      this.tray.on('click', () => {
        mainWindow.show();
      });
    }
  }

  startIfEnabled() {
    if (this.enabled) {
      this.tray = new Tray(this.trayIconPath);
      let trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
      this.tray.setContextMenu(trayContextMenu);
    }
  }

  destroy() {
    this.tray.destroy();
    this.tray = null;
  }

  showMinimizeToTrayWarning() {
    if (IS_WINDOWS && trayManager.enabled) {
      const seenMinimizeToTrayWarning = settings.get('seenMinimizeToTrayWarningPref', false);
      if (!seenMinimizeToTrayWarning) {
        trayManager.tray.displayBalloon({
          title: 'Android Messages',
          content: 'Android Messages is still running in the background. To close it, use the File menu or right-click on the tray icon.'
        });
        settings.set('seenMinimizeToTrayWarningPref', true);
      }
    }
  }

}
