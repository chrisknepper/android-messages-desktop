import {
  ContextMenuParams,
  MenuItemConstructorOptions,
  remote,
} from "electron";

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
        if (params.misspelledWord) {
          textMenuTemplateCopy.unshift({ type: "separator" });
          textMenuTemplateCopy.unshift({
            label: "Add to Dictionary",
            click: () =>
              app.mainWindow?.webContents.session.addWordToSpellCheckerDictionary(
                params.misspelledWord
              ),
          });
          textMenuTemplateCopy.unshift({ type: "separator" });
          for (const suggestion of params.dictionarySuggestions.reverse()) {
            textMenuTemplateCopy.unshift({
              label: suggestion,
              click: () =>
                remote.getCurrentWebContents().replaceMisspelling(suggestion),
            });
          }
        }
        const textInputMenu = Menu.buildFromTemplate(textMenuTemplateCopy);
        textInputMenu.popup();
      } else {
        // Omit options pertaining to input fields if this isn't one
        const standardInputMenu = Menu.buildFromTemplate(standardMenuTemplate);
        standardInputMenu.popup();
      }
  }
};
