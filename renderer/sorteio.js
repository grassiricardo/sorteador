const Papa = require('papaparse');
const fs2 = require('fs');
const path2 = require('path');
const { v4: uuidv4_2 } = require('uuid');

let sorteio = JSON.parse(fs2.readFileSync(path2.join(__dirname, '../data/sorteio.json')));
const { getHistoricoPath } = require('../utils/getHistoricoPathRenderer');
const historicoPath = getHistoricoPath();
let historico = JSON.parse(fs2.readFileSync(historicoPath));

const listaItens = document.getElementById('itens');
sorteio.itens.forEach((item, index) => {
  const li = document.createElement('li');
  li.id = `item-${index}`;
  updateItemDisplay(item, li);
  listaItens.appendChild(li);
});

atualizarVisibilidadeExportar();

function updateItemDisplay(item, liElement) {
  const ganhadorFinal = [...historico]
    .reverse()
    .find(h => h.item === item);

  liElement.innerHTML = `${item} → ${ganhadorFinal ? ganhadorFinal.ganhador : 'Sem ganhador ainda!'} `;

  if (ganhadorFinal) {
    const refazerBtn = document.createElement('button');
    refazerBtn.textContent = 'Refazer';
    refazerBtn.classList.add('refazer');
    refazerBtn.onclick = () => refazerSorteio(item);
    liElement.appendChild(refazerBtn);
  }
}

function getGanhadoresAtuais() {
  const ganhadoresPorItem = {};
  [...historico].forEach(h => {
    ganhadoresPorItem[h.item] = h;
  });
  return Object.values(ganhadoresPorItem).map(h => h.ganhador);
}

function sortearPessoa() {
  mostrarLoader();

  setTimeout(() => {
    const sheetUrl = getSheetCSVUrl(sorteio.sheet_url);

    fetch(sheetUrl)
    .then(res => res.text())
    .then(csvText => {
      const parsed = Papa.parse(csvText, { header: true });
      const data = parsed.data;
      const { dialog } = require('@electron/remote');
      const path = require('path');

      const ganhadoresJaSorteados = getGanhadoresAtuais();

      const participantes = data
        .map(row => {
          const nome = row['Nome']?.trim();
          const email = row['Email']?.trim();
          const empresa = row['Empresa']?.trim();

          let identificador = '';

          if (empresa) {
            identificador = `${nome} (${empresa})`;
          } else if (email) {
            const [usuario, dominio] = email.split('@');
            const inicio = usuario?.slice(0, 3) || '';
            identificador = `${nome} (${inicio}...@${dominio})`;
          } else {
            identificador = nome;
          }

          return nome && identificador ? identificador : null;
        })
        .filter(p => p && !ganhadoresJaSorteados.includes(p));

      const proximoItem = sorteio.itens.find(item => {
        return !historico.some(h => h.item === item);
      });

      if (!proximoItem) {
        dialog.showMessageBox({
          type: 'info',
          icon: path.join(__dirname, '../assets/sorteador.png'),
          title: 'Sorteador',
          message: 'Todos os itens já foram sorteados.'
        });
        esconderLoader();
        return;
      }

      if (participantes.length === 0) {
        dialog.showMessageBox({
          type: 'info',
          icon: path.join(__dirname, '../assets/sorteador.png'),
          title: 'Sorteador',
          message: 'Não há mais participantes disponíveis.'
        });
        esconderLoader();
        return;
      }

      const ganhador = participantes[Math.floor(Math.random() * participantes.length)];
      const novoId = uuidv4_2();

      historico.push({
        id: novoId,
        sorteio_id: sorteio.id,
        item: proximoItem,
        ganhador,
        data: new Date().toISOString()
      });

      salvarHistoricoOrdenado();

      const li = document.getElementById(`item-${sorteio.itens.indexOf(proximoItem)}`);
      updateItemDisplay(proximoItem, li);
      verificarFimDoSorteio();
      atualizarVisibilidadeExportar();
      esconderLoader();
    })
    .catch(error => {
      esconderLoader();
      console.error('Erro ao carregar a planilha:', error);
      dialog.showMessageBox({
        type: 'error',
        icon: path.join(__dirname, '../assets/sorteador.png'),
        title: 'Sorteador',
        message: 'Erro ao carregar a planilha. Verifique o link inserido..'
      });
    });
  }, 4000);
}

