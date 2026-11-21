const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('bdDesktop', {
  isElectron: true,
  platform: process.platform,
});
