// Things relating to changing the way user input affect the app page go here
import { shell } from 'electron';
import { MEDIA_DOWNLOAD_IDENTIFIER } from '../../constants';

// We need to block all of these if we're disabling send on enter
const KEYBOARD_EVENTS = ['keyup', 'keypress', 'keydown'];

// Effectively private methods

// For whatever reason, this won't work if defined as a static method of InputManager
const blockEnterKeyEvent = (event) => {
    if (event.keyCode === 13) {
        event.stopPropagation();
    }
}

const getLinkAddressFromElementAndOpenInBrowser = (element) => {
    let href;

    if (element.nodeName === 'A') {
        if ('dataset' in element && MEDIA_DOWNLOAD_IDENTIFIER in element.dataset) {
            // Bail if this is a link created by the context_menu helper to download media. Electron takes care of showing
            // the file save dialog and it won't show if we proceed to preventDefault/openExternal.
            return;
        }
        href = element.getAttribute('href');
    }

    if (href) {
        // Convenient way of opening links in external browser, not in the app.
        event.preventDefault();
        shell.openExternal(href);
    } else if (element.parentElement) {
        getLinkAddressFromElementAndOpenInBrowser(element.parentElement);
    }
};

const handleExternalLinks = (event) => {
    getLinkAddressFromElementAndOpenInBrowser(event.target);
};

export default class InputManager {

    static handleEnterPrefToggle(enabled) {
        const addOrRemoveEventListener = (enabled ? window.removeEventListener : window.addEventListener);

        for (let ev of KEYBOARD_EVENTS) {
            addOrRemoveEventListener(ev, blockEnterKeyEvent, true);
        }
    }

    static setupLinksListener() {
        window.document.addEventListener('click', handleExternalLinks, false);
    }

};





