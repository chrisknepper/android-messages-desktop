// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu, ipcMain, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import { baseMenuTemplate } from './menu/base_menu_template';
import { devMenuTemplate } from './menu/dev_menu_template';
import { settingsMenu } from './menu/settings_menu_template';
import { helpMenuTemplate } from './menu/help_menu_template';
import createWindow from './helpers/window';
import TrayManager from './helpers/tray/tray_manager';
import settings from 'electron-settings';
import { IS_MAC, IS_WINDOWS, IS_LINUX, IS_DEV, SETTING_TRAY_ENABLED, SETTING_TRAY_CLICK_SHORTCUT, EVENT_WEBVIEW_NOTIFICATION, EVENT_NOTIFICATION_REFLECT_READY } from './constants';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from 'env';

const state = {
  unreadNotificationCount: 0
};

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
    settings.watch(SETTING_TRAY_ENABLED, trayManager.handleTrayEnabledToggle);
    settings.watch(SETTING_TRAY_CLICK_SHORTCUT, trayManager.handleTrayClickShortcutToggle);

    if (IS_MAC) {
      app.on('activate', () => {
        mainWindow.show();
      });
    }

    if (!IS_MAC) {
      // Sets checked status based on user prefs
      settingsMenu.submenu[0].checked = autoHideMenuBar;
      settingsMenu.submenu[2].enabled = trayManager.enabled;
    }

    settingsMenu.submenu[2].checked = startInTray;
    settingsMenu.submenu[1].checked = trayManager.enabled;

   if (IS_WINDOWS) {
      settingsMenu.submenu[3].enabled = trayManager.enabled;
      settingsMenu.submenu[3].submenu[0].checked = (trayManager.clickShortcut === 'double-click');
      settingsMenu.submenu[3].submenu[1].checked = (trayManager.clickShortcut === 'click');
   }

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
    
    mainWindow.on('focus', () => {
      if (IS_MAC) {
        state.unreadNotificationCount = 0;
        app.dock.setBadge('');
      }

      if (IS_WINDOWS && trayManager.overlayVisible) {
        trayManager.toggleOverlay(false);
      }
    });

    ipcMain.on(EVENT_WEBVIEW_NOTIFICATION, (event, msg) => {
      if (msg.options) {
        const customNotification = new Notification({
          title: msg.title,
          /*
           * TODO: Icon is just the logo, which is the only image sent by Google, hopefully someday they will pass
           * the sender's picture/avatar here.
           *
           * We may be able to just do it live by:
           * 1. Traversing the DOM for the conversation which matches the sender
           * 2. Converting to to SVG to Canvas to PNG using: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas
           * 3. Sending image URL which Electron can display via nativeImage.createFromDataURL
           * This would likely also require copying computed style properties into the element to ensure it looks right.
           * There also appears to be a library: http://html2canvas.hertzen.com
           */
          icon: msg.options.icon,
          body: msg.options.body,
          silent: false
        });

        if (IS_MAC) {
          if (!mainWindow.isFocused()) {
            state.unreadNotificationCount += 1;
            app.dock.setBadge('' + state.unreadNotificationCount);
          }
        }

        trayManager.toggleOverlay(true);

        customNotification.once('click', () => {
          mainWindow.show();
        });

        // Allows us to marry our custom notification and its behavior with the helpful behavior
        // (conversation highlighting) that Google provides. See the webview bridge for details.
        global.currentNotification = customNotification;
        event.sender.send(EVENT_NOTIFICATION_REFLECT_READY, true);

        customNotification.show();
      }
    });

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
      } else {
        app.quit(); // If we don't explicitly call this, the webview and mainWindow get destroyed but background process still runs.
      }
    });

    if (IS_DEV) {
      mainWindow.openDevTools();
    }
  });
}
