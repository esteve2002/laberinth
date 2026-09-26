// 0 = camino, 1 = pared (el personaje se dibuja aparte, no forma parte de la matriz)

const DEBUG = true; // ponlo en false cuando ya funcione

// --------------------------------------------------------------------------
// Pieza 1: generación aleatoria del laberinto (DFS con backtracking)
// --------------------------------------------------------------------------
function generarLaberinto(filas, columnas) {
  const alto = filas % 2 === 0 ? filas + 1 : filas;
  const ancho = columnas % 2 === 0 ? columnas + 1 : columnas;

  const laberinto = Array.from({ length: alto }, () => Array(ancho).fill(1));

  function esValida(f, c) {
    return f > 0 && f < alto - 1 && c > 0 && c < ancho - 1;
  }

  function mezclar(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function excavar(f, c) {
    laberinto[f][c] = 0;
    const direcciones = mezclar([[-2, 0], [2, 0], [0, -2], [0, 2]]);

    for (const [df, dc] of direcciones) {
      const nf = f + df;
      const nc = c + dc;
      if (esValida(nf, nc) && laberinto[nf][nc] === 1) {
        laberinto[f + df / 2][c + dc / 2] = 0;
        excavar(nf, nc);
      }
    }
  }

  excavar(1, 1);
  return laberinto;
}

// --------------------------------------------------------------------------
// Pieza 2: personaje, entrada y salida
// --------------------------------------------------------------------------
function colocarPersonajeAleatorio(laberinto) {
  const caminos = [];
  for (let f = 0; f < laberinto.length; f++) {
    for (let c = 0; c < laberinto[0].length; c++) {
      if (laberinto[f][c] === 0) caminos.push({ f, c });
    }
  }
  return caminos[Math.floor(Math.random() * caminos.length)];
}

function contarParedesAlrededor(laberinto, f, c) {
  const vecinos = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let paredes = 0;
  for (const [df, dc] of vecinos) {
    if (laberinto[f + df][c + dc] === 1) paredes++;
  }
  return paredes;
}

function colocarEntradaYSalida(laberinto, entrada) {
  const caminos = [];
  for (let f = 0; f < laberinto.length; f++) {
    for (let c = 0; c < laberinto[0].length; c++) {
      const esEntrada = f === entrada.f && c === entrada.c;
      if (laberinto[f][c] === 0 && !esEntrada && contarParedesAlrededor(laberinto, f, c) >= 3) {
        caminos.push({ f, c });
      }
    }
  }
  const salida = caminos[Math.floor(Math.random() * caminos.length)];
  return { entrada, salida };
}

function haLlegadoALaSalida(personaje, salida) {
  return personaje.f === salida.f && personaje.c === salida.c;
}

function moverPersonaje(laberinto, pos, df, dc) {
  const nf = pos.f + df;
  const nc = pos.c + dc;
  const dentro = nf >= 0 && nf < laberinto.length && nc >= 0 && nc < laberinto[0].length;
  if (dentro && laberinto[nf][nc] === 0) return { f: nf, c: nc };
  return pos;
}

// --------------------------------------------------------------------------
// Pieza 3: pintar en isométrico, con paleta romántica
// --------------------------------------------------------------------------
const ANCHO_TILE = 32;
const ALTO_TILE = 16;
const ALTURA_PARED = 10; // menor que ALTO_TILE para que no tape la fila de detrás

// Paleta rosa/rojo en vez del azul original
const COLOR_CAMINO = "#fff0f3";
const COLOR_ENTRADA_SALIDA = "#4ade80"; // verde, se mantiene para que destaque sobre el rosa
const COLOR_PARED_TEJADO_1 = "#ff8fa3";
const COLOR_PARED_TEJADO_2 = "#ff4d6d";
const COLOR_PARED_IZQ = "#a4133c";
const COLOR_PARED_DER = "#c9184a";
const COLOR_CORAZON = "#e0115f";

function celdaAIsometrico(fila, columna, offsetX, offsetY) {
  return {
    x: (columna - fila) * (ANCHO_TILE / 2) + offsetX,
    y: (columna + fila) * (ALTO_TILE / 2) + offsetY,
  };
}

function pintarSuelo(ctx, cx, cy, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - ALTO_TILE / 2);
  ctx.lineTo(cx + ANCHO_TILE / 2, cy);
  ctx.lineTo(cx, cy + ALTO_TILE / 2);
  ctx.lineTo(cx - ANCHO_TILE / 2, cy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Bloque (pared) con degradado en el tejado y sombra propia para dar profundidad
function pintarBloque(ctx, cx, cy) {
  const right = cx + ANCHO_TILE / 2;
  const bottom = cy + ALTO_TILE / 2;
  const left = cx - ANCHO_TILE / 2;

  // Sombra proyectada por el bloque, solo mientras pintamos la cara izquierda
  ctx.save();
  ctx.shadowColor = "rgba(128, 15, 47, 0.45)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;

  ctx.beginPath();
  ctx.moveTo(left, cy);
  ctx.lineTo(cx, bottom);
  ctx.lineTo(cx, bottom - ALTURA_PARED);
  ctx.lineTo(left, cy - ALTURA_PARED);
  ctx.closePath();
  ctx.fillStyle = COLOR_PARED_IZQ;
  ctx.fill();
  ctx.restore(); // quitamos la sombra para que no se acumule en las siguientes caras

  // Cara derecha
  ctx.beginPath();
  ctx.moveTo(right, cy);
  ctx.lineTo(cx, bottom);
  ctx.lineTo(cx, bottom - ALTURA_PARED);
  ctx.lineTo(right, cy - ALTURA_PARED);
  ctx.closePath();
  ctx.fillStyle = COLOR_PARED_DER;
  ctx.fill();

  // Tejado con degradado rosa, para que no quede plano
  const topY = cy - ALTURA_PARED;
  const degradado = ctx.createLinearGradient(left, topY, right, topY);
  degradado.addColorStop(0, COLOR_PARED_TEJADO_1);
  degradado.addColorStop(1, COLOR_PARED_TEJADO_2);
  pintarSuelo(ctx, cx, topY, degradado);
}

// Corazón en vez de círculo, con sombra suave debajo
function pintarCorazon(ctx, cx, cy, tamano) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  const arriba = cy - tamano * 0.35;
  ctx.moveTo(cx, arriba + tamano * 0.3);
  ctx.bezierCurveTo(
    cx - tamano, arriba - tamano * 0.3,
    cx - tamano, arriba + tamano * 0.6,
    cx, arriba + tamano * 1.1
  );
  ctx.bezierCurveTo(
    cx + tamano, arriba + tamano * 0.6,
    cx + tamano, arriba - tamano * 0.3,
    cx, arriba + tamano * 0.3
  );
  ctx.closePath();

  ctx.fillStyle = COLOR_CORAZON;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#7a0930";
  ctx.stroke();
  ctx.restore();
}

function pintarLaberinto(ctx, laberinto, entrada, salida, offsetX, offsetY, personajeX, personajeY) {
  const celdas = [];
  for (let f = 0; f < laberinto.length; f++) {
    for (let c = 0; c < laberinto[0].length; c++) {
      celdas.push({ f, c });
    }
  }
  celdas.sort((a, b) => (a.f + a.c) - (b.f + b.c));

  for (const { f, c } of celdas) {
    const { x, y } = celdaAIsometrico(f, c, offsetX, offsetY);

    if (laberinto[f][c] === 1) {
      pintarBloque(ctx, x, y);
    } else {
      const esEntrada = f === entrada.f && c === entrada.c;
      const esSalida = f === salida.f && c === salida.c;
      const color = (esEntrada || esSalida) ? COLOR_ENTRADA_SALIDA : COLOR_CAMINO;
      pintarSuelo(ctx, x, y, color);
    }
  }

  pintarCorazon(ctx, personajeX, personajeY - ALTO_TILE / 2, ANCHO_TILE / 4);
}

// --------------------------------------------------------------------------
// Arranque
// --------------------------------------------------------------------------
const laberinto = generarLaberinto(9, 13);
let personaje = colocarPersonajeAleatorio(laberinto);
const { entrada, salida } = colocarEntradaYSalida(laberinto, personaje);
let juegoTerminado = false;

const canvas = document.getElementById("laberinto");
if (!canvas) {
  throw new Error(
    'No se encontró <canvas id="laberinto">. Revisa el id y que el <script> ' +
    "esté al final del <body> (o tenga el atributo defer)."
  );
}

const filas = laberinto.length;
const columnas = laberinto[0].length;
canvas.width = (filas + columnas) * (ANCHO_TILE / 2) + 40;
canvas.height = (filas + columnas) * (ALTO_TILE / 2) + ALTURA_PARED + 40;
const ctx = canvas.getContext("2d");

const offsetX = canvas.width / 2;
const offsetY = 30;

const inicio = celdaAIsometrico(personaje.f, personaje.c, offsetX, offsetY);
let posActualX = inicio.x;
let posActualY = inicio.y;
let posObjetivoX = posActualX;
let posObjetivoY = posActualY;

if (DEBUG) console.log("entrada:", entrada, "salida:", salida);

// --------------------------------------------------------------------------
// Control por teclado
// --------------------------------------------------------------------------
const MOVIMIENTOS = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
  KeyW: [-1, 0], KeyS: [1, 0], KeyA: [0, -1], KeyD: [0, 1],
};

