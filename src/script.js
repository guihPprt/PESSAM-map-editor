let history = [];
let redoStack = [];

function saveHistory() {
  history.push([...map]); // salva cópia do estado atual
  redoStack = []; // limpa refazer ao fazer nova ação
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z') {
    if (history.length > 0) {
      redoStack.push([...map]);
      map = history.pop();
      drawMap();
    }
  } else if (e.ctrlKey && e.key === 'y') {
    if (redoStack.length > 0) {
      history.push([...map]);
      map = redoStack.pop();
      drawMap();
    }
  }
});

let loadedMaps = {};

document.getElementById('mapUpload').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      loadedMaps = data;

      const selector = document.getElementById('mapSelector');
      selector.innerHTML = '';
      Object.keys(data).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
      });

      selector.style.display = 'inline-block';
      selector.onchange = () => loadMap(selector.value);
      loadMap(selector.value); // carrega o primeiro por padrão
    } catch (err) {
      alert("Erro ao carregar mapa: " + err.message);
    }
  };
  reader.readAsText(file);
});

function loadMap(name) {
  const loaded = loadedMaps[name];
  if (!loaded || !loaded.width || !loaded.height || !Array.isArray(loaded.map)) {
    return alert("Formato inválido");
  }

  document.getElementById('mapName').value = name;
  document.getElementById('mapWidth').value = loaded.width;
  document.getElementById('mapHeight').value = loaded.height;
  width = loaded.width;
  height = loaded.height;
  map = [...loaded.map];
  canvas.width = width * tileSize;
  canvas.height = height * tileSize;
  previewCanvas.width = canvas.width;
  previewCanvas.height = canvas.height;
  drawMap();
}

function updatePreviewPosition() {
  const rect = canvas.getBoundingClientRect();
  previewCanvas.style.left = rect.left + 'px';
  previewCanvas.style.top = rect.top + 'px';
}


