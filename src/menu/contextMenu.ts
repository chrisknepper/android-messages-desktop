import { ContextMenuParams, Menu, MenuItemConstructorOptions } from "electron";
import { getMainWindow } from "../helpers/getMainWindow";
import { separator } from "./items/separator";

// WARNING THIS IS THE ONLY PLACE LEFT WITH FORCE TYPECASTS TO ANY
// IT HAS NO SIDE EFFECTS
// I WOULD NOT DO IT BUT I AM NOT POSITIVE HOW TO PROPERLY TYPE IT

const standardMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: "Copy",
    role: "copy",
  },
  separator,
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
  separator,
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
  separator,
  {
    label: "Select All",
    role: "selectAll",
  },
];

export const popupContextMenu = (
  _event: Electron.Event,
  params: ContextMenuParams
) => {
  let menu = Menu.buildFromTemplate(standardMenuTemplate);
  if (params.mediaType === "none" && params.isEditable) {
    const textMenuTemplateCopy = [...textMenuTemplate];
    if (params.misspelledWord) {
      textMenuTemplateCopy.unshift(
        { type: "separator" },
        {
          label: "Add to Dictionary",
          click: () =>
            getMainWindow()?.webContents.session.addWordToSpellCheckerDictionary(
              params.misspelledWord
            ),
        },
        { type: "separator" }
      );
      for (const suggestion of params.dictionarySuggestions.reverse()) {
        textMenuTemplateCopy.unshift({
          label: suggestion,
          click: () =>
            getMainWindow()?.webContents.replaceMisspelling(suggestion),
        });
      }
    }
    menu = Menu.buildFromTemplate(textMenuTemplateCopy);
  } else {
    menu = Menu.buildFromTemplate(standardMenuTemplate);
  }

  menu?.popup();
};
