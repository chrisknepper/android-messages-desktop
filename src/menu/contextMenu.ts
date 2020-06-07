import {
  ContextMenuParams,
  ipcRenderer,
  MenuItemConstructorOptions,
  remote,
} from "electron";
import { EVENT_SPELL_ADD_CUSTOM_WORD } from "../helpers/constants";

const { Menu, app } = remote;

// WARNING THIS IS THE ONLY PLACE LEFT WITH FORCE TYPECASTS TO ANY
// IT HAS NO SIDE EFFECTS
// I WOULD NOT DO IT BUT I AM NOT POSITIVE HOW TO PROPERLY TYPE IT

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
    window: app.mainWindow,
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
              const link = document.createElement("a");
              link.href = params.srcURL;
              link.download = params.srcURL.replace(
                "blob:https://messages.google.com/",
                ""
              );
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
        if (window.spellCheckHandler && params.misspelledWord) {
          const booboo = params.selectionText;
          textMenuTemplateCopy.unshift({
            type: "separator",
          });
          textMenuTemplateCopy.unshift({
            label: `Add ${booboo} to Dictionary`,
            click: async () => {
              // Immediately clear red underline
              (event as any).sender.replaceMisspelling(booboo);
              // Add new custom word to dictionary for the current session
              // Until I restructure all this ts demands a default
              const localeKey =
                (await window.spellCheckHandler?.getSelectedDictionaryLanguage()) ||
                "en";
              window.spellCheckHandler?.addWord(localeKey, booboo);
              // Send new custom word to main process so it will be added to the dictionary at the start of future sessions
              ipcRenderer.send(EVENT_SPELL_ADD_CUSTOM_WORD, {
                newCustomWord: booboo,
              });
            },
          });

          const suggestions = (await window.spellCheckHandler.getSuggestion(
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
                    return (event as any).sender.replaceMisspelling(correction);
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
