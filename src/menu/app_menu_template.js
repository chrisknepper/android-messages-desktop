import { app } from 'electron';
import { aboutMenuItem } from './items/about';
import { checkForUpdatesMenuItem } from './items/check_for_updates';
import settings from "electron-settings";

// This is the "Application" menu, which is only used on macOS
export const appMenuTemplate = {
    label: 'Android Messages',
    submenu: [,
        aboutMenuItem,
        checkForUpdatesMenuItem,
        {
            type: 'separator'
        },
        {
            label: 'Preferences',
            submenu: [
                {
                    label: "Enable Tray Icon",
                    type: "checkbox",
                    click: (item, window) => {
                        const trayEnabledPref = !settings.get("trayEnabledPref");
                        settings.set("trayEnabledPref", trayEnabledPref);
                        item.checked = trayEnabledPref;
                        //window.setAutoHideMenuBar(trayEnabledPref);
                    }
                }
            ]

        },
        {
            type: 'separator'
        },        
        {
            label: 'Hide Android Messages Desktop',
            accelerator: 'Command+H',
            click: () => app.hide()
        },
        {
            type: 'separator',
        },
        {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: () => app.quit(),
        }
    ]
};
