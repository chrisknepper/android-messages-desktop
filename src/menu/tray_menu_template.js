import { app } from 'electron';
import { IS_MAC } from '../constants';

export const trayMenuTemplate = [
  {
    label: 'Show/Hide Android Messages',
    click: () => {
      if (app.mainWindow) {
        if (app.mainWindow.isVisible()) {
          if (IS_MAC) {
            app.hide();
          } else {
            app.mainWindow.hide();
          }
        } else {
          app.mainWindow.show();
        }
      }
    }
  },
  {
    type: 'separator'
  },
  {
    label: 'Quit Android Messages',
    click: () => {
        app.quit();
    }
  }
];
