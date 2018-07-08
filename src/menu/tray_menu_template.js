import { app } from 'electron';
import { IS_MAC } from './constants';

export const trayMenuTemplate = [
  {
    label: 'Toggle Show/Hide',
    click: () => {
      if (app.mainWindow) {
        if (app.mainWindow.isVisible()) {
          if (IS_MAC) {
            app.hide();
          } else {
            app.mainWindow.show();
          }
        } else {
          if (IS_MAC) {
            app.show();
            app.focus();
          } else {
            app.mainWindow.show();
          }
        }
      }
    }
  },
  {
    type: 'separator'
  },
  {
    label: 'Quit',
    click: () => {
        app.quit();
    }
  }
];
