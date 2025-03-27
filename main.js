// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const remoteMain = require('@electron/remote/main');

// Garantir arquivos iniciais
const dataFolder = path.join(__dirname, 'data');
const historicoPath = path.join(dataFolder, 'historico_sorteio.json');
const sorteioPath = path.join(dataFolder, 'sorteio.json');

if (!fs.existsSync(historicoPath)) {
  fs.writeFileSync(historicoPath, '[]');
}

if (!fs.existsSync(sorteioPath)) {
  fs.writeFileSync(sorteioPath, '{}');
}

const limparBanco = () => {
  fs.writeFileSync(historicoPath, '[]');
  fs.writeFileSync(sorteioPath, '{}');
};

remoteMain.initialize();

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
