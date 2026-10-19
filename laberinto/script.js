const LEVELS = [
  { rows: 9, cols: 9, cards: 3 },
  { rows: 13, cols: 13, cards: 4 },
  { rows: 17, cols: 17, cards: 5 },
];

const MOVE_KEYS = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
  KeyW: { row: -1, col: 0 },
  KeyS: { row: 1, col: 0 },
  KeyA: { row: 0, col: -1 },
  KeyD: { row: 0, col: 1 },
};

const canvas = document.getElementById("laberinto");
const messageEl = document.getElementById("mensaje");
const nivelEl = document.getElementById("nivelActual");
const cartasEl = document.getElementById("cartasRestantes");
const estadoEl = document.getElementById("estadoPartida");
const modal = document.getElementById("cardModal");
const modalKicker = document.getElementById("cardKicker");
const modalTitle = document.getElementById("cardTitle");
const modalText = document.getElementById("cardText");
const modalAction = document.getElementById("cardAction");

if (!canvas || !messageEl || !nivelEl || !cartasEl || !estadoEl || !modal || !modalKicker || !modalTitle || !modalText || !modalAction) {
  throw new Error("Faltan elementos del DOM del laberinto.");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("No se pudo inicializar el canvas.");
}

const state = {
  levelIndex: 0,
  gameState: "playing",
  maze: [],
  player: { row: 1, col: 1 },
  exit: { row: 1, col: 1 },
  cards: [],
  tile: 26,
  offsetX: 0,
  offsetY: 0,
  modalType: null,
  hintCell: null,
  hintUntil: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showMessage(text, fixed = false) {
  messageEl.textContent = text;
  messageEl.classList.remove("visible", "fijo");
  void messageEl.offsetWidth;
  messageEl.classList.add("visible");
  if (fixed) messageEl.classList.add("fijo");
}

function updateHud() {
  nivelEl.textContent = String(state.levelIndex + 1);
  cartasEl.textContent = String(state.cards.filter((card) => !card.opened).length);
  const label = state.gameState === "playing" ? "Explorando" : state.gameState === "won" ? "Victoria" : state.gameState === "lost" ? "Derrota" : "Subiendo";
  estadoEl.textContent = label;
}

function distanceMap(maze, start) {
  const distances = Array.from({ length: maze.length }, () => Array(maze[0].length).fill(-1));
  const queue = [start];
  distances[start.row][start.col] = 0;
  let index = 0;

  while (index < queue.length) {
    const current = queue[index++];
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nextRow = current.row + dr;
      const nextCol = current.col + dc;
      if (nextRow < 0 || nextRow >= maze.length || nextCol < 0 || nextCol >= maze[0].length) continue;
      if (maze[nextRow][nextCol] !== 0 || distances[nextRow][nextCol] !== -1) continue;
      distances[nextRow][nextCol] = distances[current.row][current.col] + 1;
      queue.push({ row: nextRow, col: nextCol });
    }
  }

  return distances;
}

function generateMaze(rows, cols) {
  const mazeRows = rows % 2 === 0 ? rows + 1 : rows;
  const mazeCols = cols % 2 === 0 ? cols + 1 : cols;
  const maze = Array.from({ length: mazeRows }, () => Array(mazeCols).fill(1));

  function carve(row, col) {
    maze[row][col] = 0;
    const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    for (let i = dirs.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }

    for (const [dr, dc] of dirs) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow > 0 && nextRow < mazeRows - 1 && nextCol > 0 && nextCol < mazeCols - 1 && maze[nextRow][nextCol] === 1) {
        maze[row + dr / 2][col + dc / 2] = 0;
        carve(nextRow, nextCol);
      }
    }
  }

  carve(1, 1);
  return maze;
}

function findExit(maze, start) {
  const distances = distanceMap(maze, start);
  let best = { row: start.row, col: start.col };
  let maxDistance = -1;

  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[0].length; col++) {
      if (maze[row][col] === 0 && distances[row][col] > maxDistance) {
        maxDistance = distances[row][col];
        best = { row, col };
      }
    }
  }

  return best;
}

function reconstructPath(maze, start, goal) {
  const distances = distanceMap(maze, goal);
  const path = [start];
  let current = start;

  while (current.row !== goal.row || current.col !== goal.col) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let next = null;
    for (const [dr, dc] of dirs) {
      const nextRow = current.row + dr;
      const nextCol = current.col + dc;
      if (nextRow < 0 || nextRow >= maze.length || nextCol < 0 || nextCol >= maze[0].length) continue;
      if (maze[nextRow][nextCol] !== 0) continue;
      if (distances[nextRow][nextCol] === -1) continue;
      if (distances[nextRow][nextCol] < distances[current.row][current.col]) {
        next = { row: nextRow, col: nextCol };
        break;
      }
    }
    if (!next) break;
    path.push(next);
    current = next;
  }

  return path;
}

