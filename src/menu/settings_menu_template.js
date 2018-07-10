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
      label: "Start In Tray",
      type: "checkbox",
      click: (item, window) => {
        const startInTrayPref = !settings.get("startInTrayPref");
        settings.set("startInTrayPref", startInTrayPref);
        item.checked = startInTrayPref;
      }
    }
  ]
};
