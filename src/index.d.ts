import { CustomBrowserWindow } from "./helpers/window";
import { Notification } from "electron";
import { SpellCheckerProvider } from "electron-hunspell";

declare global {
  interface Window {
    spellCheckHandler?: SpellCheckerProvider;
  }

  namespace Electron {
    interface App {
      mainWindow?: CustomBrowserWindow;
    }
  }

  namespace NodeJS {
    interface Global {
      currentNotification?: Notification;
    }
  }
}
