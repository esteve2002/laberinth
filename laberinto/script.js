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

// Continuación para insertar después de // block-2-marker.
// Reutiliza constantes, elementos DOM y utilidades declaradas en la primera parte.

const MAX_PARTICLES = 64;
const MOVE_DELAY_MS = 105;
const HEART_CHARS = ["♥", "♡"];
let lastFrameTime = 0;
let lastMoveAt = 0;
let animationFrameId = 0;
let canvasCssWidth = 0;
let canvasCssHeight = 0;
let pixelRatio = 1;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function seededNumber(row, col, salt = 0) {
  const value = Math.sin((row + 1) * 127.1 + (col + 1) * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvasCssWidth = bounds.width;
  canvasCssHeight = bounds.height;
  const width = Math.round(bounds.width * pixelRatio);
  const height = Math.round(bounds.height * pixelRatio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  calculateBoardGeometry();
}

function calculateBoardGeometry() {
  if (!state.maze.length) {
    state.tile = Math.max(12, Math.min(canvasCssWidth, canvasCssHeight) / 9);
    state.offsetX = 0;
    state.offsetY = 0;
    return;
  }
  const rows = state.maze.length;
  const cols = state.maze[0].length;
  const margin = Math.max(8, Math.min(canvasCssWidth, canvasCssHeight) * 0.025);
  state.tile = Math.max(8, Math.min((canvasCssWidth - margin * 2) / cols, (canvasCssHeight - margin * 2) / rows));
  state.offsetX = (canvasCssWidth - cols * state.tile) / 2;
  state.offsetY = (canvasCssHeight - rows * state.tile) / 2;
}

function populateParticles() {
  state.particles = [];
  const themeIndex = state.levelIndex;
  const desired = Math.min(MAX_PARTICLES, themeIndex === 2 ? 38 : 48);
  for (let i = 0; i < desired; i++) {
    state.particles.push({
      x: Math.random(),
      y: Math.random(),
      vx: randomBetween(-0.00005, 0.00005),
      vy: randomBetween(0.00004, 0.00022),
      size: randomBetween(1.2, 3.3),
      phase: randomBetween(0, Math.PI * 2),
      kind: themeIndex === 0 ? "leaf" : themeIndex === 2 ? "fog" : themeIndex === 4 ? "star" : "glow",
      alpha: randomBetween(0.18, 0.72),
    });
  }
}

function updateParticles(deltaMs) {
  const delta = Math.min(deltaMs, 40);
  for (const particle of state.particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.phase += delta * 0.0012;
    if (particle.y > 1.04) {
      particle.y = -0.04;
      particle.x = Math.random();
    }
    if (particle.x < -0.04) particle.x = 1.04;
    if (particle.x > 1.04) particle.x = -0.04;
  }
  if (state.particles.length > MAX_PARTICLES) state.particles.length = MAX_PARTICLES;
}

function drawMoon(context, x, y, radius, color = "#f7e8ba", halo = "rgba(224, 194, 255, .15)") {
  const glow = context.createRadialGradient(x, y, radius * 0.1, x, y, radius * 2.6);
  glow.addColorStop(0, halo);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y, radius * 2.6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = radius * 0.45;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
}

function drawPumpkinForest(context, width, height, time) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#110b20");
  gradient.addColorStop(0.55, "#281426");
  gradient.addColorStop(1, "#0b0915");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  drawMoon(context, width * 0.78, height * 0.15, Math.min(width, height) * 0.055, "#ffdca1", "rgba(255,135,52,.2)");
  // Siluetas de árboles retorcidos en el borde del bosque.
  context.strokeStyle = "rgba(12, 7, 21, .88)";
  context.lineWidth = Math.max(3, width * 0.009);
  for (let i = 0; i < 7; i++) {
    const x = (i / 6) * width + Math.sin(time * 0.00035 + i) * 5;
    context.beginPath();
    context.moveTo(x, height * 0.72);
    context.bezierCurveTo(x - 14, height * 0.45, x + 16, height * 0.28, x + (i % 2 ? -40 : 34), height * 0.12);
    context.moveTo(x - 2, height * 0.46);
    context.quadraticCurveTo(x - 25, height * 0.36, x - 35, height * 0.31);
    context.moveTo(x + 4, height * 0.36);
    context.quadraticCurveTo(x + 25, height * 0.29, x + 33, height * 0.22);
    context.stroke();
  }
}

function drawSquirrelForest(context, width, height, time) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#20111d");
  gradient.addColorStop(0.5, "#4a2725");
  gradient.addColorStop(1, "#17101b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  drawMoon(context, width * 0.19, height * 0.18, Math.min(width, height) * 0.045, "#f6d8a0", "rgba(255,181,91,.14)");
  for (let i = 0; i < 14; i++) {
    const x = ((i * 83) % Math.max(1, width));
    const y = height * (0.13 + ((i * 37) % 60) / 100);
    context.fillStyle = i % 2 ? "rgba(220,108,52,.16)" : "rgba(255,191,91,.12)";
    context.beginPath();
    context.ellipse(x + Math.sin(time * 0.0003 + i) * 4, y, 12, 4, i * 0.35, 0, Math.PI * 2);
    context.fill();
  }
}

function drawCemetery(context, width, height, time) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#11152b");
  gradient.addColorStop(0.62, "#20243a");
  gradient.addColorStop(1, "#0b111d");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  drawMoon(context, width * 0.72, height * 0.19, Math.min(width, height) * 0.105, "#d7d4f1", "rgba(176,183,255,.2)");
  for (let i = 0; i < 5; i++) {
    const y = height * (0.46 + i * 0.115);
    const x = width * 0.5 + Math.sin(time * 0.00012 + i) * width * 0.09;
    const mist = context.createLinearGradient(0, y, width, y + 26);
    mist.addColorStop(0, "rgba(182,194,220,0)");
    mist.addColorStop(0.45, "rgba(182,194,220,.07)");
    mist.addColorStop(1, "rgba(182,194,220,0)");
    context.fillStyle = mist;
    context.fillRect(0, y, width, 32);
    context.beginPath();
    context.ellipse(x, y + 9, width * 0.18, 8 + i, 0, 0, Math.PI * 2);
    context.fill();
  }
}