let map = [], width = 20, height = 10, tileSize = 48;
    let drawing = false, startX = 0, startY = 0;
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');

    let tilesetImage = new Image();
    let tileRects = {
      1: { x: 0, y: 0, w: 16, h: 16 },      // ground
      2: { x: 16, y: 0, w: 16, h: 16 },      // dirt
      
    };

    document.getElementById('tilesetUpload').addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          tilesetImage.src = reader.result;
          tilesetImage.onload = () => drawMap();
        };
        reader.readAsDataURL(file);
      }
    });

    function createMap() {
      width = parseInt(document.getElementById('mapWidth').value);
      height = parseInt(document.getElementById('mapHeight').value);
      canvas.width = width * tileSize;
      canvas.height = height * tileSize;
      previewCanvas.width = canvas.width;
      previewCanvas.height = canvas.height;
      previewCanvas.style.position = 'absolute';
      previewCanvas.style.left = canvas.offsetLeft + 'px';
      previewCanvas.style.top = canvas.offsetTop + 'px';
      previewCanvas.style.pointerEvents = 'none';
      map = Array(width * height).fill(0);
      updatePreviewPosition();
      drawMap();
    }

    function drawMap() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const val = map[y * width + x];
          if (val === 0) {
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          } else if (tilesetImage.complete && tileRects[val]) {
            const r = tileRects[val];
            ctx.drawImage(tilesetImage, r.x, r.y, r.w, r.h, x * tileSize, y * tileSize, tileSize, tileSize);
          } else {
            ctx.fillStyle = '#444';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }
          ctx.strokeStyle = '#333';
          ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    canvas.addEventListener('mousedown', e => {
      const rect = canvas.getBoundingClientRect();
      startX = Math.floor((e.clientX - rect.left) / tileSize);
      startY = Math.floor((e.clientY - rect.top) / tileSize);
      drawing = true;

      const tool = document.getElementById('tool').value;
      if (tool === 'pencil') {
        saveHistory();
        const selectedTile = parseInt(document.getElementById('tile').value);
        map[startY * width + startX] = selectedTile;
        drawMap();
      }
    });

    canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / tileSize);
  const y = Math.floor((e.clientY - rect.top) / tileSize);
  const tool = document.getElementById('tool').value;

  if (drawing && tool === 'pencil') {
    const selectedTile = parseInt(document.getElementById('tile').value);
    map[y * width + x] = selectedTile;
    drawMap();
  }

  // Atualiza posição do previewCanvas
  const previewRect = canvas.getBoundingClientRect();
  previewCanvas.style.left = previewRect.left + 'px';
  previewCanvas.style.top = previewRect.top + 'px';

  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  if (drawing && (tool === 'line' || tool === 'rect')) {
    // Borda vermelha no primeiro tile
    previewCtx.strokeStyle = 'red';
    previewCtx.lineWidth = 2;
    previewCtx.strokeRect(startX * tileSize, startY * tileSize, tileSize, tileSize);

    // Preview azul
    previewCtx.strokeStyle = '#00bcd4';
    previewCtx.lineWidth = 2;

    if (tool === 'line') {
      previewCtx.beginPath();
      previewCtx.moveTo(startX * tileSize + tileSize / 2, startY * tileSize + tileSize / 2);
      previewCtx.lineTo(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
      previewCtx.stroke();
    } else if (tool === 'rect') {
      const rx = Math.min(startX, x);
      const ry = Math.min(startY, y);
      const rw = Math.abs(x - startX) + 1;
      const rh = Math.abs(y - startY) + 1;
      previewCtx.strokeRect(rx * tileSize, ry * tileSize, rw * tileSize, rh * tileSize);
    }
  }
});

    canvas.addEventListener('mouseup', e => {
      const rect = canvas.getBoundingClientRect();
      const endX = Math.floor((e.clientX - rect.left) / tileSize);
      const endY = Math.floor((e.clientY - rect.top) / tileSize);
      const selectedTile = parseInt(document.getElementById('tile').value);
            const tool = document.getElementById('tool').value;
      drawing = false;
      previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

      if (tool === 'line') {
        saveHistory();
        drawLine(startX, startY, endX, endY, selectedTile);
      } else if (tool === 'rect') {
        saveHistory();
        drawRect(startX, startY, endX, endY, selectedTile);
      }

      drawMap();
    });

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / tileSize);
      const y = Math.floor((e.clientY - rect.top) / tileSize);
      const index = y * width + x;
      const selectedTile = parseInt(document.getElementById('tile').value);
      const tool = document.getElementById('tool').value;

      if (tool === 'bucket') {
        saveHistory();
        const target = map[index];
        if (target === selectedTile) return;

        const fill = (i) => {
          if (map[i] !== target || map[i] === selectedTile) return;
          map[i] = selectedTile;
          const x = i % width;
          const y = Math.floor(i / width);
          const neighbors = [
            y > 0 ? i - width : -1,
            y < height - 1 ? i + width : -1,
            x > 0 ? i - 1 : -1,
            x < width - 1 ? i + 1 : -1
          ];
          neighbors.forEach(n => {
            if (n >= 0 && n < map.length) fill(n);
          });
        };

        fill(index);
        drawMap();
      }
    });

    function drawLine(x0, y0, x1, y1, tile) {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        map[y0 * width + x0] = tile;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }

    function drawRect(x0, y0, x1, y1, tile) {
      const left = Math.min(x0, x1);
      const right = Math.max(x0, x1);
      const top = Math.min(y0, y1);
      const bottom = Math.max(y0, y1);

      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
          map[y * width + x] = tile;
        }
      }
    }

    function generateJSON() {
      const name = document.getElementById('mapName').value;
      const output = {
        [name]: {
          width: width,
          height: height,
          map: map
        }
      };
      document.getElementById('output').textContent = JSON.stringify(output, null, 2);
    }

    createMap(); // inicializa o mapa ao carregar