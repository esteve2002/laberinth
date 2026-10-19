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

const LEVEL_THEMES = [
  {
    key: "pumpkin-forest",
    title: "Bosque encantado de calabazas",
    subtitle: "Árboles retorcidos, luciérnagas y hojas en caída",
    rows: 9,
    cols: 9,
    collectibles: 5,
    collectibleLabel: "Calabazas",
    collectibleSingle: "Calabaza",
    wallColors: ["#3b2352", "#1d122c"],
    floorColors: ["#241629", "#1a1023"],
    accent: "#ff8d2e",
    betweenLine: "Las hojas susurran el nombre de la siguiente senda.",
    messages: [
      "Cada paso me acerca a ti, incluso en la noche más brujeril.",
      "Contigo hasta los fantasmas se ponen románticos.",
      "No importa cuántas ramas se crucen, yo siempre elijo tu camino.",
      "El corazón sabe el camino, aunque la vista se pierda un momento.",
      "Si esta calabaza sonríe, es porque le conté que pienso en ti.",
    ],
  },
  {
    key: "squirrel-forest",
    title: "Bosque encantado de ardillas",
    subtitle: "Setas luminosas y otoño de cobre",
    rows: 11,
    cols: 11,
    collectibles: 6,
    collectibleLabel: "Ardillas",
    collectibleSingle: "Ardilla",
    wallColors: ["#5b2b3c", "#261622"],
    floorColors: ["#30211f", "#241819"],
    accent: "#ffb25b",
    betweenLine: "Un sendero de setas brillantes guía la próxima noche.",
    messages: [
      "Una ardilla me guiñó: dice que el amor también guarda bellotas.",
      "No hace falta ver el final para saber que esta historia merece la pena.",
      "Hasta las setas brillan más cuando te pienso.",
      "Te he encontrado en el centro de mi mundo y sigo yendo hacia ti.",
      "Si me pierdo, sigo tus latidos como mapa encantado.",
    ],
  },
  {
    key: "bat-cemetery",
    title: "Cementerio encantado de murciélagos",
    subtitle: "Lápidas torcidas, niebla y luna en espiral",
    rows: 13,
    cols: 13,
    collectibles: 7,
    collectibleLabel: "Murciélagos",
    collectibleSingle: "Murciélago",
    wallColors: ["#2f334d", "#161a2f"],
    floorColors: ["#18202e", "#101723"],
    accent: "#c5b8ff",
    betweenLine: "La luna gira despacio y abre paso al pueblo torcido.",
    messages: [
      "Los murciélagos vuelan raro, pero mi rumbo hacia ti es clarísimo.",
      "Si la niebla tapa el camino, tu recuerdo me hace faro.",
      "Aunque el camino sea largo, si te tengo en mente todo vale la pena.",
      "Noche oscura, corazón encendido.",
      "Prometo quererte incluso cuando crujen todas las lápidas.",
    ],
  },
  {
    key: "witch-town",
    title: "Pueblo de brujas y gatos negros",
    subtitle: "Tejados puntiagudos y farolas de humo",
    rows: 15,
    cols: 15,
    collectibles: 8,
    collectibleLabel: "Gatos",
    collectibleSingle: "Gato",
    wallColors: ["#2d2548", "#17122c"],
    floorColors: ["#201a34", "#161129"],
    accent: "#ff9fc0",
    betweenLine: "Las chimeneas señalan el cielo de la luna final.",
    messages: [
      "Un gato negro se cruzó... para traerme suerte contigo.",
      "Tus ojos valen más que mil ventanas encantadas.",
      "No importa cuántas esquinas tenga el destino: yo seguiría buscando tu mano.",
      "Si este pueblo está embrujado, yo estoy embrujado por tu sonrisa.",
      "Hasta las farolas parpadean como si celebraran nuestra historia.",
    ],
  },
  {
    key: "lovers-moon",
    title: "Cielo de la luna de los enamorados",
    subtitle: "Estrellas fugaces y nubes moradas",
    rows: 17,
    cols: 17,
    collectibles: 9,
    collectibleLabel: "Estrellas",
    collectibleSingle: "Estrella",
    wallColors: ["#32265e", "#1a1434"],
    floorColors: ["#231f4b", "#1a1738"],
    accent: "#ffd87e",
    betweenLine: "La luna sonríe: el destino está completo.",
    messages: [
      "Cada estrella dice lo mismo: que contigo todo tiene magia.",
      "Si pido un deseo, siempre coincide: seguir a tu lado.",
      "Contigo hasta los fantasmas aprenden a sonreír con ternura.",
      "Tus abrazos tienen más brillo que cualquier cielo encantado.",
      "Mi final favorito siempre empieza donde estás tú.",
    ],
  },
];

