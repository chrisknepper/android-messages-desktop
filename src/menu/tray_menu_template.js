import { app } from 'electron';

export const trayMenuTemplate = [
  {
    label: 'Toggle Show/Hide',
    click: () => {
      if (app.mainWindow) {
        if (app.mainWindow.isVisible()) {
          app.hide();
        } else {
          app.show();
          app.focus();
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
