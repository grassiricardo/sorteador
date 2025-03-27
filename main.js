const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const remoteMain = require('@electron/remote/main');
const { getHistoricoPath } = require('./utils/getHistoricoPathMain');

remoteMain.initialize();

const limparBanco = () => {
  const historicoPath = getHistoricoPath();
  fs.writeFileSync(historicoPath, '[]');
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/sorteador_icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  remoteMain.enable(win.webContents);
  win.maximize();

  win.loadFile('renderer/index.html');
}

app.whenReady().then(() => {
  limparBanco();
  createWindow();
});