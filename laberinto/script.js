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

function moverPersonaje(laberinto, pos, df, dc) {
  const nf = pos.f + df;
  const nc = pos.c + dc;
  const dentro = nf >= 0 && nf < laberinto.length && nc >= 0 && nc < laberinto[0].length;
  if (dentro && laberinto[nf][nc] === 0) return { f: nf, c: nc };
  return pos;
}

// --------------------------------------------------------------------------
// Pieza 3: pintar en isométrico
// --------------------------------------------------------------------------
const ANCHO_TILE = 32;  // ancho del rombo
const ALTO_TILE = 16;   // alto del rombo (la mitad del ancho da el ángulo clásico)
const ALTURA_PARED = 20; // cuánto "sobresale" una pared en vertical
const COLOR_ENTRADA_SALIDA = "#2ecc71";

// Convierte una celda (fila, columna) al punto CENTRAL de su rombo en pantalla,
// ya con el desplazamiento (offsetX/Y) para que todo quepa en el canvas.
function celdaAIsometrico(fila, columna, offsetX, offsetY) {
  return {
    x: (columna - fila) * (ANCHO_TILE / 2) + offsetX,
    y: (columna + fila) * (ALTO_TILE / 2) + offsetY,
  };
}

// Dibuja el rombo plano de una celda (el "suelo")
function pintarSuelo(ctx, cx, cy, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - ALTO_TILE / 2); // punta de arriba
  ctx.lineTo(cx + ANCHO_TILE / 2, cy); // punta derecha
  ctx.lineTo(cx, cy + ALTO_TILE / 2); // punta de abajo
  ctx.lineTo(cx - ANCHO_TILE / 2, cy); // punta izquierda
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.stroke();
}

// Dibuja un "cubo" (pared con altura): tejado + dos caras laterales
function pintarBloque(ctx, cx, cy, colorTejado, colorIzq, colorDer) {
  const top = cy - ALTO_TILE / 2;
  const right = cx + ANCHO_TILE / 2;
  const bottom = cy + ALTO_TILE / 2;
  const left = cx - ANCHO_TILE / 2;

  // Cara izquierda (del punto izquierdo y abajo, hacia arriba ALTURA_PARED)
  ctx.beginPath();
  ctx.moveTo(left, cy);
  ctx.lineTo(cx, bottom);
  ctx.lineTo(cx, bottom - ALTURA_PARED);
  ctx.lineTo(left, cy - ALTURA_PARED);
  ctx.closePath();
  ctx.fillStyle = colorIzq;
  ctx.fill();

  // Cara derecha
  ctx.beginPath();
  ctx.moveTo(right, cy);
  ctx.lineTo(cx, bottom);
  ctx.lineTo(cx, bottom - ALTURA_PARED);
  ctx.lineTo(right, cy - ALTURA_PARED);
  ctx.closePath();
  ctx.fillStyle = colorDer;
  ctx.fill();

  // Tejado (el rombo, desplazado hacia arriba)
  pintarSuelo(ctx, cx, cy - ALTURA_PARED, colorTejado);
}

function pintarLaberinto(ctx, laberinto, entrada, salida, offsetX, offsetY, personajeX, personajeY) {
  // Pintamos en orden de "fila + columna" (de fondo hacia delante), para que
  // los bloques más cercanos a la cámara se dibujen ENCIMA de los lejanos.
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
      pintarBloque(ctx, x, y, "hsl(197, 60%, 55%)", "hsl(197, 60%, 35%)", "hsl(197, 60%, 45%)");
    } else {
      const esEntrada = f === entrada.f && c === entrada.c;
      const esSalida = f === salida.f && c === salida.c;
      const color = (esEntrada || esSalida) ? COLOR_ENTRADA_SALIDA : "#f4f4f4";
      pintarSuelo(ctx, x, y, color);
    }
  }

  // Personaje (ya viene en coordenadas de pantalla, calculado fuera)
  ctx.beginPath();
  ctx.arc(personajeX, personajeY - ALTO_TILE / 2, ANCHO_TILE / 5, 0, Math.PI * 2);
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
const { entrada, salida } = colocarEntradaYSalida(laberinto, personaje);

const canvas = document.getElementById("laberinto");
if (!canvas) {
  throw new Error(
    'No se encontró <canvas id="laberinto">. Revisa el id y que el <script> ' +
    "esté al final del <body> (o tenga el atributo defer)."
  );
}

// El laberinto isométrico ocupa más ancho que alto en pantalla; calculamos
// un tamaño de canvas que le quepa entero, y un offset para centrarlo.
const filas = laberinto.length;
const columnas = laberinto[0].length;
canvas.width = (filas + columnas) * (ANCHO_TILE / 2) + 40;
canvas.height = (filas + columnas) * (ALTO_TILE / 2) + ALTURA_PARED + 40;
const ctx = canvas.getContext("2d");

const offsetX = canvas.width / 2;
const offsetY = 30;

// Posiciones actuales y objetivo en píxeles (coordenadas de pantalla isométricas)
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

  e.preventDefault();

  const [df, dc] = movimiento;
  personaje = moverPersonaje(laberinto, personaje, df, dc);

  const destino = celdaAIsometrico(personaje.f, personaje.c, offsetX, offsetY);
  posObjetivoX = destino.x;
  posObjetivoY = destino.y;

  if (DEBUG) console.log("tecla:", e.code, "→ celda:", personaje);
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

  ctx.clearRect(0, 0, canvas.width, canvas.height); // ahora SÍ hace falta: los bloques no cubren todo el canvas
  pintarLaberinto(ctx, laberinto, entrada, salida, offsetX, offsetY, posActualX, posActualY);
  requestAnimationFrame(animar);
}

requestAnimationFrame(animar);