function refazerSorteio(item) {
  mostrarLoader();

  setTimeout(() => {
    const sheetUrl = getSheetCSVUrl(sorteio.sheet_url);
    fetch(sheetUrl)
    .then(res => res.text())
    .then(csvText => {
      const parsed = Papa.parse(csvText, { header: true });
      const data = parsed.data;
      const { dialog } = require('@electron/remote');
      const path = require('path');

      const ganhadoresJaSorteados = getGanhadoresAtuais()
        .filter(g => {
          const ultimo = [...historico].reverse().find(h => h.item === item);
          return g !== ultimo?.ganhador;
        });

      const participantes = data
        .map(row => {
          const nome = row['Nome']?.trim();
          const email = row['Email']?.trim();
          const empresa = row['Empresa']?.trim();

          let identificador = '';

          if (empresa) {
            identificador = `${nome} (${empresa})`;
          } else if (email) {
            const [usuario, dominio] = email.split('@');
            const inicio = usuario?.slice(0, 3) || '';
            identificador = `${nome} (${inicio}...@${dominio})`;
          } else {
            identificador = nome;
          }

          return nome && identificador ? identificador : null;
        })
        .filter(p => p && !ganhadoresJaSorteados.includes(p));

      if (participantes.length === 0){
        dialog.showMessageBox({
          type: 'info',
          icon: path.join(__dirname, '../assets/sorteador.png'),
          title: 'Sorteador',
          message: 'Não há mais participantes disponíveis para refazer o sorteio.'
        });
        esconderLoader();
        return;
      } 

      const novoGanhador = participantes[Math.floor(Math.random() * participantes.length)];
      const novoId = uuidv4_2();

      historico.push({
        id: novoId,
        sorteio_id: sorteio.id,
        item,
        ganhador: novoGanhador,
        data: new Date().toISOString()
      });

      salvarHistoricoOrdenado();

      const li = document.getElementById(`item-${sorteio.itens.indexOf(item)}`);
      updateItemDisplay(item, li);
      verificarFimDoSorteio();
      atualizarVisibilidadeExportar();
      esconderLoader();
    });
  }, 4000);
}

function salvarHistoricoOrdenado() {
  historico.sort((a, b) => new Date(a.data) - new Date(b.data));
  fs2.writeFileSync(historicoPath, JSON.stringify(historico, null, 2));
}

function getSheetCSVUrl(originalUrl) {
  if (originalUrl.includes('/edit')) {
    const match = originalUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = originalUrl.match(/gid=(\d+)/);
    const sheetId = match ? match[1] : '';
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }
  return originalUrl;
}

function exportarCSV() {
  const { dialog } = require('electron').remote || require('@electron/remote');
  const csv = Papa.unparse(historico);
  const path = require('path');

  dialog.showSaveDialog({
    title: 'Salvar histórico do sorteio',
    defaultPath: `sorteio_${sorteio.id}.csv`,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs2.writeFileSync(result.filePath, csv);
      dialog.showMessageBox({
        type: 'info',
        icon: path.join(__dirname, '../assets/sorteador.png'),
        title: 'Sorteador',
        message: 'Histórico exportado com sucesso!'
      });
    }
  }).catch(err => {
    console.error('Erro ao salvar arquivo:', err);
    dialog.showMessageBox({
      type: 'info',
      icon: path.join(__dirname, '../assets/sorteador.png'),
      title: 'Sorteador',
      message: 'Ocorreu um erro ao tentar salvar o arquivo.'
    });
  });
}

function atualizarVisibilidadeExportar() {
  const exportBtn = document.querySelector('button[onclick="exportarCSV()"]');
  const existeAlgumSorteio = historico.length > 0;
  if (exportBtn) {
    exportBtn.style.display = existeAlgumSorteio ? 'inline-block' : 'none';
  }
}

function verificarFimDoSorteio() {
  const itensSorteados = historico.map(h => h.item);
  const todosSorteados = sorteio.itens.every(item => itensSorteados.includes(item));
  if (todosSorteados) {
    document.getElementById('finalizacao').style.display = 'block';
  }
}

function voltarTela() {
  fs2.writeFileSync(path2.join(__dirname, '../data/sorteio.json'), '');
  fs2.writeFileSync(historicoPath, '[]');
  window.location.href = "index.html";
}

function comecarDoZero() {
  fs2.writeFileSync(path2.join(__dirname, '../data/sorteio.json'), '');
  fs2.writeFileSync(historicoPath, '[]');
  window.location.href = "index.html";
}

function iniciarNovoSorteio() {
  const novoId = uuidv4_2();
  const novoSorteio = {
    ...sorteio,
    id: novoId
  };
  fs2.writeFileSync(path2.join(__dirname, '../data/sorteio.json'), JSON.stringify(novoSorteio, null, 2));
  fs2.writeFileSync(historicoPath, '[]');
  window.location.reload();
}

function mostrarLoader() {
  document.getElementById('loader').style.display = 'block';
}

function esconderLoader() {
  document.getElementById('loader').style.display = 'none';
}

window.sortearPessoa = sortearPessoa;
window.exportarCSV = exportarCSV;