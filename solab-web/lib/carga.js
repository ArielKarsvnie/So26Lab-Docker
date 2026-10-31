// Generadores de carga para experimentar con los límites del contenedor.
const { Worker } = require('worker_threads');

const MAX_SEGUNDOS = 60;
const MAX_MB = 512;

const hilos = new Set();
let reservas = [];

function limitar(valor, min, max, defecto) {
  const n = Number.parseInt(valor, 10);
  if (!Number.isFinite(n)) return defecto;
  return Math.min(Math.max(n, min), max);
}

// Ocupa una CPU completa durante N segundos en un hilo aparte
// (así el servidor sigue respondiendo).
function cpu(segundos) {
  const s = limitar(segundos, 1, MAX_SEGUNDOS, 10);
  const w = new Worker(`const fin = Date.now() + ${s * 1000}; while (Date.now() < fin) {}`, {
    eval: true,
  });
  hilos.add(w);
  w.on('exit', () => hilos.delete(w));
  return s;
}

// Reserva N MB y los escribe, para que el kernel los cuente como memoria usada.
function memoria(mb) {
  const n = limitar(mb, 1, MAX_MB, 50);
  reservas.push(Buffer.alloc(n * 1024 * 1024, 1));
  return n;
}

function liberar() {
  reservas = [];
  if (global.gc) global.gc();
}

function estado() {
  return {
    hilosCpu: hilos.size,
    memoriaReservadaMB: reservas.reduce((acc, b) => acc + b.length, 0) / 1024 / 1024,
  };
}

module.exports = { cpu, memoria, liberar, estado };
