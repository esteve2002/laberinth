// 0 = camino, 1 = pared, 2 = personaje

// --------------------------------------------------------------------------
// Pieza 1: generación aleatoria del laberinto (DFS con backtracking)
// --------------------------------------------------------------------------
function generarLaberinto(filas, columnas) {
  // Usamos tamaño impar: así cada celda de camino queda separada de la
  // siguiente por exactamente una pared, que es el patrón clásico de laberinto
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
// Pieza 2: colocar y mover al personaje (2) aleatoriamente por los caminos
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

function pintarLaberinto(ctx, laberinto, personaje) {
  const filas = laberinto.length;
  const columnas = laberinto[0].length;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const x = c * TAMANO_CELDA;
      const y = f * TAMANO_CELDA;

      if (laberinto[f][c] === 1) {
        ctx.fillStyle = "hsla(0, 0%, 17%, 0.41)"; // pared
      } else {
        ctx.fillStyle = "#f4f4f4"; // camino
      }
      ctx.fillRect(x, y, TAMANO_CELDA, TAMANO_CELDA);
    }
  }

  // Personaje (círculo en vez de cuadrado, se ve mejor)
  const cx = personaje.c * TAMANO_CELDA + TAMANO_CELDA / 2;
  const cy = personaje.f * TAMANO_CELDA + TAMANO_CELDA / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, TAMANO_CELDA / 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#e63946";
  ctx.fill();
}

// --------------------------------------------------------------------------
// Arranque
// --------------------------------------------------------------------------
const laberinto = generarLaberinto(9, 13);
let personaje = colocarPersonajeAleatorio(laberinto);

const canvas = document.getElementById("laberinto");
canvas.width = laberinto[0].length * TAMANO_CELDA;
canvas.height = laberinto.length * TAMANO_CELDA;
const ctx = canvas.getContext("2d");

// DETERMINAMOS LAS POCICIONES ACTUALES EN PIXELES


let posActualX = personaje.c * TAMANO_CELDA + TAMANO_CELDA / 2;
let posActualY = personaje.f * TAMANO_CELDA + TAMANO_CELDA / 2;

// Posición objetivo en píxeles (hacia donde se está moviendo)
let posObjetivoX = posActualX;
let posObjetivoY = posActualY;

const VELOCIDAD = 0.08; // 0 = no se mueve, 1 = movimiento instantáneo. Ajusta a tu gusto

function actualizarObjetivo() {
  personaje = moverPersonajeAleatorio(laberinto, personaje);
  posObjetivoX = personaje.c * TAMANO_CELDA + TAMANO_CELDA / 2;
  posObjetivoY = personaje.f * TAMANO_CELDA + TAMANO_CELDA / 2;
}

function animar() {
  // Interpola suavemente hacia el objetivo
  posActualX += (posObjetivoX - posActualX) * VELOCIDAD;
  posActualY += (posObjetivoY - posActualY) * VELOCIDAD;

  pintarLaberinto(ctx, laberinto, posActualX, posActualY);
  requestAnimationFrame(animar);
}

animar(); // arranca el bucle de dibujado suave

setInterval(actualizarObjetivo, 400); // cada 400ms decide la SIGUIENTE celda destino