function drawWitchTown(context, width, height, time) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#171129");
  gradient.addColorStop(0.56, "#30203c");
  gradient.addColorStop(1, "#100c1b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  drawMoon(context, width * 0.78, height * 0.16, Math.min(width, height) * 0.07, "#ffe0ac", "rgba(255,159,192,.15)");
  for (let i = 0; i < 6; i++) {
    const x = i * width / 5 - width * 0.04;
    const baseY = height * (0.34 + (i % 2) * 0.08);
    context.fillStyle = "rgba(12, 8, 24, .66)";
    context.beginPath();
    context.moveTo(x, baseY + 35);
    context.lineTo(x + 18, baseY - 8);
    context.lineTo(x + 37, baseY + 35);
    context.closePath();
    context.fill();
    context.fillRect(x + 5, baseY + 25, 27, height * 0.22);
    context.fillStyle = `rgba(255, 185, 112, ${0.35 + Math.sin(time * 0.003 + i) * 0.07})`;
    context.fillRect(x + 14, baseY + 43, 8, 12);
  }
}

function drawLoversSky(context, width, height, time) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#11102d");
  gradient.addColorStop(0.45, "#30245a");
  gradient.addColorStop(1, "#17152f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  drawMoon(context, width * 0.5, height * 0.18, Math.min(width, height) * 0.12, "#fff0c4", "rgba(255,216,126,.24)");
  for (let i = 0; i < 5; i++) {
    const x = width * (0.12 + i * 0.19) + Math.sin(time * 0.00025 + i) * 12;
    const y = height * (0.57 + (i % 2) * 0.18);
    context.fillStyle = "rgba(160,132,226,.11)";
    context.beginPath();
    context.ellipse(x, y, width * 0.13, height * 0.045, 0, 0, Math.PI * 2);
    context.fill();
  }
  for (let i = 0; i < 32; i++) {
    const x = seededNumber(i, 4, 21) * width;
    const y = seededNumber(i, 9, 42) * height * 0.64;
    const twinkle = 0.45 + (Math.sin(time * 0.002 + i) + 1) * 0.25;
    context.fillStyle = `rgba(255, 237, 190, ${twinkle})`;
    context.beginPath();
    context.arc(x, y, i % 5 === 0 ? 1.8 : 1, 0, Math.PI * 2);
    context.fill();
  }
}

