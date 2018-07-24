import './stylesheets/main.css';

import './helpers/external_links.js';

import { remote, shell } from 'electron';
import url from 'url';
import { IS_DEV } from './constants';

const state = {
  loaded: false
};

const app = remote.app;

androidMessagesWebview.addEventListener('did-start-loading', () => {
  // Intercept request for notifications and accept it
  androidMessagesWebview.getWebContents().session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();

    if (permission === 'notifications') {
      /*
       * We always get a "notification" when the app starts due to calling setPermissionRequestHandler,
       * which accepts the permission to send browser notifications on behalf of the user.
       * This "notification" should fire before we start listening for notifications,
       * and should not cause problems.
       * TODO: Move this to a helper
       * TODO: Provide visual indicators for Linux, could set window (taskbar) icon, may also do for Windows
       */

      return callback(false); // Prevent the webview's notification from coming through (we roll our own)
    }

    if (!url.startsWith('https://messages.android.com')) {
      return callback(false); // Deny
    }
  });
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
      // Make sure the webview gets a focus event on its window/DOM when the app window does,
      // this makes automatic text input focus work.
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
