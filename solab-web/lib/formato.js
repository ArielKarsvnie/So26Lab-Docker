function bytes(n) {
  if (n === null || n === undefined) return 'sin límite';
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < unidades.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${unidades[i]}`;
}

function duracion(segundos) {
  const s = Math.floor(segundos);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [d ? `${d} d` : null, h ? `${h} h` : null, m ? `${m} min` : null, `${r} s`]
    .filter(Boolean)
    .join(' ');
}

function cpus(n) {
  return n === null || n === undefined ? 'sin límite' : `${Number(n.toFixed(2))} CPU`;
}

function fecha(d) {
  return new Date(d).toLocaleString('es-AR', { timeZone: 'America/Argentina/Tucuman' });
}

module.exports = { bytes, duracion, cpus, fecha };
