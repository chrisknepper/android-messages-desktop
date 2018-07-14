// Provide context menus (copy, paste, save image, etc...) for right-click interaction.
// Must not contain certain newer JS syntaxes to allow use inside a webview.

const remote = require('electron').remote;

const Menu = remote.Menu;

const standardMenuTemplate = [
  {
    label: 'Copy',
    role: 'copy',
  },
  {
    type: 'separator',
  },
  {
    label: 'Select All',
    role: 'selectall',
  }
];

const textMenuTemplate = [
  {
    label: 'Undo',
    role: 'undo',
  },
  {
    label: 'Redo',
    role: 'redo',
  },
  {
    type: 'separator',
  },
  {
    label: 'Cut',
    role: 'cut',
  },
  {
    label: 'Copy',
    role: 'copy',
  },
  {
    label: 'Paste',
    role: 'paste',
  },
  {
    type: 'separator',
  },
  {
    label: 'Select All',
    role: 'selectall',
  }
];

const standardInputMenu = Menu.buildFromTemplate(standardMenuTemplate);
const textInputMenu = Menu.buildFromTemplate(textMenuTemplate);

const popupContextMenu = (event) => {
  switch (event.target.nodeName) {
    case 'VIDEO':
    case 'IMG':
      if (event.target.src && event.target.src.length) {
        let mediaType = event.target.nodeName === 'IMG' ? 'Image' : 'Video';
        const mediaInputMenu = Menu.buildFromTemplate([{
          label: `Save ${mediaType} As...`,
          click: () => {
            // This call *would* do this in one line, but is only a thing in IE (???)
            // document.execCommand('SaveAs', true, event.target.src);
            const link = document.createElement('a');
            link.href = event.target.src;
            // Leaving the URL root results in the file extension being truncated.
            // The resulting filename from this also appears to be consistent with
            // saving the image via dragging or the Chrome context menu...winning!
            link.download = event.target.src.replace('blob:https://messages.android.com/', '');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }]);
        mediaInputMenu.popup({
          window: remote.getCurrentWindow(),
          callback: () => {
            mediaInputMenu = null; // Unsure if memory would leak without this (Clean up, clean up, everybody do your share)
          }
        });
      }
      break;
    default:
      if (event.target.isContentEditable) {
        textInputMenu.popup(remote.getCurrentWindow());
      } else { // Omit options pertaining to input fields if this isn't one
        standardInputMenu.popup(remote.getCurrentWindow());
      }
  }
};

module.exports = popupContextMenu;
