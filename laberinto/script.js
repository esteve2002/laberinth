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
// Pieza 2: colocar al personaje y moverlo
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
// --------------------------------------------------------------------------
// Pieza 2: colocar la entrada y la salida de el camino
// --------------------------------------------------------------------------
function colocarEntradaYSalidaLaberinto(personajeX, personajeY){
  for (let f = 0; f < laberinto.length; f++) {
    for (let c = 0; c < laberinto[0].length; c++) {
      if(laberinto[f][c] != laberinto[personajeX][pers])

      ctx.fillStyle = laberinto[f][c] != laberinto[personajeX][personajeY]
        ? "hsla(135, 100%, 35%, 0.49)" // pared
        : "#f4f4f4";                   // camino
      ctx.fillRect(c * TAMANO_CELDA, f * TAMANO_CELDA, TAMANO_CELDA, TAMANO_CELDA);
    }
  }
}

// Intenta mover al personaje una celda. df = cambio de fila, dc = cambio de columna.
// Devuelve la nueva posición si se puede, o la misma si hay pared / borde.
function moverPersonaje(laberinto, pos, df, dc) {
  const nf = pos.f + df;
  const nc = pos.c + dc;

  const dentro =
    nf >= 0 && nf < laberinto.length &&
    nc >= 0 && nc < laberinto[0].length;

  if (dentro && laberinto[nf][nc] === 0) {
    return { f: nf, c: nc };
  }
  return pos; // pared o fuera del laberinto: no se mueve
}

// --------------------------------------------------------------------------
// Pieza 3: pintar con canvas
// --------------------------------------------------------------------------
const TAMANO_CELDA = 24;

function centroCelda(fila, columna) {
  return {
    x: columna * TAMANO_CELDA + TAMANO_CELDA / 2,
    y: fila * TAMANO_CELDA + TAMANO_CELDA / 2,
  };
}

function pintarLaberinto(ctx, laberinto, personajeX, personajeY) {
  for (let f = 0; f < laberinto.length; f++) {
    for (let c = 0; c < laberinto[0].length; c++) {
      ctx.fillStyle = laberinto[f][c] === 1
        ? "hsla(197, 79%, 50%, 0.49)" // pared
        : "#f4f4f4";                   // camino
      ctx.fillRect(c * TAMANO_CELDA, f * TAMANO_CELDA, TAMANO_CELDA, TAMANO_CELDA);
    }
  }

  ctx.beginPath();
  ctx.arc(personajeX, personajeY, TAMANO_CELDA / 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#e63946";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#7a0f19";
  ctx.stroke();
}

// --------------------------------------------------------------------------
// Arranque
// --------------------------------------------------------------------------
const laberinto = generarLaberinto(9, 13);
let personaje = colocarPersonajeAleatorio(laberinto);

const canvas = document.getElementById("laberinto");
if (!canvas) {
  throw new Error(
    'No se encontró <canvas id="laberinto">. Revisa el id y que el <script> ' +
    "esté al final del <body> (o tenga el atributo defer)."
  );
}
canvas.width = laberinto[0].length * TAMANO_CELDA;
canvas.height = laberinto.length * TAMANO_CELDA;
const ctx = canvas.getContext("2d");

// Posiciones actuales y objetivo en píxeles
const inicio = centroCelda(personaje.f, personaje.c);
let posActualX = inicio.x;
let posActualY = inicio.y;
let posObjetivoX = posActualX;
let posObjetivoY = posActualY;

// --------------------------------------------------------------------------
// Control por teclado
// --------------------------------------------------------------------------
// Cada tecla se traduce a un cambio de [fila, columna].
// Usamos e.code (tecla física) para que WASD funcione en cualquier idioma de teclado.
const MOVIMIENTOS = {
  ArrowUp:    [-1, 0],
  ArrowDown:  [1, 0],
  ArrowLeft:  [0, -1],
  ArrowRight: [0, 1],
  KeyW:       [-1, 0],
  KeyS:       [1, 0],
  KeyA:       [0, -1],
  KeyD:       [0, 1],
};

document.addEventListener("keydown", (e) => {
  const movimiento = MOVIMIENTOS[e.code];
  if (!movimiento) return; // no es una tecla de movimiento, la ignoramos

  e.preventDefault(); // evita que las flechas hagan scroll en la página

  const [df, dc] = movimiento;
  personaje = moverPersonaje(laberinto, personaje, df, dc);

  // Actualizamos SOLO el objetivo: la animación se encarga de ir hasta allí
  const destino = centroCelda(personaje.f, personaje.c);
  posObjetivoX = destino.x;
  posObjetivoY = destino.y;

  if (DEBUG) console.log("tecla:", e.code, "→ celda:", personaje);
});

// --------------------------------------------------------------------------
// Bucle de animación
// --------------------------------------------------------------------------
// Cuánto de rápido "persigue" al objetivo. Mayor = más rápido.
const SUAVIZADO = 15;

let ultimoTiempo = performance.now();

function animar(ahora) {
  const dt = Math.min((ahora - ultimoTiempo) / 1000, 0.1);
  ultimoTiempo = ahora;

  const factor = 1 - Math.exp(-SUAVIZADO * dt);
  posActualX += (posObjetivoX - posActualX) * factor;
  posActualY += (posObjetivoY - posActualY) * factor;

  pintarLaberinto(ctx, laberinto, posActualX, posActualY);
  requestAnimationFrame(animar);
}

requestAnimationFrame(animar);