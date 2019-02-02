// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import https from 'https';
import fs from 'fs';
import { app, Menu, ipcMain, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import { baseMenuTemplate } from './menu/base_menu_template';
import { devMenuTemplate } from './menu/dev_menu_template';
import { settingsMenu } from './menu/settings_menu_template';
import { helpMenuTemplate } from './menu/help_menu_template';
import createWindow from './helpers/window';
import TrayManager from './helpers/tray/tray_manager';
import settings from 'electron-settings';
import { IS_MAC, IS_WINDOWS, IS_LINUX, IS_DEV, SETTING_TRAY_ENABLED, SETTING_TRAY_CLICK_SHORTCUT, SETTING_CUSTOM_WORDS, EVENT_WEBVIEW_NOTIFICATION, EVENT_NOTIFICATION_REFLECT_READY, EVENT_BRIDGE_INIT, EVENT_SPELL_ADD_CUSTOM_WORD, EVENT_SPELLING_REFLECT_READY, SPELLING_DICTIONARIES_PATH } from './constants';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from 'env';

const state = {
  unreadNotificationCount: 0,
  currentLanguage: null
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
    state.currentLanguage = app.getLocale();
    console.log('the locale', state.currentLanguage);

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

    ipcMain.on(EVENT_BRIDGE_INIT, (event) => {
      // We send an event with the language key and array of custom words to the webview bridge which contains the
      // instance of the spellchecker. Done this way because passing class instances (i.e. of the spellchecker)
      // between electron processes is hacky at best and impossible at worst.
      const existingCustomWords = settings.get(SETTING_CUSTOM_WORDS, {});
      const { currentLanguage } = state;
      let customWordsOfCurrentLanguage = {};
      if (currentLanguage in existingCustomWords) {
        customWordsOfCurrentLanguage = { [currentLanguage]: existingCustomWords[currentLanguage] };
      }
      event.sender.send(EVENT_SPELLING_REFLECT_READY, customWordsOfCurrentLanguage);
    });

    ipcMain.on(EVENT_SPELL_ADD_CUSTOM_WORD, (event, msg) => {
      // Add custom words picked by the user to a persistent data store because they must be added to
      // the instance of Hunspell on each launch of the app/loading of the dictionary.
      const { newCustomWord } = msg;
      const { currentLanguage } = state;
      const existingCustomWords = settings.get(SETTING_CUSTOM_WORDS, {});
      console.log('attempting to add custom words', currentLanguage, currentLanguage in existingCustomWords);
      if (!(currentLanguage in existingCustomWords)) {
        console.log('currentLanguage key not yet there', currentLanguage);
        existingCustomWords[currentLanguage] = [];
      }
      console.log('custom word dict before adding new word', existingCustomWords);
      if (newCustomWord && !existingCustomWords[currentLanguage].includes(newCustomWord)) {
        existingCustomWords[currentLanguage].push(newCustomWord);
        console.log('about to save custom word dict after adding new word', existingCustomWords);
        settings.set(SETTING_CUSTOM_WORDS, existingCustomWords);
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

    //if (IS_DEV) {
      mainWindow.openDevTools();
    //}

    if (!fs.existsSync(SPELLING_DICTIONARIES_PATH)) {
      fs.mkdirSync(SPELLING_DICTIONARIES_PATH);
    }

    //const userLanguage = state.currentLanguage;
    const userLanguage = 'en-US';
    const userLanguageAffFile = path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}-user.aff`);
    const userLanguageDicFile = path.join(SPELLING_DICTIONARIES_PATH, `${userLanguage}-user.dic`)

    if (!fs.existsSync(userLanguageAffFile) || !fs.existsSync(userLanguageDicFile)) {
      /*
       * It is possible for Electron to return a locale code for which there are multiple
       * "close match" dictionaries but no exact match. For these special cases, we
       * hardcode which dictionary should be used here.
       */
      const specialLanguageCases = {
        // For a system returning just generic "English", load the Queen's English because its spellings
        // are more common anywhere outside of USA, where en-US should always be returned.
        en: 'en-GB',
        /*
         * Electron returns "hy" for any dialect of Armenian but there are only dictionaries for Eastern
         * Armenian and Western Armenian--no generic "Armenian." According to Wikipedia, Eastern Armenian
         * is more widely spoken and acts as a superset of Western Armenian. Since there is no other
         * reliable way to tell which dialect a user would prefer, we use Eastern Armenian because of the
         * larger number of speakers of that language.
         */
        hy: 'hy-arevela'
      };

      // Should check if we already have the dictionary for the current language before doing this
      // Adapted from: https://stackoverflow.com/questions/35697058/download-and-store-files-inside-electron-app
      const requestOptions = {
        host: 'api.github.com',
        port: 443,
        path: '/repos/wooorm/dictionaries/contents/dictionaries',
        method: 'GET',
        headers: {
          'User-Agent': 'Android Messages Desktop App'
        }
      }

      https.get(requestOptions, (response) => {
        //response.
        console.log('github dictionaries check', response.statusCode);
        var body = '';
        response.on('data', function (chunk) {
          body += chunk;
        });
        response.on('end', function () {
          //console.log(body);
          if (response.statusCode === 200 || response.statusCode === 302) {
            //console.log('body', typeof body);
            const listOfDictionaries = JSON.parse(body);
            //console.log('now body', listOfDictionaries);
            const listOfSupportedLanguages = listOfDictionaries.map((folder) => {
              if (folder.type === 'dir') {
                return folder.name
              }
            });

            let downloadDictionaryKey = null;

            console.log('the list of languages supported by wooorm dictionaries', listOfSupportedLanguages);
            if (listOfSupportedLanguages.includes(userLanguage)) {
              downloadDictionaryKey = userLanguage;
              console.log('your language is supported by the spellchecker!');
            } else if (userLanguage in specialLanguageCases) {
              console.log('your language is a supported special case', specialLanguageCases[userLanguage]);
              downloadDictionaryKey = specialLanguageCases[userLanguage];
            } else {
              const closestLanguageMatch = listOfSupportedLanguages.filter(
                (language) => language.substr(0, 2) === userLanguage.substr(0, 2)
              );
              if (closestLanguageMatch.length) {
                console.log('your language is not supported but there\'s a similar language,', closestLanguageMatch[0]);
                downloadDictionaryKey = closestLanguageMatch[0];
              } else {
                console.log('sorry, no spell checking support for your language');
              }
            }

            if (downloadDictionaryKey) {
              console.log('we should download the dictionary');

              // https://raw.githubusercontent.com/wooorm/dictionaries/master/dictionaries/en-US/index.aff
              const dictBaseUrl = `https://raw.githubusercontent.com/wooorm/dictionaries/master/dictionaries/${downloadDictionaryKey}/index`
              // Use this ^ with this v to download the language files and put them in the right spot

              let affFile = fs.createWriteStream(userLanguageAffFile);
              let affRequest = https.get(`${dictBaseUrl}.aff`, (response) => {
                response.pipe(affFile);
              });

              affFile.on('error', (err) => {
                console.log('aff error downloading', err);
              });
              affFile.on('finish', (finished) => {
                console.log('aff finished downloading', finished);
              });

              let dicFile = fs.createWriteStream(userLanguageDicFile);
              let dicRequest = https.get(`${dictBaseUrl}.dic`, (response) => {
                response.pipe(dicFile);
              });

              dicFile.on('error', (err) => {
                console.log('dic error downloading', err);
              });
              dicFile.on('finish', (finished) => {
                console.log('dic finished downloading', finished);
              });

              // init the spellchecker by sending an event
            }


          }
        });
      });
    } else {
      console.log('the dictionary files already exist');
      // init the spellchecker by sending an event
    }

  });
}
