import "./stylesheets/main.css";

import "./helpers/context_menu.js";
import "./helpers/external_links.js";

const state = {
  loaded: false
};

import { remote } from "electron";
import jetpack from "fs-jetpack";

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());

// TODO: Insert or update webview here instead of in the HTML file to make testing (swapping URLs) easier

androidMessagesWebview.addEventListener('did-start-loading', () => {
  // Intercept request for notifications and accept it
  androidMessagesWebview.getWebContents().session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL()
    

    if (permission === 'notifications') {
      return callback(true) // Approve
    }

    // if (!url.startsWith('https://my-website.com')) {
    //   return callback(false) // Deny
    // }
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
  }
  
});

androidMessagesWebview.addEventListener('dom-ready', () => {
  console.log('dom ready');
  //Notification.requestPermission(); // Could be necessary for initial notification, need to test
});
