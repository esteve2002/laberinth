// 0 = camino, 1 = pared (el personaje se dibuja aparte, no forma parte de la matriz)

const DEBUG = true; // ponlo en false cuando ya funcione

// --------------------------------------------------------------------------
// Pieza 1: generación aleatoria del laberinto (DFS con backtracking)
// --------------------------------------------------------------------------
function generarLaberinto(filas, columnas) {
  // Tamaño impar: cada celda de camino queda separada de la siguiente
  // por exactamente una pared, que es el patrón clásico de laberinto
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

    // Nos movemos de 2 en 2 para dejar siempre una pared entre celdas
    const direcciones = mezclar([[-2, 0], [2, 0], [0, -2], [0, 2]]);

    for (const [df, dc] of direcciones) {
      const nf = f + df;
      const nc = c + dc;
      if (esValida(nf, nc) && laberinto[nf][nc] === 1) {
        laberinto[f + df / 2][c + dc / 2] = 0; // rompe la pared intermedia
        excavar(nf, nc);
      }
    }
  }

  excavar(1, 1);
  return laberinto;
}

// --------------------------------------------------------------------------
// Pieza 2: colocar y mover al personaje aleatoriamente por los caminos
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

function moverPersonajeAleatorio(laberinto, pos) {
  const vecinos = [
    { f: pos.f - 1, c: pos.c },
    { f: pos.f + 1, c: pos.c },
    { f: pos.f, c: pos.c - 1 },
    { f: pos.f, c: pos.c + 1 },
  ].filter(({ f, c }) =>
    f >= 0 && f < laberinto.length &&
    c >= 0 && c < laberinto[0].length &&
    laberinto[f][c] === 0
  );

  if (vecinos.length === 0) return pos; // no puede moverse, se queda quieto
  return vecinos[Math.floor(Math.random() * vecinos.length)];
}

// --------------------------------------------------------------------------
// Pieza 3: pintar con canvas
// --------------------------------------------------------------------------
const TAMANO_CELDA = 24;

// Convierte una celda (fila/columna) al centro de esa celda en píxeles
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

  // Personaje: ya viene en píxeles
  ctx.beginPath();
  ctx.arc(personajeX, personajeY, TAMANO_CELDA / 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#e63946";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#7a0f19"; // borde oscuro para que destaque sobre el camino
  ctx.stroke();
}

// --------------------------------------------------------------------------
// Arranque
// --------------------------------------------------------------------------
const laberinto = generarLaberinto(9, 13);
let personaje = colocarPersonajeAleatorio(laberinto);

const canvas = document.getElementById("laberinto");
if (!canvas) {
  // Falla con un mensaje claro en vez de un error críptico más abajo
  throw new Error(
    'No se encontró <canvas id="laberinto">. Revisa el id y que el <script> ' +
    "esté al final del <body> (o tenga el atributo defer)."
  );
}
canvas.width = laberinto[0].length * TAMANO_CELDA;
canvas.height = laberinto.length * TAMANO_CELDA;
const ctx = canvas.getContext("2d");

// Posiciones actuales en píxeles
const inicio = centroCelda(personaje.f, personaje.c);
let posActualX = inicio.x;
let posActualY = inicio.y;

// Posición objetivo en píxeles (hacia donde se está moviendo)
let posObjetivoX = posActualX;
let posObjetivoY = posActualY;

if (DEBUG) {
  console.log("canvas:", canvas.width + "x" + canvas.height, "ctx:", ctx);
  console.log("personaje inicial (celda):", personaje, "→ px:", posActualX, posActualY);
}

// Cuánto de rápido "persigue" al objetivo. Mayor = más rápido.
// Con 8, en 400 ms recorre ~96% del camino, independientemente de los FPS.
const SUAVIZADO = 8;

function actualizarObjetivo() {
  personaje = moverPersonajeAleatorio(laberinto, personaje);
  const destino = centroCelda(personaje.f, personaje.c);
  posObjetivoX = destino.x;
  posObjetivoY = destino.y;
}

let ultimoTiempo = performance.now();
let frame = 0;

function animar(ahora) {
  // Tiempo real entre fotogramas (en segundos), con tope por si se pausa la pestaña
  const dt = Math.min((ahora - ultimoTiempo) / 1000, 0.1);
  ultimoTiempo = ahora;

  // Interpolación suave que va igual a 60 Hz que a 144 Hz
  const factor = 1 - Math.exp(-SUAVIZADO * dt);
  posActualX += (posObjetivoX - posActualX) * factor;
  posActualY += (posObjetivoY - posActualY) * factor;

  if (DEBUG && frame++ % 60 === 0) {
    console.log("animar:", posActualX.toFixed(1), posActualY.toFixed(1));
    if (Number.isNaN(posActualX) || Number.isNaN(posActualY)) {
      console.error("¡Posición NaN! Revisa los cálculos de posición.");
    }
  }

  pintarLaberinto(ctx, laberinto, posActualX, posActualY);
  requestAnimationFrame(animar);
}

requestAnimationFrame(animar); // arranca el bucle de dibujado suave

setInterval(actualizarObjetivo, 400); // cada 400 ms decide la SIGUIENTE celda destino