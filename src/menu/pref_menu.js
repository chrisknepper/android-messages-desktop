import settings from "electron-settings";

export const prefMenu = {
  label: "Preferences",
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
    }
  ]
};
