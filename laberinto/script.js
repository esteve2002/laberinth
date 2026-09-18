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
// Pieza 3: pintar (ya no depende de nada de lo anterior, solo recibe datos)
// --------------------------------------------------------------------------
function pintarLaberinto(laberinto, personaje) {
  const contenedor = document.getElementById("laberinto");
  contenedor.innerHTML = ""; // limpiar antes de repintar
  const filas = laberinto.length;
  const columnas = laberinto[0].length;

  contenedor.style.gridTemplateColumns = `repeat(${columnas}, 24px)`;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const celda = document.createElement("div");
      celda.classList.add("celda");

      if (personaje && personaje.f === f && personaje.c === c) {
        celda.classList.add("personaje");
      } else {
        celda.classList.add(laberinto[f][c] === 1 ? "pared" : "camino");
      }

      contenedor.appendChild(celda);
    }
  }
}

// --------------------------------------------------------------------------
// Arranque
// --------------------------------------------------------------------------
const laberinto = generarLaberinto(9, 13); // cambia el tamaño a tu gusto
let personaje = colocarPersonajeAleatorio(laberinto);

pintarLaberinto(laberinto, personaje);

setInterval(() => {
  personaje = moverPersonajeAleatorio(laberinto, personaje);
  pintarLaberinto(laberinto, personaje);
}, 30); // cada 400ms se mueve a una celda vecina aleatoria