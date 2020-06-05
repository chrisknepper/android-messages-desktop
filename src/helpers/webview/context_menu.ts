// Provide context menus (copy, paste, save image, etc...) for right-click interaction.

import {
  ipcRenderer,
  MenuItemConstructorOptions,
  remote,
  ContextMenuParams,
} from "electron";
import { EVENT_SPELL_ADD_CUSTOM_WORD } from "../../constants";

type TOFIX = any;

const { Menu } = remote;

const standardMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: "Copy",
    role: "copy",
  },
  {
    type: "separator",
  },
  {
    label: "Select All",
    role: "selectAll",
  },
];

const textMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: "Undo",
    role: "undo",
  },
  {
    label: "Redo",
    role: "redo",
  },
  {
    type: "separator",
  },
  {
    label: "Cut",
    role: "cut",
  },
  {
    label: "Copy",
    role: "copy",
  },
  {
    label: "Paste",
    role: "paste",
  },
  {
    type: "separator",
  },
  {
    label: "Select All",
    role: "selectAll",
  },
];

export const popupContextMenu = async (
  event: Electron.Event,
  params: ContextMenuParams
): Promise<void> => {
  // As of Electron 4, Menu.popup no longer accepts being called with the signature popup(remote.getCurrentWindow())
  // It must be passed as an object with the window key. Is this change silly? Yes. Will we know why it was done? No.
  const menuPopupArgs = {
    window: remote.getCurrentWindow(),
  };

  switch (params.mediaType) {
    case "video":
    case "image":
      if (params.srcURL && params.srcURL.length) {
        const mediaType =
          params.mediaType[0].toUpperCase() + params.mediaType.slice(1);
        const mediaInputMenu = Menu.buildFromTemplate([
          {
            label: `Save ${mediaType} As...`,
            click: () => {
              // This call *would* do this in one line, but is only a thing in IE (???)
              // document.execCommand('SaveAs', true, params.srcURL);
              const link = document.createElement("a");
              link.href = params.srcURL;
              /*
               * Leaving the URL root results in the file extension being truncated.
               * The resulting filename from this also appears to be consistent with
               * saving the image via dragging or the Chrome context menu...winning!
               *
               * Since the URL change from messages.android.com, the URL root of the files
               * is messages.google.com (note the lack of /web/ in the path)
               */
              link.download = params.srcURL.replace(
                "blob:https://messages.google.com/",
                ""
              );
              // Trigger save dialog by clicking the "link"
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
          },
        ]);
        mediaInputMenu.popup({
          window: remote.getCurrentWindow(),
          callback: () => {
            (mediaInputMenu as unknown) = null; // Unsure if memory would leak without this (Clean up, clean up, everybody do your share)
          },
        });
      }
      break;
    default:
      if (params.isEditable) {
        const textMenuTemplateCopy = [...textMenuTemplate];
        if (
          (window as TOFIX).spellCheckHandler &&
          params.misspelledWord &&
          typeof params.misspelledWord === "string"
        ) {
          const booboo = params.selectionText;
          textMenuTemplateCopy.unshift({
            type: "separator",
          });
          textMenuTemplateCopy.unshift({
            label: `Add ${booboo} to Dictionary`,
            click: async () => {
              // Immediately clear red underline
              (event as TOFIX).sender.replaceMisspelling(booboo);
              // Add new custom word to dictionary for the current session
              const localeKey = await (window as TOFIX).spellCheckHandler.getSelectedDictionaryLanguage();
              (window as TOFIX).spellCheckHandler.spellCheckerTable[
                localeKey
              ].spellChecker.addWord(booboo);
              // Send new custom word to main process so it will be added to the dictionary at the start of future sessions
              ipcRenderer.send(EVENT_SPELL_ADD_CUSTOM_WORD, {
                newCustomWord: booboo,
              });
            },
          });

          const suggestions = (await (window as TOFIX).spellCheckHandler.getSuggestion(
            params.misspelledWord
          )) as string[];
          if (suggestions && suggestions.length) {
            textMenuTemplateCopy.unshift({
              type: "separator",
            });

            // Hunspell always seems to return the best choices at the end of the array, so reverse it, then limit to 8 suggestions
            suggestions
              .reverse()
              .slice(0, 8)
              .map((correction) => {
                const item = {
                  label: correction,
                  click: () => {
                    return (event as TOFIX).sender.replaceMisspelling(
                      correction
                    );
                  },
                };

                textMenuTemplateCopy.unshift(item);
              });
          }
        }
        const textInputMenu = Menu.buildFromTemplate(textMenuTemplateCopy);
        textInputMenu.popup(menuPopupArgs);
      } else {
        // Omit options pertaining to input fields if this isn't one
        const standardInputMenu = Menu.buildFromTemplate(standardMenuTemplate);
        standardInputMenu.popup(menuPopupArgs);
      }
  }
};
