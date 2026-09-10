// ejecutar-en-node.js — ejecutor de terminal, para el ciclo de desarrollo.
// Uso: node pruebas/ejecutar-en-node.js   (desde campamento-2026/)

import { casos } from "./casos.js";

let pasaron = 0;
let fallaron = 0;
let saltados = 0;

for (const caso of casos) {
  if (caso.entorno === "navegador") {
    saltados += 1;
    console.log(`  ~ ${caso.nombre}  (solo navegador)`);
    continue;
  }
  try {
    await caso.ejecutar();
    pasaron += 1;
    console.log(`  ✓ ${caso.nombre}`);
  } catch (error) {
    fallaron += 1;
    console.log(`  ✗ ${caso.nombre}\n    ${error.message}`);
  }
}

console.log(`\n${pasaron} pasaron, ${fallaron} fallaron, ${saltados} solo navegador`);
process.exit(fallaron > 0 ? 1 : 0);
