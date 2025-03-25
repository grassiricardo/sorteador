const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const remoteMain = require('@electron/remote/main');
const limparBanco = () => {
  const historicoPath = path.join(__dirname, 'data/historico_sorteio.json');
  if (fs.existsSync(historicoPath)) {
    fs.writeFileSync(historicoPath, '[]');
  }
};

remoteMain.initialize();

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets/sorteador_icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  remoteMain.enable(win.webContents);

  win.loadFile('renderer/index.html')
}

app.whenReady().then(() => {
  limparBanco();
  createWindow();
});