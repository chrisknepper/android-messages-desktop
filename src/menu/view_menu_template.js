export const viewMenuTemplate = {
  label: "View",
  submenu: [
    {
      role: "toggleFullScreen",
    },
    {
      role: "reload"
    },
    { 
      type: 'separator'
    },
    {
      role: "resetZoom"
    },
    {
      role: "zoomIn"
    },
    {
      role: 'zoomin',
      accelerator: 'CommandOrControl+=',
      visible: false,
      enabled: true,
    },
    {
      role: "zoomOut"
    },
  ]
};
