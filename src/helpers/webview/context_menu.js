// Provide context menus (copy, paste, save image, etc...) for right-click interaction.

import { ipcRenderer, remote } from 'electron';
import { EVENT_SPELL_ADD_CUSTOM_WORD, MEDIA_DOWNLOAD_IDENTIFIER } from '../../constants';

const { Menu } = remote;

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

const popupContextMenu = (event, params) => {
  // As of Electron 4, Menu.popup no longer accepts being called with the signature popup(remote.getCurrentWindow())
  // It must be passed as an object with the window key. Is this change silly? Yes. Will we know why it was done? No.
  const menuPopupArgs = {
    window: remote.getCurrentWindow()
  };

  switch (params.mediaType) {
    case 'video':
    case 'image':
      if (params.srcURL && params.srcURL.length) {
        let mediaType = params.mediaType[0].toUpperCase() + params.mediaType.slice(1);
        const mediaInputMenu = Menu.buildFromTemplate([{
          label: `Save ${mediaType} As...`,
          click: () => {
            // This call *would* do this in one line, but is only a thing in IE (???)
            // document.execCommand('SaveAs', true, params.srcURL);
            const link = document.createElement('a');
            link.href = params.srcURL;
            // Leaving the URL root results in the file extension being truncated.
            // The resulting filename from this also appears to be consistent with
            // saving the image via dragging or the Chrome context menu...winning!
            link.download = params.srcURL.replace('blob:https://messages.android.com/', '');
            // InputManager.handleExternalLinks handles all link clicks...and this is technically a link.
            // So we mark the link with a data attribute so handleExternalLinks can know to leave it alone.
            link.dataset[MEDIA_DOWNLOAD_IDENTIFIER] = true;
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
      if (params.isEditable) {
        const textMenuTemplateCopy = [...textMenuTemplate];
        if (window.spellCheckHandler && params.misspelledWord && typeof params.misspelledWord === 'string') {
          const booboo = params.selectionText;
          textMenuTemplateCopy.unshift({
            type: 'separator'
          });
          textMenuTemplateCopy.unshift({
            label: `Add ${booboo} to Dictionary`,
            click: () => {
              // Immediately clear red underline
              event.sender.replaceMisspelling(booboo);
              // Add new custom word to dictionary for the current session
              window.spellCheckHandler.spellCheckerTable[window.spellCheckHandler.selectedDictionary].spellChecker.addWord(booboo);
              // Send new custom word to main process so it will be added to the dictionary at the start of future sessions
              ipcRenderer.send(EVENT_SPELL_ADD_CUSTOM_WORD, {
                newCustomWord: booboo
              });
            }
          });
          // Hunspell always seems to return the best choices at the end of the array, so reverse it, then limit to 8 suggestions
          const suggestions = window.spellCheckHandler.getSuggestion(params.misspelledWord).reverse().slice(0, 8);
          if (suggestions && suggestions.length) {
            textMenuTemplateCopy.unshift({
              type: 'separator'
            });
            suggestions.map((correction) => {
              let item = {
                label: correction,
                click: () => {
                  return event.sender.replaceMisspelling(correction);
                }
              };

              textMenuTemplateCopy.unshift(item);
            });
          }
        }
        const textInputMenu = Menu.buildFromTemplate(textMenuTemplateCopy);
        textInputMenu.popup(menuPopupArgs);
      } else { // Omit options pertaining to input fields if this isn't one
        const standardInputMenu = Menu.buildFromTemplate(standardMenuTemplate);
        standardInputMenu.popup(menuPopupArgs);
      }
  }
};

export {
  popupContextMenu
};
