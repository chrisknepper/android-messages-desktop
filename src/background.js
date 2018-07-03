// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu, Tray } from 'electron';
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
  app.quit()
} else {
  let tray; // Must declare reference to instance of Tray as a variable, not a const, or bad/weird things happen

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
    if (!IS_MAC) {
      // Sets checked status based on user prefs
      if (!settings.has("autoHideMenuPref")) {
        settings.set("autoHideMenuPref", false);
      }
      settingsMenu.submenu[0].checked = settings.get("autoHideMenuPref");
    }

    setApplicationMenu();

    autoUpdater.checkForUpdatesAndNotify();

    mainWindow = createWindow('main', {
      width: 1100,
      height: 800,
      autoHideMenuBar: settings.get("autoHideMenuPref")
    });

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true
      })
    );

    app.mainWindow = mainWindow; // Quick and dirty way for renderer process to access mainWindow for communication

    if (IS_MAC) {
      let quitViaContext = false;
      app.on('before-quit', () => {
        quitViaContext = true;
      });

      mainWindow.on('close', (event) => {
        if (!quitViaContext) {
          event.preventDefault();
          mainWindow.hide();
        }
      });

      app.on('activate', () => {
        mainWindow.show();
      });
    }

    if (IS_WINDOWS) {
      mainWindow.on('close', (event) => {
        app.quit();
      });

      tray = new Tray(__dirname + '../../resources/icon.ico');

      let contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show',
          click: () => {
            mainWindow.show();
          }
        },
        {
          label: 'Quit',
          click: () => {
            app.quit();
          }
        }
      ]);

      tray.setContextMenu(contextMenu);

      tray.on('double-click', (event) => {
        event.preventDefault();
        mainWindow.show();
      });

      mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
      });
    }

    // TODO: Better UX for Linux...likely similar to Windows as far as tray behavior
    if (IS_LINUX) {
      app.on('window-all-closed', (event) => {
        app.quit();
      });
    }

    if (IS_DEV) {
      mainWindow.openDevTools();
    }
  });
}
