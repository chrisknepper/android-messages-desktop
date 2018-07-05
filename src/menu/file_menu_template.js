import { app } from 'electron';

export const fileMenuTemplate = {
    label: 'File',
    submenu: [{
        label: 'Quit Android Messages',
        click: () => app.quit()
    }]
};