document.addEventListener("keydown", (e) => {
  const movimiento = MOVIMIENTOS[e.code];
  if (!movimiento) return;
  if (juegoTerminado) return;

  e.preventDefault();

  const [df, dc] = movimiento;
  personaje = moverPersonaje(laberinto, personaje, df, dc);

  const destino = celdaAIsometrico(personaje.f, personaje.c, offsetX, offsetY);
  posObjetivoX = destino.x;
  posObjetivoY = destino.y;

  if (DEBUG) console.log("tecla:", e.code, "→ celda:", personaje);

  if (haLlegadoALaSalida(personaje, salida)) {
    juegoTerminado = true;
    alert("¡Has llegado a la salida! 💕");
  }
});

// --------------------------------------------------------------------------
// Bucle de animación
// --------------------------------------------------------------------------
const SUAVIZADO = 15;
let ultimoTiempo = performance.now();

function animar(ahora) {
  const dt = Math.min((ahora - ultimoTiempo) / 1000, 0.1);
  ultimoTiempo = ahora;

  const factor = 1 - Math.exp(-SUAVIZADO * dt);
  posActualX += (posObjetivoX - posActualX) * factor;
  posActualY += (posObjetivoY - posActualY) * factor;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pintarLaberinto(ctx, laberinto, entrada, salida, offsetX, offsetY, posActualX, posActualY);
  requestAnimationFrame(animar);
}

requestAnimationFrame(animar);