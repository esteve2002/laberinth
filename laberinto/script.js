const LEVELS = [
  { rows: 9, cols: 9, cards: 3 },
  { rows: 11, cols: 11, cards: 4 },
  { rows: 13, cols: 13, cards: 5 },
  { rows: 15, cols: 15, cards: 6 },
  { rows: 17, cols: 17, cards: 7 },
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

const CARD_TEXTS = [
  "Cada paso me acerca a ti, y cada vuelta del camino me recuerda lo que siento.",
  "No importa cuántas esquinas tenga el destino: yo seguiría buscando tu mano.",
  "Si el laberinto se vuelve complicado, recuerda que lo más bello siempre vale la espera.",
  "Te he encontrado en el centro de mi mundo y aún así sigo avanzando hacia ti.",
  "El corazón sabe el camino, aunque la vista se pierda un momento.",
  "Una nota pequeña, pero suficiente para recordar que el amor siempre guía.",
  "No hace falta ver el final para saber que esta historia merece la pena.",
  "Aunque el camino sea largo, si te tengo en mente todo vale la pena."
];

const BAD_CARD_TEXTS = [
  "La duda se mete en el camino y te hace perder la partida.",
  "Tomaste el camino equivocado y la tristeza se cerró sobre ti.",
  "La incertidumbre te ha atrapado; el laberinto gana esta vez.",
  "La tormenta del miedo bloquea el camino y te hace perder el pulso."
];

const canvas = document.getElementById("laberinto");
const ctx = canvas.getContext("2d");
const nivelEl = document.getElementById("nivelActual");
const cartasEl = document.getElementById("cartasActuales");
const estadoEl = document.getElementById("estadoPartida");
const mensajeEl = document.getElementById("mensajeBanner");
const overlay = document.getElementById("screenOverlay");
const overlayKicker = document.getElementById("overlayKicker");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayButton = document.getElementById("overlayButton");
const cardModal = document.getElementById("cardModal");
const cardKicker = document.getElementById("cardKicker");
const cardTitle = document.getElementById("cardTitle");
const cardText = document.getElementById("cardText");
const cardAction = document.getElementById("cardAction");
const touchButtons = [...document.querySelectorAll(".touch-btn")];

const state = {
  screen: "start",
  levelIndex: 0,
  maze: [],
  player: { row: 1, col: 1 },
  exit: { row: 1, col: 1 },
  cards: [],
  cardsFound: 0,
  totalCardsFound: 0,
  tile: 30,
  offsetX: 0,
  offsetY: 0,
  startedAt: 0,
  elapsedMs: 0,
  overlayAction: null,
  lastMessage: "",
  modalAction: null,
  hintCell: null,
  hintUntil: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showBanner(text) {
  state.lastMessage = text;
  mensajeEl.textContent = text;
}

function updateHud() {
  nivelEl.textContent = String(state.levelIndex + 1);
  cartasEl.textContent = String(state.cardsFound);

  if (state.screen === "start") {
    estadoEl.textContent = "Inicio";
  } else if (state.screen === "playing") {
    estadoEl.textContent = "Explorando";
  } else if (state.screen === "between") {
    estadoEl.textContent = "Siguiente";
  } else if (state.screen === "paused") {
    estadoEl.textContent = "Pausa";
  } else if (state.screen === "final") {
    estadoEl.textContent = "Final";
  } else if (state.screen === "card") {
    estadoEl.textContent = "Carta";
  }
}

function getRandomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildOverlay({ kicker, title, text, buttonText, action }) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonText;
  state.overlayAction = action;
  overlay.classList.add("visible");
}

function hideOverlay() {
  overlay.classList.remove("visible");
  state.overlayAction = null;
}

function openCardModal({ kicker, title, text, buttonText, action, variant = "good" }) {
  cardKicker.textContent = kicker;
  cardTitle.textContent = title;
  cardText.textContent = text;
  cardAction.textContent = buttonText;
  state.modalAction = action;
  cardModal.classList.add("visible");
  cardModal.dataset.variant = variant;
}

function closeCardModal() {
  cardModal.classList.remove("visible");
  state.modalAction = null;
}

function timeString(ms) {
  const secs = Math.floor(ms / 1000);
  const minutes = Math.floor(secs / 60);
  const remaining = secs % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function bfsDistances(maze, start) {
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

      if (nextRow < 0 || nextRow >= maze.length || nextCol < 0 || nextCol >= maze[0].length) {
        continue;
      }

      if (maze[nextRow][nextCol] !== 0 || distances[nextRow][nextCol] !== -1) {
        continue;
      }

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
    const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];

    for (let i = directions.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    for (const [dr, dc] of directions) {
      const nextRow = row + dr;
      const nextCol = col + dc;

      if (
        nextRow > 0 && nextRow < mazeRows - 1 &&
        nextCol > 0 && nextCol < mazeCols - 1 &&
        maze[nextRow][nextCol] === 1
      ) {
        maze[row + dr / 2][col + dc / 2] = 0;
        carve(nextRow, nextCol);
      }
    }
  }

  carve(1, 1);
  return maze;
}

function findFarthestCell(maze, start) {
  const distances = bfsDistances(maze, start);
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

function buildShortestPath(maze, start, goal) {
  const distances = bfsDistances(maze, goal);
  const path = [start];
  let current = { ...start };

  while (current.row !== goal.row || current.col !== goal.col) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let next = null;

    for (const [dr, dc] of dirs) {
      const nextRow = current.row + dr;
      const nextCol = current.col + dc;

      if (
        nextRow < 0 || nextRow >= maze.length ||
        nextCol < 0 || nextCol >= maze[0].length ||
        maze[nextRow][nextCol] !== 0 ||
        distances[nextRow][nextCol] === -1 ||
        distances[nextRow][nextCol] >= distances[current.row][current.col]
      ) {
        continue;
      }

      next = { row: nextRow, col: nextCol };
      break;
    }

    if (!next) {
      break;
    }

    path.push(next);
    current = next;
  }

  return path;
}

function placeCardsOnPath(path, count) {
  const validCells = path.filter((cell, index) => index > 0 && index < path.length - 1);
  const chosen = [];
  const seen = new Set();

  while (chosen.length < Math.min(count, validCells.length) && validCells.length > 0) {
    const cell = validCells[Math.floor(Math.random() * validCells.length)];
    const key = `${cell.row}-${cell.col}`;

    if (!seen.has(key)) {
      seen.add(key);
      chosen.push({
        row: cell.row,
        col: cell.col,
        opened: false,
        type: chosen.length % 2 === 0 ? "good" : "bad",
      });
    }
  }

  return chosen;
}

function findCardAt(row, col) {
  return state.cards.find((card) => !card.opened && card.row === row && card.col === col);
}

function startLevel(index) {
  const config = LEVELS[index];
  const maze = generateMaze(config.rows, config.cols);
  const start = { row: 1, col: 1 };
  const exit = findFarthestCell(maze, start);
  const path = buildShortestPath(maze, start, exit);

  state.levelIndex = index;
  state.screen = "playing";
  state.maze = maze;
  state.player = { ...start };
  state.exit = exit;
  state.cards = placeCardsOnPath(path, config.cards);
  state.hintCell = null;
  state.hintUntil = 0;
  state.startedAt = performance.now() - state.elapsedMs;

  hideOverlay();
  showBanner(index === 0 ? "Busca la salida y abre las cartas con cuidado." : `Nivel ${index + 1}: el camino se vuelve más largo.`);
  resizeCanvas();
  updateHud();
}

function beginGame() {
  state.screen = "playing";
  state.cardsFound = 0;
  state.totalCardsFound = 0;
  state.elapsedMs = 0;
  startLevel(0);
}

function showFinalScreen() {
  const totalTime = timeString(state.elapsedMs);
  const totalCards = state.totalCardsFound;

  state.screen = "final";
  buildOverlay({
    kicker: "Final",
    title: "Has llegado al final",
    text: `Cartas recogidas: ${totalCards}. Tiempo total: ${totalTime}.`,
    buttonText: "Jugar de nuevo",
    action: () => beginGame(),
  });
  updateHud();
}

function handleWinLevel() {
  if (state.levelIndex >= LEVELS.length - 1) {
    showFinalScreen();
    return;
  }

  state.screen = "between";
  buildOverlay({
    kicker: `Nivel ${state.levelIndex + 1}`,
    title: "¡Has encontrado la salida!",
    text: `Prepárate para el siguiente laberinto, más grande y más difícil.`,
    buttonText: "Siguiente nivel",
    action: () => startLevel(state.levelIndex + 1),
  });
  updateHud();
}

function togglePause() {
  if (state.screen !== "playing") {
    return;
  }

  state.screen = "paused";
  buildOverlay({
    kicker: "Pausa",
    title: "Juego pausado",
    text: "Toma aire. Cuando estés listo, vuelve al laberinto.",
    buttonText: "Continuar",
    action: () => {
      state.screen = "playing";
      hideOverlay();
      updateHud();
    },
  });
  updateHud();
}

function badCardOutcome() {
  state.screen = "card";
  openCardModal({
    kicker: "Carta oscura",
    title: "La duda te atrapó",
    text: getRandomItem(BAD_CARD_TEXTS),
    buttonText: "Reiniciar",
    action: () => {
      closeCardModal();
      beginGame();
    },
    variant: "bad",
  });
}

function openCard() {
  if (state.screen !== "playing") {
    return;
  }

  const card = findCardAt(state.player.row, state.player.col);
  if (!card) {
    showBanner("Aquí no hay una carta. Sigue avanzando.");
    return;
  }

  card.opened = true;
  state.cardsFound += 1;
  state.totalCardsFound += 1;
  updateHud();

  if (card.type === "bad") {
    badCardOutcome();
    return;
  }

  const message = getRandomItem(CARD_TEXTS);
  state.hintCell = { row: state.exit.row, col: state.exit.col };
  state.hintUntil = performance.now() + 4400;
  state.screen = "card";

  openCardModal({
    kicker: "Carta del corazón",
    title: "Mensaje secreto",
    text: message,
    buttonText: "Cerrar",
    action: () => {
      closeCardModal();
      state.screen = "playing";
      updateHud();
    },
    variant: "good",
  });
}

function movePlayer(dr, dc) {
  if (state.screen !== "playing") {
    return;
  }

  const nextRow = state.player.row + dr;
  const nextCol = state.player.col + dc;

  if (
    nextRow < 0 || nextRow >= state.maze.length ||
    nextCol < 0 || nextCol >= state.maze[0].length ||
    state.maze[nextRow][nextCol] !== 0
  ) {
    return;
  }

  state.player.row = nextRow;
  state.player.col = nextCol;

  const nearbyCard = findCardAt(state.player.row, state.player.col);
  if (nearbyCard) {
    showBanner("Has encontrado una carta. Pulsa Enter o Espacio para abrirla.");
  }

  if (state.player.row === state.exit.row && state.player.col === state.exit.col) {
    handleWinLevel();
  }
}

function roundedRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
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
    const gradient = ctx.createLinearGradient(x, y, x + state.tile, y + state.tile);
    gradient.addColorStop(0, "#35203d");
    gradient.addColorStop(0.5, "#1d1224");
    gradient.addColorStop(1, "#120c1b");
    ctx.fillStyle = gradient;
    roundedRectPath(x + 2, y + 2, state.tile - 4, state.tile - 4, 11);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.stroke();
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + state.tile, y + state.tile);
    gradient.addColorStop(0, "#fff9fb");
    gradient.addColorStop(0.5, "#f8dfe7");
    gradient.addColorStop(1, "#f3c4d6");
    ctx.fillStyle = gradient;
    roundedRectPath(x + 2, y + 2, state.tile - 4, state.tile - 4, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(129, 49, 77, 0.12)";
    ctx.stroke();
  }

  if (isExit) {
    ctx.save();
    const pulse = 1 + Math.sin(time * 0.006) * 0.16;
    ctx.translate(x + state.tile / 2, y + state.tile / 2);
    ctx.lineWidth = 2.3;
    ctx.shadowColor = "rgba(246, 211, 101, 0.9)";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "rgba(246, 211, 101, 1)";
    ctx.beginPath();
    ctx.arc(0, 0, state.tile * 0.2 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (isCard) {
    const size = state.tile * 0.22;
    const cx = x + state.tile / 2;
    const cy = y + state.tile / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(time * 0.006 + row + col) * 0.14);
    ctx.shadowColor = "rgba(255, 77, 109, 0.7)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#ff4d6d";
    roundedRectPath(-size, -size * 1.15, size * 2, size * 2.3, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(-size * 0.25, -size * 0.7, size * 0.5, size * 1.42);
    ctx.fillRect(-size * 0.72, -size * 0.08, size * 1.44, size * 0.22);
    ctx.restore();
  }

  if (isHint && time < state.hintUntil) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "rgba(98, 210, 177, 0.9)";
    ctx.lineWidth = 2;
    roundedRectPath(x + 5, y + 5, state.tile - 10, state.tile - 10, 8);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawPlayer(time) {
  const cx = state.offsetX + state.player.col * state.tile + state.tile / 2;
  const cy = state.offsetY + state.player.row * state.tile + state.tile / 2;
  const bob = Math.sin(time * 0.009) * 2;

  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, state.tile * 1.6);
  glow.addColorStop(0, "rgba(255, 77, 109, 0.9)");
  glow.addColorStop(0.25, "rgba(255, 77, 109, 0.33)");
  glow.addColorStop(1, "rgba(255, 77, 109, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, state.tile * 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, cy + bob);
  ctx.fillStyle = "#ff4d6d";
  ctx.shadowColor = "rgba(255, 77, 109, 0.8)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0, state.tile * 0.1);
  ctx.bezierCurveTo(state.tile * 0.25, -state.tile * 0.18, state.tile * 0.48, -state.tile * 0.1, 0, state.tile * 0.25);
  ctx.bezierCurveTo(-state.tile * 0.48, -state.tile * 0.1, -state.tile * 0.25, -state.tile * 0.18, 0, state.tile * 0.1);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(-state.tile * 0.12, -state.tile * 0.04, state.tile * 0.05, 0, Math.PI * 2);
  ctx.arc(state.tile * 0.12, -state.tile * 0.04, state.tile * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBoard(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#120b1d");
  background.addColorStop(1, "#090d17");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.45, Math.max(width, height));
  glow.addColorStop(0, "rgba(255, 143, 163, 0.15)");
  glow.addColorStop(1, "rgba(255, 143, 163, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < state.maze.length; row++) {
    for (let col = 0; col < state.maze[0].length; col++) {
      drawCell(row, col, time);
    }
  }

  drawPlayer(time);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const rows = state.maze.length || 1;
  const cols = state.maze[0]?.length || 1;
  const padding = 18;

  state.tile = clamp(Math.min((rect.width - padding * 2) / cols, (rect.height - padding * 2) / rows), 26, 44);
  state.offsetX = Math.round((rect.width - cols * state.tile) / 2);
  state.offsetY = Math.round((rect.height - rows * state.tile) / 2);
}

function loop(now) {
  if (state.screen === "playing" || state.screen === "card") {
    state.elapsedMs = now - state.startedAt;
  }

  if (state.hintCell && now > state.hintUntil) {
    state.hintCell = null;
  }

  drawBoard(now);
  requestAnimationFrame(loop);
}

function handleKeydown(event) {
  if (event.code === "KeyP") {
    togglePause();
    return;
  }

  if (event.code === "Escape") {
    if (cardModal.classList.contains("visible")) {
      closeCardModal();
      if (state.screen === "final") {
        beginGame();
      } else if (state.screen === "card") {
        state.screen = "playing";
        updateHud();
      }
      return;
    }

    if (overlay.classList.contains("visible") && state.screen !== "start") {
      if (state.screen === "paused") {
        state.screen = "playing";
        hideOverlay();
        updateHud();
      }
    }
    return;
  }

  if (event.code === "Enter" || event.code === "Space") {
    event.preventDefault();
    if (cardModal.classList.contains("visible")) {
      if (state.modalAction) {
        state.modalAction();
      }
      return;
    }
    openCard();
    return;
  }

  const movement = MOVE_KEYS[event.code];
  if (!movement) {
    return;
  }

  event.preventDefault();
  movePlayer(movement.row, movement.col);
}

function handleTouchMove(direction) {
  const map = {
    up: { row: -1, col: 0 },
    down: { row: 1, col: 0 },
    left: { row: 0, col: -1 },
    right: { row: 0, col: 1 },
  };

  const move = map[direction];
  if (!move) {
    return;
  }

  movePlayer(move.row, move.col);
}

overlayButton.addEventListener("click", () => {
  if (state.overlayAction) {
    state.overlayAction();
  }
});

cardAction.addEventListener("click", () => {
  if (state.modalAction) {
    state.modalAction();
  }
});

touchButtons.forEach((button) => {
  button.addEventListener("pointerdown", () => {
    handleTouchMove(button.dataset.dir);
  });
});

document.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", resizeCanvas);

buildOverlay({
  kicker: "Aventura",
  title: "El laberinto del amor",
  text: "Mueve con flechas, WASD o el pad táctil. Abre las cartas con Enter o Espacio y llega a la salida.",
  buttonText: "Empezar",
  action: () => beginGame(),
});

updateHud();
resizeCanvas();
requestAnimationFrame(loop);