const canvas = document.getElementById("laberinto");
const ctx = canvas?.getContext("2d");
const nivelEl = document.getElementById("nivelActual");
const collectibleLabelEl = document.getElementById("collectibleLabel");
const collectibleCountEl = document.getElementById("collectibleCount");
const estadoEl = document.getElementById("estadoPartida");
const mensajeEl = document.getElementById("mensajeBanner");
const overlay = document.getElementById("screenOverlay");
const overlayKicker = document.getElementById("overlayKicker");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayButton = document.getElementById("overlayButton");
const dedicationSlot = document.getElementById("dedicationSlot");
const collectibleModal = document.getElementById("collectibleModal");
const collectibleKicker = document.getElementById("collectibleKicker");
const collectibleTitle = document.getElementById("collectibleTitle");
const collectibleText = document.getElementById("collectibleText");
const collectibleAction = document.getElementById("collectibleAction");
const touchButtons = [...document.querySelectorAll(".touch-btn")];

if (!canvas || !ctx || !nivelEl || !collectibleLabelEl || !collectibleCountEl || !estadoEl || !mensajeEl || !overlay || !overlayKicker || !overlayTitle || !overlayText || !overlayButton || !dedicationSlot || !collectibleModal || !collectibleKicker || !collectibleTitle || !collectibleText || !collectibleAction) {
  throw new Error("Faltan elementos del DOM para inicializar el juego.");
}

const state = {
  screen: "start",
  levelIndex: 0,
  maze: [],
  player: { row: 1, col: 1 },
  exit: { row: 1, col: 1 },
  collectibles: [],
  levelCollected: 0,
  totalCollected: 0,
  totalTarget: LEVEL_THEMES.reduce((sum, level) => sum + level.collectibles, 0),
  tile: 28,
  offsetX: 0,
  offsetY: 0,
  startedAt: 0,
  elapsedMs: 0,
  overlayAction: null,
  modalAction: null,
  particles: [],
  transition: null,
  movePulseUntil: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function currentTheme() {
  return LEVEL_THEMES[state.levelIndex];
}

function bfsDistances(maze, start) {
  const dist = Array.from({ length: maze.length }, () => Array(maze[0].length).fill(-1));
  const queue = [start];
  dist[start.row][start.col] = 0;
  let idx = 0;
  while (idx < queue.length) {
    const cur = queue[idx++];
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (nr < 0 || nr >= maze.length || nc < 0 || nc >= maze[0].length) continue;
      if (maze[nr][nc] !== 0 || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[cur.row][cur.col] + 1;
      queue.push({ row: nr, col: nc });
    }
  }
  return dist;
}

function generateMaze(rows, cols) {
  const h = rows % 2 === 0 ? rows + 1 : rows;
  const w = cols % 2 === 0 ? cols + 1 : cols;
  const maze = Array.from({ length: h }, () => Array(w).fill(1));
  function carve(r, c) {
    maze[r][c] = 0;
    const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr <= 0 || nr >= h - 1 || nc <= 0 || nc >= w - 1 || maze[nr][nc] === 0) continue;
      maze[r + dr / 2][c + dc / 2] = 0;
      carve(nr, nc);
    }
  }
  carve(1, 1);
  return maze;
}

function findFarthestCell(maze, start) {
  const dist = bfsDistances(maze, start);
  let best = start;
  let max = -1;
  for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[0].length; c++) {
      if (maze[r][c] === 0 && dist[r][c] > max) {
        best = { row: r, col: c };
        max = dist[r][c];
      }
    }
  }
  return best;
}

function findPath(maze, start, goal) {
  const dist = bfsDistances(maze, goal);
  const path = [start];
  let cur = { ...start };
  while (cur.row !== goal.row || cur.col !== goal.col) {
    let next = null;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (nr < 0 || nr >= maze.length || nc < 0 || nc >= maze[0].length) continue;
      if (maze[nr][nc] !== 0 || dist[nr][nc] === -1) continue;
      if (dist[nr][nc] < dist[cur.row][cur.col]) {
        next = { row: nr, col: nc };
        break;
      }
    }
    if (!next) break;
    path.push(next);
    cur = next;
  }
  return path;
}

function placeCollectibles(path, count) {
  const valid = path.filter((_, i) => i > 1 && i < path.length - 1);
  const used = new Set();
  const items = [];
  while (items.length < Math.min(count, valid.length)) {
    const pick = valid[Math.floor(Math.random() * valid.length)];
    const key = `${pick.row}-${pick.col}`;
    if (used.has(key)) continue;
    used.add(key);
    items.push({ row: pick.row, col: pick.col, collected: false });
  }
  return items;
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

// block-2-marker
