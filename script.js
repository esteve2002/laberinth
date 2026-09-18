// 0 = camino, 1 = pared — matriz fija de momento, sin generar nada aún
const matriz = [
  [0, 0, 0, 1, 0],
  [1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0],
];

function pintarLaberinto(matriz) {
  const contenedor = document.getElementById("laberinto");
  const filas = matriz.length;
  const columnas = matriz[0].length;

  contenedor.style.gridTemplateColumns = `repeat(${columnas}, 24px)`;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const celda = document.createElement("div");
      celda.classList.add("celda");
      celda.classList.add(matriz[f][c] === 1 ? "pared" : "camino");
      contenedor.appendChild(celda);
    }
  }
}

pintarLaberinto(matriz);