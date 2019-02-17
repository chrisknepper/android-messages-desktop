// Convenient way of opening links in external browser, not in the app.
import { shell } from 'electron';
import { MEDIA_DOWNLOAD_IDENTIFIER } from '../constants';

const getLinkAddressFromElementAndOpen = (element) => {
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
    event.preventDefault();
    shell.openExternal(href);
  } else if (element.parentElement) {
    getLinkAddressFromElementAndOpen(element.parentElement);
  }
};

const handleExternalLinks = (event) => {
  getLinkAddressFromElementAndOpen(event.target);
};

const setupLinksListener = (doc) => {
  if (doc && typeof doc === 'object' && 'addEventListener' in doc) {
    doc.addEventListener('click', handleExternalLinks, false);
  }
}

export {
  setupLinksListener
};
