import './stylesheets/main.css';

import { ipcRenderer, remote } from 'electron';
import { EVENT_UPDATE_USER_SETTING, IS_DEV, IS_MAC } from './constants';

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

  androidMessagesWebview.getWebContents().session.webRequest.onHeadersReceived({
    // Only run this code on requests for which the URL is in the following array.
    // The SRC of the webview is the same context as the preload script.
    urls: ['https://messages.android.com/'] }, (details, callback) => {
      /*
       * Google sends several directives in the content-security-policy header which restrict what kind of JS can run and where it can originate.
       * This will break our spell checking (because it instantiates a WebAssembly module) unless we include unsafe-eval for the root page.
       * We must do this before any stricter rules are specified since they can only "further restrict capabilities" as they are defined.
       * We therefore must modify the rule Google sends by detecting and prepending the next-least-strict rule sent, "unsafe-inline."
       * We must use double quotes since content-security-policy directive rules need single quotes as part of the string.
       *
       * Doing it this way allows us to keep the rest of Google's security rules to maximize security while still allowing WebAssembly to work.
       *
       * If this ever stops working, we can force WebAssembly to work by completely nixing the content-security-policy header, done via:
       * delete modifiedHeaders['content-security-policy'];
       *
       * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#Multiple_content_security_policies
       */
      const modifiedHeaders = {
        ...details.responseHeaders
      };
      const firstCSP = modifiedHeaders['content-security-policy'][0];

      if (firstCSP.includes("'unsafe-inline'")) {
        modifiedHeaders['content-security-policy'][0] = firstCSP.replace("'unsafe-inline'", "'unsafe-eval' 'unsafe-inline'");
      }

      callback({
        responseHeaders: modifiedHeaders
      });
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

  // Make the title centered so that it won't get weirdly covered by the traffic light on mac
  // 10px should make it look roughly centered
  // TODO: Use more sophisticated CSS which doesn't rely on Google's obfuscated class names to do this
  if (IS_MAC) {
    androidMessagesWebview.insertCSS('div.kegSbc{width:100%}h1.tuQbQc{text-align:center; transform: translateX(10px)}');
  }
});

// Forward event from main process to webview bridge
ipcRenderer.on(EVENT_UPDATE_USER_SETTING, (event, { enterToSend }) => {
  androidMessagesWebview.getWebContents().send(EVENT_UPDATE_USER_SETTING, {
    enterToSend
  });
});