function chooseCards(path, count) {
  const valid = path.filter((cell, index) => index > 0 && index < path.length - 1);
  const result = [];
  const seen = new Set();

  while (result.length < Math.min(count, valid.length) && valid.length > 0) {
    const pick = valid[Math.floor(Math.random() * valid.length)];
    const key = `${pick.row}-${pick.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ row: pick.row, col: pick.col, opened: false, kind: result.length % 2 === 0 ? "good" : "bad" });
    }
  }

  return result;
}

function findCard(row, col) {
  return state.cards.find((card) => !card.opened && card.row === row && card.col === col);
}

function openModal(type, title, text, buttonText) {
  state.modalType = type;
  modal.classList.remove("good", "bad");
  modal.classList.add(type === "good" ? "good" : "bad");
  modalKicker.textContent = type === "good" ? "Carta revelada" : "Carta maldita";
  modalTitle.textContent = title;
  modalText.textContent = text;
  modalAction.textContent = buttonText;
  modal.classList.add("visible");
}

function closeModal() {
  state.modalType = null;
  modal.classList.remove("visible", "good", "bad");
}

function getHintFromCell(row, col) {
  const distances = distanceMap(state.maze, state.exit);
  const current = distances[row][col];
  if (current <= 0) return null;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of dirs) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (nextRow < 0 || nextRow >= state.maze.length || nextCol < 0 || nextCol >= state.maze[0].length) continue;
    if (state.maze[nextRow][nextCol] !== 0) continue;
    if (distances[nextRow][nextCol] === current - 1) {
      const direction = dr === -1 ? "arriba" : dr === 1 ? "abajo" : dc === -1 ? "izquierda" : "derecha";
      return { row: nextRow, col: nextCol, direction };
    }
  }

  return null;
}

function startLevel(index) {
  state.levelIndex = index;
  state.gameState = "playing";
  state.hintCell = null;
  state.hintUntil = 0;

  const config = LEVELS[index];
  const maze = generateMaze(config.rows, config.cols);
  const start = { row: 1, col: 1 };
  const exit = findExit(maze, start);
  const path = reconstructPath(maze, start, exit);
  const cards = chooseCards(path, config.cards);

  state.maze = maze;
  state.player = { ...start };
  state.exit = exit;
  state.cards = cards;

  resizeCanvas();
  updateHud();
  showMessage(index === 0 ? "Busca la salida y usa tus cartas con cuidado." : `Nivel ${index + 1}: el mapa crece y se vuelve más peligroso.`, true);
}

function nextLevel() {
  if (state.levelIndex >= LEVELS.length - 1) {
    state.gameState = "won";
    updateHud();
    showMessage("¡Lo has superado todo!", true);
    openModal("good", "Victoria final", "Has terminado todos los niveles del laberinto.", "Reiniciar");
    return;
  }

  state.gameState = "next";
  updateHud();
  showMessage("Nivel superado. El mapa crece.", true);
  setTimeout(() => startLevel(state.levelIndex + 1), 700);
}

function loseGame() {
  state.gameState = "lost";
  updateHud();
  showMessage("Carta maldita: pierdes la partida.", true);
  openModal("bad", "Carta maldita", "Has abierto una carta que te ha condenado a perder la partida.", "Reiniciar");
}

function restartGame() {
  closeModal();
  startLevel(0);
}

function openCard() {
  if (state.gameState !== "playing" || state.modalType) return;
  const card = findCard(state.player.row, state.player.col);
  if (!card) return;

  card.opened = true;
  updateHud();

  if (card.kind === "bad") {
    loseGame();
    return;
  }

  const hint = getHintFromCell(card.row, card.col);
  if (hint) {
    state.hintCell = { row: hint.row, col: hint.col };
    state.hintUntil = performance.now() + 4500;
    showMessage(`Pista: la salida está más ${hint.direction}.`, true);
    openModal("good", "Pista brillante", `La salida está más ${hint.direction}. Sigue ese camino.`, "Continuar");
    return;
  }

  showMessage("La carta no da una pista clara, pero el camino sigue vivo.", true);
  openModal("good", "Carta útil", "La carta no tenía una pista clara, pero aún puedes avanzar con confianza.", "Continuar");
}

function movePlayer(dr, dc) {
  if (state.gameState !== "playing" || state.modalType) return;

  const nextRow = state.player.row + dr;
  const nextCol = state.player.col + dc;
  if (nextRow < 0 || nextRow >= state.maze.length || nextCol < 0 || nextCol >= state.maze[0].length) return;
  if (state.maze[nextRow][nextCol] !== 0) return;

  state.player.row = nextRow;
  state.player.col = nextCol;

  const card = findCard(state.player.row, state.player.col);
  if (card) {
    showMessage("Hay una carta aquí. Pulsa Enter o Espacio para abrirla.", false);
  }

  if (state.player.row === state.exit.row && state.player.col === state.exit.col) {
    nextLevel();
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const rows = state.maze.length;
  const cols = state.maze[0].length;
  const padding = 18;
  state.tile = clamp(Math.min((rect.width - padding * 2) / cols, (rect.height - padding * 2) / rows), 22, 44);
  state.offsetX = Math.round((rect.width - cols * state.tile) / 2);
  state.offsetY = Math.round((rect.height - rows * state.tile) / 2);
}

function roundedRectPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCell(row, col, time) {
  const x = state.offsetX + col * state.tile;
  const y = state.offsetY + row * state.tile;
  const isWall = state.maze[row][col] === 1;
  const isExit = state.exit.row === row && state.exit.col === col;
  const isCard = state.cards.some((card) => !card.opened && card.row === row && card.col === col);
  const isHint = state.hintCell && state.hintCell.row === row && state.hintCell.col === col && time < state.hintUntil;

  ctx.save();

  if (isWall) {
    const wallGrad = ctx.createLinearGradient(x, y, x + state.tile, y + state.tile);
    wallGrad.addColorStop(0, "#291837");
    wallGrad.addColorStop(1, "#120c1b");
    ctx.fillStyle = wallGrad;
    roundedRectPath(x + 2, y + 2, state.tile - 4, state.tile - 4, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.stroke();
  } else {
    const floorGrad = ctx.createLinearGradient(x, y, x + state.tile, y + state.tile);
    floorGrad.addColorStop(0, "#fff7fb");
    floorGrad.addColorStop(1, "#f7d8e4");
    ctx.fillStyle = floorGrad;
    roundedRectPath(x + 2, y + 2, state.tile - 4, state.tile - 4, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(122, 26, 58, 0.12)";
    ctx.stroke();
  }

  if (isExit) {
    ctx.save();
    const pulse = 1 + Math.sin(time * 0.006) * 0.12;
    ctx.translate(x + state.tile / 2, y + state.tile / 2);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.9)";
    ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, state.tile * 0.22 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (isCard) {
    const cx = x + state.tile / 2;
    const cy = y + state.tile / 2;
    const size = state.tile * 0.24;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(time * 0.004 + row + col) * 0.18);
    ctx.shadowColor = "rgba(255, 77, 109, 0.45)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff4d6d";
    roundedRectPath(-size, -size * 1.08, size * 2, size * 2.16, 9);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-size * 0.25, -size * 0.7, size * 0.5, size * 1.4);
    ctx.fillRect(-size * 0.7, -size * 0.1, size * 1.4, size * 0.26);
    ctx.restore();
  }

  if (isHint) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = "rgba(52, 211, 153, 0.9)";
    roundedRectPath(x + 5, y + 5, state.tile - 10, state.tile - 10, 8);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawPlayer(time) {
  const x = state.offsetX + state.player.col * state.tile + state.tile / 2;
  const y = state.offsetY + state.player.row * state.tile + state.tile / 2;
  const bob = Math.sin(time * 0.008) * 2;

  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 6, x, y, state.tile * 1.8);
  glow.addColorStop(0, "rgba(255, 77, 109, 0.92)");
  glow.addColorStop(0.3, "rgba(255, 77, 109, 0.35)");
  glow.addColorStop(1, "rgba(255, 77, 109, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, state.tile * 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff4d6d";
  ctx.shadowColor = "rgba(255, 77, 109, 0.75)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(x, y + bob, state.tile * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBoard(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#120b1d");
  bg.addColorStop(1, "#090d17");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const orb = ctx.createRadialGradient(width * 0.52, height * 0.24, 0, width * 0.52, height * 0.24, Math.max(width, height) * 0.8);
  orb.addColorStop(0, "rgba(255, 143, 163, 0.12)");
  orb.addColorStop(1, "rgba(255, 143, 163, 0)");
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < state.maze.length; row++) {
    for (let col = 0; col < state.maze[0].length; col++) {
      drawCell(row, col, time);
    }
  }

  drawPlayer(time);
}

function animate(now) {
  if (state.hintCell && now > state.hintUntil) {
    state.hintCell = null;
  }
  drawBoard(now);
  requestAnimationFrame(animate);
}

function handleKeyDown(event) {
  if (event.code === "Escape" && state.modalType) {
    closeModal();
    if (state.gameState === "lost" || state.gameState === "won") restartGame();
    return;
  }

  if (event.code === "Enter" || event.code === "Space") {
    event.preventDefault();
    if (state.modalType) {
      closeModal();
      if (state.gameState === "lost" || state.gameState === "won") restartGame();
      return;
    }
    openCard();
    return;
  }

  const move = MOVE_KEYS[event.code];
  if (!move) return;
  event.preventDefault();
  movePlayer(move.row, move.col);
}

modalAction.addEventListener("click", () => {
  closeModal();
  if (state.gameState === "lost" || state.gameState === "won") restartGame();
});

window.addEventListener("resize", resizeCanvas);
document.addEventListener("keydown", handleKeyDown);

startLevel(0);
requestAnimationFrame(animate);
