export const viewMenuTemplate = {
  label: "View",
  submenu: [
    {
      role: "toggleFullScreen",
    },
    {
      role: "reload",
    },
    {
      type: "separator",
    },
    {
      role: "resetZoom",
    },
    // Having two items to get the zoom-in functionality is necessary due to a bug in Electron
    // Without doing this, either the keyboard shortcut is displayed wrong, or zooming in doesn't work
    // See: https://github.com/electron/electron/issues/15496
    {
      role: "zoomIn",
    },
    {
      role: "zoomin",
      accelerator: "CommandOrControl+=",
      visible: false,
      enabled: true,
    },
    {
      role: "zoomOut",
    },
  ],
};
