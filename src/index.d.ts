import { CustomBrowserWindow } from "./helpers/window";

declare global {
  interface Window {
    getUserImg: (name: string) => Promise<string | undefined>;
  }

  namespace Electron {
    interface App {
      mainWindow?: CustomBrowserWindow;
    }
  }
}
