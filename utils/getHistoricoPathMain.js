const path = require('path');
const { app } = require('electron');

function getHistoricoPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'historico_sorteio.json');
}

module.exports = { getHistoricoPath };