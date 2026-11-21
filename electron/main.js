const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    minWidth: 420,
    minHeight: 600,
    title: 'BD - Birthday & Contacts Manager',
    backgroundColor: '#0F172A',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links (mailto:, tel:, https://wa.me/, OAuth links) in the user's default OS handler
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const devServerUrl = process.env.EXPO_WEB_URL || 'http://localhost:8081';
  const prodIndex = path.join(__dirname, '..', 'dist', 'index.html');

  if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
    // Check if static dist exists or connect to Expo web dev server
    mainWindow.loadURL(devServerUrl).catch(() => {
      if (fs.existsSync(prodIndex)) {
        mainWindow.loadFile(prodIndex);
      }
    });
  } else {
    mainWindow.loadFile(prodIndex);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