function drawCollectibleBackground(context, width, height, time) {
  const theme = currentTheme();
  if (typeof theme.drawBackground === "function") theme.drawBackground(context, width, height, time);
  else {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, theme.floorColors[0]);
    gradient.addColorStop(1, theme.floorColors[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }
}

function drawFloorCell(x, y, size, row, col) {
  const theme = currentTheme();
  const variation = seededNumber(row, col, state.levelIndex + 4);
  ctx.fillStyle = variation > 0.5 ? theme.floorColors[0] : theme.floorColors[1];
  ctx.fillRect(x, y, size + 0.5, size + 0.5);
  ctx.fillStyle = `rgba(255,255,255,${0.012 + variation * 0.018})`;
  ctx.fillRect(x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.76);
  if (state.levelIndex === 0 && variation > 0.78) {
    ctx.strokeStyle = "rgba(255,143,58,.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y + size * 0.67);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.2, x + size * 0.8, y + size * 0.65);
    ctx.stroke();
  } else if (state.levelIndex === 1 && variation > 0.74) {
    ctx.fillStyle = "rgba(255,178,91,.14)";
    ctx.beginPath();
    ctx.ellipse(x + size * 0.5, y + size * 0.55, size * 0.18, size * 0.08, -0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (state.levelIndex === 2 && variation > 0.76) {
    ctx.strokeStyle = "rgba(191,197,231,.16)";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.22, y + size * 0.28);
    ctx.lineTo(x + size * 0.78, y + size * 0.71);
    ctx.stroke();
  } else if (state.levelIndex === 4 && variation > 0.72) {
    ctx.fillStyle = "rgba(255,220,151,.26)";
    ctx.beginPath();
    ctx.arc(x + size * 0.28, y + size * 0.32, Math.max(1, size * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWallCell(x, y, size, row, col) {
  const theme = currentTheme();
  const variation = seededNumber(row, col, state.levelIndex + 19);
  const inset = Math.max(1, size * 0.035);
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, theme.wallColors[0]);
  gradient.addColorStop(1, theme.wallColors[1]);
  ctx.fillStyle = gradient;
  roundedRect(ctx, x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.16);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.045)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = state.levelIndex === 2 ? "rgba(176,183,222,.17)" : `${theme.accent}20`;
  ctx.lineWidth = Math.max(1, size * 0.045);
  ctx.beginPath();
  if ((row + col) % 2 === 0) {
    ctx.moveTo(x + size * 0.2, y + size * 0.72);
    ctx.quadraticCurveTo(x + size * 0.44, y + size * 0.42, x + size * 0.72, y + size * 0.24);
  } else {
    ctx.moveTo(x + size * 0.22, y + size * 0.27);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.58, x + size * 0.77, y + size * 0.75);
  }
  ctx.stroke();
  if (state.levelIndex === 3 && variation > 0.46) {
    ctx.fillStyle = "rgba(255,192,127,.78)";
    ctx.shadowColor = "#ffb46e";
    ctx.shadowBlur = size * 0.19;
    ctx.fillRect(x + size * 0.42, y + size * 0.35, size * 0.17, size * 0.22);
    ctx.shadowBlur = 0;
  } else if (state.levelIndex === 0 && variation > 0.63) {
    ctx.fillStyle = "rgba(255,141,46,.35)";
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (state.levelIndex === 4 && variation > 0.75) {
    drawTinyStar(ctx, x + size * 0.5, y + size * 0.5, size * 0.12, "rgba(255,226,160,.72)");
  }
}

function drawTinyStar(context, x, y, radius, color) {
  context.save();
  context.fillStyle = color;
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? radius : radius * 0.43;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function drawLeaf(context, x, y, size, angle, color) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, -size);
  context.quadraticCurveTo(size * 1.1, -size * 0.1, 0, size);
  context.quadraticCurveTo(-size * 0.8, 0, 0, -size);
  context.fill();
  context.restore();
}

function drawParticles(time) {
  for (const particle of state.particles) {
    const x = particle.x * canvasCssWidth;
    const y = particle.y * canvasCssHeight;
    const pulse = 0.65 + Math.sin(time * 0.002 + particle.phase) * 0.3;
    if (particle.kind === "leaf") {
      drawLeaf(ctx, x, y, particle.size * 1.8, particle.phase + time * 0.0006, `rgba(255, ${100 + Math.floor(pulse * 55)}, 52, ${particle.alpha})`);
    } else if (particle.kind === "fog") {
      ctx.fillStyle = `rgba(177, 188, 221, ${particle.alpha * 0.09})`;
      ctx.beginPath();
      ctx.ellipse(x, y, particle.size * 12, particle.size * 4, Math.sin(particle.phase), 0, Math.PI * 2);
      ctx.fill();
    } else if (particle.kind === "star") {
      drawTinyStar(ctx, x, y, particle.size * pulse, `rgba(255, 230, 169, ${particle.alpha})`);
    } else {
      const color = state.levelIndex === 1 ? "255, 196, 111" : state.levelIndex === 3 ? "255, 173, 203" : "205, 186, 255";
      ctx.fillStyle = `rgba(${color}, ${particle.alpha * pulse})`;
      ctx.shadowColor = `rgba(${color}, .8)`;
      ctx.shadowBlur = particle.size * 4;
      ctx.beginPath();
      ctx.arc(x, y, particle.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

function drawPumpkin(context, x, y, radius, time) {
  context.save();
  context.translate(x, y + Math.sin(time * 0.003 + x) * radius * 0.06);
  context.shadowColor = "#ff9d3d";
  context.shadowBlur = radius * 1.05;
  context.fillStyle = "#ff8d2e";
  for (let i = -1; i <= 1; i++) {
    context.beginPath();
    context.ellipse(i * radius * 0.28, 0, radius * 0.34, radius * 0.48, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;
  context.fillStyle = "#6d9b48";
  roundedRect(context, -radius * 0.1, -radius * 0.53, radius * 0.2, radius * 0.23, radius * 0.06);
  context.fill();
  context.fillStyle = "#441329";
  context.beginPath();
  context.moveTo(-radius * 0.42, -radius * 0.08);
  context.lineTo(-radius * 0.15, -radius * 0.01);
  context.lineTo(-radius * 0.32, radius * 0.15);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(radius * 0.42, -radius * 0.08);
  context.lineTo(radius * 0.15, -radius * 0.01);
  context.lineTo(radius * 0.32, radius * 0.15);
  context.closePath();
  context.fill();
  context.strokeStyle = "#441329";
  context.lineWidth = Math.max(1, radius * 0.09);
  context.beginPath();
  context.arc(0, radius * 0.06, radius * 0.22, 0.18, Math.PI - 0.18);
  context.stroke();
  context.restore();
}

function drawSquirrel(context, x, y, radius, time) {
  context.save();
  context.translate(x, y + Math.sin(time * 0.0035 + y) * radius * 0.05);
  context.shadowColor = "rgba(255, 177, 91, .7)";
  context.shadowBlur = radius * 0.55;
  context.fillStyle = "#bd653a";
  context.beginPath();
  context.arc(-radius * 0.14, radius * 0.11, radius * 0.37, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(radius * 0.16, -radius * 0.25, radius * 0.3, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(-radius * 0.28, -radius * 0.15, radius * 0.4, 0.75, Math.PI * 1.85);
  context.lineWidth = radius * 0.2;
  context.strokeStyle = "#d9874c";
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = "#f5c79d";
  context.beginPath();
  context.arc(radius * 0.24, -radius * 0.2, radius * 0.16, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#24121b";
  context.beginPath();
  context.arc(radius * 0.25, -radius * 0.29, radius * 0.045, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d99a4e";
  context.beginPath();
  context.ellipse(radius * 0.35, radius * 0.28, radius * 0.12, radius * 0.17, -0.45, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#684125";
  context.beginPath();
  context.ellipse(radius * 0.35, radius * 0.24, radius * 0.085, radius * 0.11, -0.45, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBat(context, x, y, radius, time) {
  const flap = Math.sin(time * 0.012 + x) * radius * 0.12;
  context.save();
  context.translate(x, y);
  context.shadowColor = "#c8bdff";
  context.shadowBlur = radius * 0.8;
  context.fillStyle = "#29243f";
  context.beginPath();
  context.moveTo(0, -radius * 0.12);
  context.quadraticCurveTo(-radius * 0.33, -radius * 0.55, -radius * 0.85, -radius * 0.18 + flap);
  context.lineTo(-radius * 0.65, radius * 0.29);
  context.lineTo(-radius * 0.36, radius * 0.12);
  context.lineTo(0, radius * 0.44);
  context.lineTo(radius * 0.36, radius * 0.12);
  context.lineTo(radius * 0.65, radius * 0.29);
  context.lineTo(radius * 0.85, -radius * 0.18 - flap);
  context.quadraticCurveTo(radius * 0.33, -radius * 0.55, 0, -radius * 0.12);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#ffb5d2";
  context.beginPath();
  context.arc(-radius * 0.16, 0, radius * 0.055, 0, Math.PI * 2);
  context.arc(radius * 0.16, 0, radius * 0.055, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawCat(context, x, y, radius, time) {
  context.save();
  context.translate(x, y + Math.sin(time * 0.0025 + x) * radius * 0.04);
  context.shadowColor = "rgba(203, 175, 255, .65)";
  context.shadowBlur = radius * 0.7;
  context.fillStyle = "#100e1d";
  context.beginPath();
  context.moveTo(-radius * 0.48, -radius * 0.12);
  context.lineTo(-radius * 0.47, -radius * 0.72);
  context.lineTo(-radius * 0.08, -radius * 0.45);
  context.lineTo(radius * 0.2, -radius * 0.49);
  context.lineTo(radius * 0.52, -radius * 0.72);
  context.lineTo(radius * 0.48, -radius * 0.08);
  context.arc(0, radius * 0.05, radius * 0.49, 0, Math.PI, false);
  context.closePath();
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#ffb5dc";
  context.beginPath();
  context.arc(-radius * 0.18, -radius * 0.04, radius * 0.065, 0, Math.PI * 2);
  context.arc(radius * 0.18, -radius * 0.04, radius * 0.065, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffb5dc";
  context.beginPath();
  context.moveTo(0, radius * 0.11);
  context.lineTo(-radius * 0.07, radius * 0.2);
  context.lineTo(radius * 0.07, radius * 0.2);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(255, 220, 244, .75)";
  context.lineWidth = Math.max(1, radius * 0.025);
  context.beginPath();
  context.moveTo(-radius * 0.18, radius * 0.22);
  context.lineTo(-radius * 0.42, radius * 0.18);
  context.moveTo(radius * 0.18, radius * 0.22);
  context.lineTo(radius * 0.42, radius * 0.18);
  context.stroke();
  context.restore();
}

function drawLoveStar(context, x, y, radius, time) {
  const pulse = 1 + Math.sin(time * 0.005 + x) * 0.09;
  context.save();
  context.translate(x, y);
  context.scale(pulse, pulse);
  context.shadowColor = "#ffe5a0";
  context.shadowBlur = radius * 1.2;
  context.fillStyle = "#ffe4a2";
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = (i % 2 === 0 ? radius : radius * 0.46);
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255,255,255,.9)";
  context.lineWidth = Math.max(1, radius * 0.045);
  context.stroke();
  context.restore();
}

function drawCollectible(item, time) {
  if (item.collected) return;
  const size = state.tile;
  const x = state.offsetX + (item.col + 0.5) * size;
  const y = state.offsetY + (item.row + 0.5) * size;
  const radius = size * 0.31;
  ctx.save();
  ctx.globalAlpha = 0.96;
  switch (state.levelIndex) {
    case 0: drawPumpkin(ctx, x, y, radius, time); break;
    case 1: drawSquirrel(ctx, x, y, radius, time); break;
    case 2: drawBat(ctx, x, y, radius, time); break;
    case 3: drawCat(ctx, x, y, radius, time); break;
    default: drawLoveStar(ctx, x, y, radius * 1.2, time); break;
  }
  ctx.restore();
}

function drawPlayer(time, position = state.player, alpha = 1, scale = 1) {
  const size = state.tile;
  const x = state.offsetX + (position.col + 0.5) * size;
  const y = state.offsetY + (position.row + 0.5) * size;
  const bob = Math.sin(time * 0.006) * size * 0.035;
  const radius = size * 0.39 * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  const aura = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, radius * 1.8);
  aura.addColorStop(0, "rgba(255, 210, 168, .45)");
  aura.addColorStop(0.48, "rgba(255, 139, 93, .18)");
  aura.addColorStop(1, "rgba(255, 139, 93, 0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, y + bob, radius * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `700 ${Math.max(17, size * 0.75 * scale)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(21, 10, 22, .82)";
  ctx.lineWidth = Math.max(2, size * 0.095);
  ctx.strokeText("E", x, y + bob);
  ctx.fillStyle = "#fff4db";
  ctx.shadowColor = "#ff9b6b";
  ctx.shadowBlur = size * 0.42;
  ctx.fillText("E", x, y + bob);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawExit(time, position = state.exit, alpha = 1, scale = 1) {
  const size = state.tile;
  const x = state.offsetX + (position.col + 0.5) * size;
  const y = state.offsetY + (position.row + 0.5) * size;
  const pulse = 1 + Math.sin(time * 0.004) * 0.09;
  const radius = size * 0.45 * scale * pulse;
  ctx.save();
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * 2.3);
  glow.addColorStop(0, "rgba(255, 226, 159, .42)");
  glow.addColorStop(0.36, "rgba(213, 171, 255, .18)");
  glow.addColorStop(1, "rgba(213, 171, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 230, 174, ${0.65 + Math.sin(time * 0.005) * 0.18})`;
  ctx.lineWidth = Math.max(1.5, size * 0.055);
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.91, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `700 ${Math.max(20, size * 0.95 * scale)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(32, 18, 48, .9)";
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeText("Z", x, y);
  ctx.fillStyle = "#fff4c9";
  ctx.shadowColor = "#ffe3a0";
  ctx.shadowBlur = size * 0.7;
  ctx.fillText("Z", x, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMaze(time) {
  for (let row = 0; row < state.maze.length; row++) {
    for (let col = 0; col < state.maze[row].length; col++) {
      const x = state.offsetX + col * state.tile;
      const y = state.offsetY + row * state.tile;
      if (state.maze[row][col] === 0) drawFloorCell(x, y, state.tile, row, col);
      else drawWallCell(x, y, state.tile, row, col);
    }
  }
  for (const item of state.collectibles) drawCollectible(item, time);
  if (state.transition?.type === "reunion") {
    const progress = clamp((time - state.transition.startedAt) / 1150, 0, 1);
    const ease = progress * progress * (3 - 2 * progress);
    const ePosition = {
      row: state.player.row + (state.exit.row - state.player.row) * ease,
      col: state.player.col + (state.exit.col - state.player.col) * ease,
    };
    const zPosition = {
      row: state.exit.row + (state.player.row - state.exit.row) * ease,
      col: state.exit.col + (state.player.col - state.exit.col) * ease,
    };
    drawExit(time, zPosition, 1 - ease * 0.18, 1 - ease * 0.2);
    drawPlayer(time, ePosition, 1, 1 - ease * 0.18);
    if (progress > 0.48) drawHeartBurst(time, progress);
  } else {
    drawExit(time);
    drawPlayer(time);
  }
}

function drawHeartBurst(time, progress) {
  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + 0.18;
    const travel = state.tile * (0.8 + progress * 2.4);
    const x = state.offsetX + (state.exit.col + 0.5) * state.tile + Math.cos(angle) * travel;
    const y = state.offsetY + (state.exit.row + 0.5) * state.tile + Math.sin(angle) * travel - progress * state.tile * 0.6;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress * 0.9);
    ctx.fillStyle = i % 2 ? "#ffabc9" : "#ffe3a0";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = state.tile * 0.3;
    ctx.font = `${Math.max(11, state.tile * 0.38)}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(HEART_CHARS[i % HEART_CHARS.length], x, y);
    ctx.restore();
  }
}

function renderFrame(time = 0) {
  const delta = lastFrameTime ? time - lastFrameTime : 16;
  lastFrameTime = time;
  ctx.clearRect(0, 0, canvasCssWidth, canvasCssHeight);
  drawCollectibleBackground(ctx, canvasCssWidth, canvasCssHeight, time);
  if (state.screen === "playing" || state.screen === "transition") {
    state.elapsedMs += Math.max(0, Math.min(delta, 40));
  }
  updateParticles(delta);
  drawParticles(time);
  if (state.maze.length) {
    calculateBoardGeometry();
    drawMaze(time);
  }
  if (state.screen === "transition" && state.transition?.type === "reunion" && time - state.transition.startedAt >= 1350) {
    state.transition = null;
    if (state.levelIndex >= LEVEL_THEMES.length - 1) showFinalScreen();
    else showIntermissionScreen();
  }
  animationFrameId = window.requestAnimationFrame(renderFrame);
}

function updateHud() {
  const theme = currentTheme();
  nivelEl.textContent = `Nivel ${state.levelIndex + 1} de ${LEVEL_THEMES.length}`;
  collectibleLabelEl.textContent = theme.collectibleLabel;
  collectibleCountEl.textContent = `${state.levelCollected}/${theme.collectibles}`;
  if (state.screen === "paused") estadoEl.textContent = "En pausa";
  else if (state.screen === "start") estadoEl.textContent = "Preparando la aventura";
  else if (state.screen === "complete") estadoEl.textContent = "Aventura completada";
  else estadoEl.textContent = state.levelCollected === theme.collectibles ? "La Z ya puede recibirte" : "Busca los destellos";
}

function setOverlay(visible, kicker = "", title = "", text = "", buttonLabel = "Continuar") {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonLabel;
  overlay.classList.toggle("visible", visible);
  overlay.setAttribute("aria-hidden", String(!visible));
}

function showStartScreen() {
  state.screen = "start";
  state.transition = null;
  dedicationSlot.classList.remove("visible");
  setOverlay(true, "Un cuento solo nuestro", "Donde termina la niebla", "Recorre cinco mundos encantados, recoge sus pequeños tesoros y encuentra la Z. Mueve a la E con las flechas o WASD; en móvil, usa los controles táctiles. Pulsa P para pausar.", "Empezar");
  mensajeEl.textContent = "Hay un camino secreto que solo se abre siguiendo el corazón.";
  updateHud();
}

function showPauseScreen() {
  if (state.screen !== "playing") return;
  state.screen = "paused";
  setOverlay(true, "La noche espera", "Pausa encantada", "Respira un momento. El laberinto seguirá donde lo dejaste.", "Reanudar");
  mensajeEl.textContent = "Todo puede esperar un instante.";
  updateHud();
}

function resumeGame() {
  if (state.screen !== "paused") return;
  state.screen = "playing";
  setOverlay(false);
  mensajeEl.textContent = "Sigue el brillo; tu destino te espera.";
  updateHud();
}

function showIntermissionScreen() {
  state.screen = "intermission";
  const next = LEVEL_THEMES[state.levelIndex + 1];
  const progress = Math.round(((state.levelIndex + 1) / LEVEL_THEMES.length) * 100);
  setOverlay(true, `Capítulo ${state.levelIndex + 1} completado`, "El camino continúa", `${currentTheme().betweenLine}\n\nProgreso: ${progress}%. Próxima parada: ${next.title.toLowerCase()}.`, "Siguiente nivel");
  mensajeEl.textContent = currentTheme().betweenLine;
  updateHud();
}

function showFinalScreen() {
  state.screen = "complete";
  state.elapsedMs = Math.max(0, state.elapsedMs);
  dedicationSlot.classList.add("visible");
  if (!dedicationSlot.textContent.trim()) {
    dedicationSlot.textContent = "Nuestra dedicatoria: escribe aquí unas palabras para Z…";
    dedicationSlot.setAttribute("contenteditable", "true");
    dedicationSlot.setAttribute("role", "textbox");
    dedicationSlot.setAttribute("aria-label", "Dedicatoria personal");
  }
  setOverlay(true, "Fin del cuento, no del amor", "Siempre te elegiría", `Has recorrido los cinco mundos y reunido ${state.totalCollected} tesoros. Tiempo de aventura: ${formatTime(state.elapsedMs)}.\n\nLa E encontró la Z; que esta historia siga escribiéndose fuera del laberinto.`, "Jugar de nuevo");
  mensajeEl.textContent = "La luna guarda vuestro final favorito.";
  updateHud();
}

function beginLevel(index) {
  state.levelIndex = index;
  const theme = currentTheme();
  state.maze = generateMaze(theme.rows, theme.cols);
  state.player = { row: 1, col: 1 };
  state.exit = findFarthestCell(state.maze, state.player);
  const path = findPath(state.maze, state.player, state.exit);
  state.collectibles = placeCollectibles(path, theme.collectibles);
  state.levelCollected = 0;
  state.transition = null;
  state.screen = "playing";
  populateParticles();
  calculateBoardGeometry();
  setOverlay(false);
  collectibleModal.classList.remove("visible");
  mensajeEl.textContent = theme.subtitle;
  updateHud();
}

function startNewGame() {
  state.levelIndex = 0;
  state.levelCollected = 0;
  state.totalCollected = 0;
  state.elapsedMs = 0;
  state.startedAt = performance.now();
  state.transition = null;
  lastMoveAt = 0;
  beginLevel(0);
}

function nextLevel() {
  if (state.screen !== "intermission") return;
  beginLevel(state.levelIndex + 1);
}

function restartGame() {
  dedicationSlot.classList.remove("visible");
  startNewGame();
}

function collectItem(item) {
  if (item.collected) return;
  item.collected = true;
  state.levelCollected++;
  state.totalCollected++;
  const theme = currentTheme();
  const message = theme.messages[(state.levelCollected - 1) % theme.messages.length];
  collectibleKicker.textContent = `Un pequeño tesoro · ${state.levelCollected}/${theme.collectibles}`;
  collectibleTitle.textContent = theme.collectibleSingle;
  collectibleText.textContent = message;
  collectibleAction.textContent = "Seguir el camino";
  collectibleModal.classList.add("visible");
  collectibleModal.setAttribute("aria-hidden", "false");
  state.screen = "collectible";
  mensajeEl.textContent = message;
  updateHud();
}

function closeCollectibleModal() {
  if (state.screen !== "collectible") return;
  collectibleModal.classList.remove("visible");
  collectibleModal.setAttribute("aria-hidden", "true");
  state.screen = "playing";
  if (state.levelCollected === currentTheme().collectibles) {
    mensajeEl.textContent = "Ya reuniste todos los tesoros; busca la Z brillante.";
  } else {
    mensajeEl.textContent = currentTheme().subtitle;
  }
  updateHud();
}

function beginReunion() {
  state.screen = "transition";
  state.transition = { type: "reunion", startedAt: performance.now() };
  for (let i = 0; i < 12 && state.particles.length < MAX_PARTICLES; i++) {
    state.particles.push({
      x: (state.offsetX + (state.exit.col + 0.5) * state.tile) / Math.max(1, canvasCssWidth),
      y: (state.offsetY + (state.exit.row + 0.5) * state.tile) / Math.max(1, canvasCssHeight),
      vx: randomBetween(-0.00035, 0.00035),
      vy: randomBetween(-0.0007, -0.0001),
      size: randomBetween(2, 4),
      phase: randomBetween(0, Math.PI * 2),
      kind: "glow",
      alpha: 0.9,
    });
  }
  mensajeEl.textContent = "Dos letras, un mismo destino.";
}

function attemptMove(deltaRow, deltaCol) {
  if (state.screen !== "playing") return;
  const now = performance.now();
  if (now - lastMoveAt < MOVE_DELAY_MS) return;
  lastMoveAt = now;
  const row = state.player.row + deltaRow;
  const col = state.player.col + deltaCol;
  if (row < 0 || row >= state.maze.length || col < 0 || col >= state.maze[0].length) return;
  if (state.maze[row][col] !== 0) {
    mensajeEl.textContent = "Las ramas susurran: por aquí aún no.";
    return;
  }
  state.player = { row, col };
  state.movePulseUntil = now + 170;
  const item = state.collectibles.find((entry) => !entry.collected && entry.row === row && entry.col === col);
  if (item) {
    collectItem(item);
    return;
  }
  if (row === state.exit.row && col === state.exit.col) {
    if (state.levelCollected < currentTheme().collectibles) {
      const remaining = currentTheme().collectibles - state.levelCollected;
      mensajeEl.textContent = `La Z te espera: faltan ${remaining} ${remaining === 1 ? "tesoro" : "tesoros"}.`;
      return;
    }
    beginReunion();
  }
}

function handleOverlayAction() {
  switch (state.screen) {
    case "start": startNewGame(); break;
    case "paused": resumeGame(); break;
    case "intermission": nextLevel(); break;
    case "complete": restartGame(); break;
    default: break;
  }
}

function onKeyDown(event) {
  const key = event.code || event.key;
  const isPause = key === "KeyP" || event.key?.toLowerCase() === "p" || key === "Escape";
  if (isPause) {
    event.preventDefault();
    if (state.screen === "playing") showPauseScreen();
    else if (state.screen === "paused") resumeGame();
    return;
  }
  const movement = MOVE_KEYS[key] || MOVE_KEYS[event.key];
  if (!movement) return;
  if (state.screen === "playing") event.preventDefault();
  attemptMove(movement.row, movement.col);
}

function bindTouchControls() {
  for (const button of touchButtons) {
    button.addEventListener("click", () => {
      const direction = button.dataset.direction || [...button.classList].find((name) => ["up", "down", "left", "right"].includes(name));
      const mapping = {
        up: { row: -1, col: 0 },
        down: { row: 1, col: 0 },
        left: { row: 0, col: -1 },
        right: { row: 0, col: 1 },
      };
      if (mapping[direction]) attemptMove(mapping[direction].row, mapping[direction].col);
    });
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }
}

function bindGameEvents() {
  overlayButton.addEventListener("click", handleOverlayAction);
  collectibleAction.addEventListener("click", closeCollectibleModal);
  document.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", resizeCanvas, { passive: true });
  bindTouchControls();
  // Evita que un toque sobre los controles desplace la página durante la partida.
  document.querySelectorAll(".touch-btn").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.preventDefault());
  });
}

// Cada nivel mantiene su configuración de tema, paleta, mensajes y fondo.
LEVEL_THEMES[0].drawBackground = drawPumpkinForest;
LEVEL_THEMES[1].drawBackground = drawSquirrelForest;
LEVEL_THEMES[2].drawBackground = drawCemetery;
LEVEL_THEMES[3].drawBackground = drawWitchTown;
LEVEL_THEMES[4].drawBackground = drawLoversSky;

function initializeGame() {
  resizeCanvas();
  populateParticles();
  bindGameEvents();
  showStartScreen();
  if (!animationFrameId) animationFrameId = window.requestAnimationFrame(renderFrame);
}

initializeGame();
