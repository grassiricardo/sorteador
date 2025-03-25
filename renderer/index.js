const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

function salvarSorteio() {
  const sheetUrl = document.getElementById('sheetUrl').value;
  const items = document.getElementById('items').value.split('\n').map(i => i.trim()).filter(Boolean);

  const sorteio = {
    id: uuidv4(),
    sheet_url: sheetUrl,
    itens: items,
    created_at: new Date().toISOString()
  };

  fs.writeFileSync(path.join(__dirname, '../data/sorteio.json'), JSON.stringify(sorteio, null, 2));
  fs.writeFileSync(path.join(__dirname, '../data/historico_sorteio.json'), '[]');
  window.location.href = 'sorteio.html';
}