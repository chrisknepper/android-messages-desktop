import settings from "electron-settings";

export const settingsMenu = {
  label: "Settings",
  submenu: [
    {
      label: "Toggle Auto Hide Menu Bar",
      type: "checkbox",
      click: (item, window) => {
        const autoHideMenuPref = !settings.get("autoHideMenuPref");
        settings.set("autoHideMenuPref", autoHideMenuPref);
        item.checked = autoHideMenuPref;
        window.setAutoHideMenuBar(autoHideMenuPref);
      }
    },
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
};
