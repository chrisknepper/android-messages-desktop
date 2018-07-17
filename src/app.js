import path from 'path';

import './stylesheets/main.css';

import './helpers/external_links.js';

import { remote, shell } from 'electron';
import url from 'url';
import jetpack from 'fs-jetpack';
import { IS_MAC, IS_DEV } from './constants';

const state = {
  loaded: false,
  unreadNotificationCount: 0
};

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());

androidMessagesWebview.addEventListener('did-start-loading', () => {

  // Intercept request for notifications and accept it
  androidMessagesWebview.getWebContents().session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL()

    if (permission === 'notifications') {
      /*
       * We always get a "notification" in dev mode when the app starts due to calling setPermissionRequestHandler,
       * which accepts the permission to send browser notifications on behalf of the user--this false
       * notification should not result in an indicator for the user to see.
       * TODO: Figure out a way to modify and override notifications to solve this and other issues.
       */
      if (IS_MAC) {
        if (app.mainWindow && !(app.mainWindow.isFocused())) {
          state.unreadNotificationCount += 1;
          app.dock.setBadge('' + state.unreadNotificationCount);
        }
      }

      // TODO: Provide visual indicators for Windows/Linux, possibly via mainWindow.setOverlayIcon

      return callback(true); // Approve
    }

    if (!url.startsWith('https://messages.android.com')) {
      return callback(false); // Deny
    }
  });

  if (IS_MAC && app.mainWindow) {
    app.mainWindow.on('focus', () => {
      state.unreadNotificationCount = 0;
      app.dock.setBadge('');
    })
  }
});

androidMessagesWebview.addEventListener('did-finish-load', () => { // just before onLoad
  console.log('finished loading');

});

androidMessagesWebview.addEventListener('did-stop-loading', () => { // coincident with onLoad, can fire multiple times
  console.log('done loading');
  if (!state.loaded) {
    state.loaded = true;
    loader.classList.add('hidden');
    if (IS_DEV) {
      androidMessagesWebview.getWebContents().openDevTools();
    }
    app.mainWindow.on('focus', () => {
      androidMessagesWebview.dispatchEvent(new Event('focus'));
    });
  }

});

androidMessagesWebview.addEventListener('dom-ready', () => {
  console.log('dom ready');
  //Notification.requestPermission(); // Could be necessary for initial notification, need to test
});

androidMessagesWebview.addEventListener('new-window', (e) => {
  const protocol = url.parse(e.url).protocol;
  if (protocol === 'http:' || protocol === 'https:') {
    shell.openExternal(e.url); // Open clicked links in user's default browser
  }
});
