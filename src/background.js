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
import { trayMenuTemplate } from './menu/tray_menu_template';
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
  let trayIconPath;

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

    // Re-use regular app .ico for the tray icon on Windows
    trayIconPath = path.join(__dirname, '..', 'resources', 'icon.ico');
  } else {
    const trayIconFileName = IS_MAC ? 'icon_mac.png' : 'icon.png';
    trayIconPath = path.join(__dirname, '..', 'resources', 'tray', trayIconFileName);
  }

  app.on('ready', () => {
    if (!IS_MAC) {
      // Sets checked status based on user prefs
      if (!settings.has("autoHideMenuPref")) {
        settings.set("autoHideMenuPref", false);
      }
      if (!settings.has("startInTrayPref")) {
        settings.set("startInTrayPref", false);
      }
      settingsMenu.submenu[0].checked = settings.get("autoHideMenuPref");
      settingsMenu.submenu[1].checked = settings.get("startInTrayPref");
    }

    setApplicationMenu();

    autoUpdater.checkForUpdatesAndNotify();

    const mainWindowOptions = {
      width: 1100,
      height: 800,
      autoHideMenuBar: settings.get("autoHideMenuPref"),
      show: !settings.get("startInTrayPref") //Starts in tray if set
    };

    if (IS_LINUX) {
      mainWindowOptions.icon = path.join(__dirname, '..', 'resources', 'icons', '128x128.png')
    };

    mainWindow = createWindow('main', mainWindowOptions);

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true
      })
    );

    tray = new Tray(trayIconPath);
    let trayContextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setContextMenu(trayContextMenu);

    app.mainWindow = mainWindow; // Quick and dirty way for renderer process to access mainWindow for communication


    let quitViaContext = false;
    app.on('before-quit', () => {
      quitViaContext = true;
    });

    mainWindow.on('close', (event) => {
      console.log('close window called');
      if (!quitViaContext) {
        event.preventDefault();
        mainWindow.hide();
        if (IS_WINDOWS) {
          const seenMinimizeToTrayWarning = settings.get('seenMinimizeToTrayWarningPref', false);
          if (!seenMinimizeToTrayWarning) {
            tray.displayBalloon({
              title: 'Android Messages',
              content: 'Android Messages is still running in the background. To close it, use the File menu or right-click on the tray icon.'
            });
            settings.set('seenMinimizeToTrayWarningPref', true);
          }
        }
      }
    });

    if (IS_MAC) {
      app.on('activate', () => {
        mainWindow.show();
      });
    }

    if (IS_WINDOWS) {
      tray.on('double-click', (event) => {
        event.preventDefault();
        mainWindow.show();
      });
    }

    if (IS_LINUX) {
      tray.on('click', () => {
        mainWindow.show();
      });
    }

    // TODO: Maybe make these (aka minimize-to-tray behavior) a preference for non-Mac users?
    // app.on('window-all-closed', (event) => {
    //   app.quit();
    // });
    // mainWindow.on('minimize', (event) => {
    //   event.preventDefault();
    //   mainWindow.hide();
    // });

    if (IS_DEV) {
      mainWindow.openDevTools();
    }
  });
}
