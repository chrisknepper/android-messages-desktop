import { BrowserWindow } from "electron";

export function getMainWindow(): BrowserWindow | null {
  if (process.env.MAIN_WINDOW_ID != null) {
    return BrowserWindow.fromId(Number(process.env.MAIN_WINDOW_ID));
  }
  return null;
}
