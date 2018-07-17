// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import { baseMenuTemplate } from './menu/base_menu_template';
import { devMenuTemplate } from './menu/dev_menu_template';
import { settingsMenu } from './menu/settings_menu_template';
import { helpMenuTemplate } from './menu/help_menu_template';
import createWindow from './helpers/window';
import settings from 'electron-settings';
import { IS_MAC, IS_WINDOWS, IS_LINUX, IS_DEV } from './constants';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from 'env';
import TrayManager from './helpers/tray/tray_manager';

let mainWindow = null;

// Prevent multiple instances of the app which causes many problems with an app like ours
// Without this, if an instance were minimized to the tray in Windows, clicking a shortcut would launch another instance, icky
// Adapted from https://github.com/electron/electron/blob/v2.0.2/docs/api/app.md#appmakesingleinstancecallback
const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, let's show our existing instance instead
  if (mainWindow) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  }
});

if (isSecondInstance) {
  app.quit();
} else {
  let trayManager = null;

  const setApplicationMenu = () => {
    const menus = baseMenuTemplate;
    if (env.name !== 'production') {
      menus.push(devMenuTemplate);
    }
    menus.push(helpMenuTemplate);
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
  };

  // Save userData in separate folders for each environment.
  // Thanks to this you can use production and development versions of the app
  // on same machine like those are two separate apps.
  if (env.name !== 'production') {
    const userDataPath = app.getPath('userData');
    app.setPath('userData', `${userDataPath} (${env.name})`);
  }

  if (IS_WINDOWS) {
    // Stupid, DUMB calls that have to be made to let notifications come through on Windows (only Windows 10?)
    // See: https://github.com/electron/electron/issues/10864#issuecomment-382519150
    app.setAppUserModelId('com.knepper.android-messages-desktop');
    app.setAsDefaultProtocolClient('android-messages-desktop');
  }

  app.on('ready', () => {
    trayManager = new TrayManager();

    // TODO: Create a preference manager which handles all of these
    const autoHideMenuBar = settings.get('autoHideMenuPref', false);
    const startInTray = settings.get('startInTrayPref', false);
    settings.watch('trayEnabledPref', (newValue, oldValue) => {
      trayManager.enabled = newValue;
      if (newValue) {
        if (!IS_MAC) {
          // Must get a live reference to the menu item when updating their properties from outside of them.
          let liveStartInTrayMenuItemRef = Menu.getApplicationMenu().getMenuItemById('startInTrayMenuItem');
          liveStartInTrayMenuItemRef.enabled = true;
        }
        if (!trayManager.tray) {
          trayManager.startIfEnabled();
        }
      }
      if (!newValue) {
        if (trayManager.tray) {
          trayManager.destroy();
          if ((!IS_MAC) && mainWindow) {
            if (!mainWindow.isVisible()) {
              mainWindow.show();
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
    });

    if (!IS_MAC) {
      // Sets checked status based on user prefs
      settingsMenu.submenu[0].checked = autoHideMenuBar;
      settingsMenu.submenu[1].enabled = trayManager.enabled;
    }

    settingsMenu.submenu[1].checked = startInTray;
    settingsMenu.submenu[2].checked = trayManager.enabled;

    setApplicationMenu();

    autoUpdater.checkForUpdatesAndNotify();

    const mainWindowOptions = {
      width: 1100,
      height: 800,
      autoHideMenuBar: autoHideMenuBar,
      show: !(startInTray) //Starts in tray if set
    };

    if (IS_LINUX) {
      // Setting the icon in Linux tends to be finicky without explicitly setting it like this.
      // See: https://github.com/electron/electron/issues/6205
      mainWindowOptions.icon = path.join(__dirname, '..', 'resources', 'icons', '128x128.png');
    };

    mainWindow = createWindow('main', mainWindowOptions);

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true
      })
    );

    trayManager.startIfEnabled();

    app.mainWindow = mainWindow; // Quick and dirty way for renderer process to access mainWindow for communication


    let quitViaContext = false;
    app.on('before-quit', () => {
      quitViaContext = true;
    });

    const shouldExitOnMainWindowClosed = () => {
      if (IS_MAC) {
        return quitViaContext;
      } else {
        if (trayManager.enabled) {
          return quitViaContext;
        }
        return true;
      }
    };

    mainWindow.on('close', (event) => {
      console.log('close window called');
      if (!shouldExitOnMainWindowClosed()) {
        event.preventDefault();
        mainWindow.hide();
        trayManager.showMinimizeToTrayWarning();
      }
    });

    if (IS_DEV) {
      mainWindow.openDevTools();
    }
  });
}
