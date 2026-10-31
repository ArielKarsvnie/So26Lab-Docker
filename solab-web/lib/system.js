// Lee el estado del sistema "desde adentro" del contenedor:
// /proc (procesos y namespaces) y /sys/fs/cgroup (límites y consumo de recursos).
const fs = require('fs');
const os = require('os');
const carga = require('./carga');

function leer(ruta) {
  try {
    return fs.readFileSync(ruta, 'utf8').trim();
  } catch {
    return null;
  }
}

function numero(txt) {
  if (txt === null || txt === 'max') return null;
  const n = Number(txt);
  return Number.isFinite(n) ? n : null;
}

function versionCgroup() {
  if (fs.existsSync('/sys/fs/cgroup/cgroup.controllers')) return 2;
  if (fs.existsSync('/sys/fs/cgroup/memory') || fs.existsSync('/sys/fs/cgroup/cpu')) return 1;
  return 0;
}

// Devuelve límites y consumo según la versión de cgroups del kernel.
function leerCgroup() {
  const version = versionCgroup();
  const r = { version, memLimite: null, memUso: null, cpuLimite: null, cpuUsoUs: null };

  if (version === 2) {
    r.memLimite = numero(leer('/sys/fs/cgroup/memory.max'));
    r.memUso = numero(leer('/sys/fs/cgroup/memory.current'));
    const cpuMax = leer('/sys/fs/cgroup/cpu.max'); // "<cuota> <periodo>" en µs, o "max <periodo>"
    if (cpuMax) {
      const [cuota, periodo] = cpuMax.split(' ');
      if (cuota !== 'max') r.cpuLimite = Number(cuota) / Number(periodo);
    }
    const stat = leer('/sys/fs/cgroup/cpu.stat');
    const m = stat && stat.match(/^usage_usec (\d+)/m);
    if (m) r.cpuUsoUs = Number(m[1]);
  } else if (version === 1) {
    r.memLimite = numero(leer('/sys/fs/cgroup/memory/memory.limit_in_bytes'));
    r.memUso = numero(leer('/sys/fs/cgroup/memory/memory.usage_in_bytes'));
    for (const dir of ['/sys/fs/cgroup/cpu', '/sys/fs/cgroup/cpu,cpuacct']) {
      const cuota = numero(leer(`${dir}/cpu.cfs_quota_us`));
      const periodo = numero(leer(`${dir}/cpu.cfs_period_us`));
      if (cuota !== null && periodo) {
        if (cuota > 0) r.cpuLimite = cuota / periodo;
        break;
      }
    }
    for (const dir of ['/sys/fs/cgroup/cpuacct', '/sys/fs/cgroup/cpu,cpuacct', '/sys/fs/cgroup/cpu']) {
      const ns = numero(leer(`${dir}/cpuacct.usage`));
      if (ns !== null) {
        r.cpuUsoUs = ns / 1000;
        break;
      }
    }
  }

  // Sin límite real, el kernel informa un valor enorme (o "max").
  if (r.memLimite !== null && r.memLimite > 2 ** 60) r.memLimite = null;
  return r;
}

// Porcentaje de CPU entre dos lecturas (100 % = una CPU completa).
let previo = null;
let ultimoPorcentaje = 0;
function cpuPorcentaje(usoUs) {
  // Si no hay cgroup, se usa el consumo de este proceso.
  let uso = usoUs;
  if (uso === null) {
    const c = process.cpuUsage();
    uso = c.user + c.system;
  }
  const ahora = Date.now();
  if (previo && ahora - previo.t >= 500) {
    ultimoPorcentaje = Math.max(0, ((uso - previo.uso) / ((ahora - previo.t) * 1000)) * 100);
    previo = { t: ahora, uso };
  } else if (!previo) {
    previo = { t: ahora, uso };
  }
  return ultimoPorcentaje;
}

// Procesos visibles desde este contenedor (PID namespace propio).
function procesos() {
  const lista = [];
  let entradas = [];
  try {
    entradas = fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d));
  } catch {
    return lista;
  }
  for (const d of entradas) {
    const stat = leer(`/proc/${d}/stat`);
    const m = stat && stat.match(/^(\d+) \((.*)\) (\S) (\d+)/);
    if (!m) continue;
    const cmd = (leer(`/proc/${d}/cmdline`) || '').replace(/\0/g, ' ').trim() || `[${m[2]}]`;
    lista.push({ pid: Number(m[1]), ppid: Number(m[4]), estado: m[3], cmd: cmd.slice(0, 80) });
  }
  return lista.sort((a, b) => a.pid - b.pid).slice(0, 40);
}

function namespaces() {
  const res = {};
  for (const ns of ['pid', 'net', 'mnt', 'uts', 'ipc', 'user', 'cgroup']) {
    try {
      res[ns] = fs.readlinkSync(`/proc/self/ns/${ns}`);
    } catch {
      res[ns] = null;
    }
  }
  return res;
}

function usuario() {
  const uid = process.getuid ? process.getuid() : null;
  const gid = process.getgid ? process.getgid() : null;
  let nombre = null;
  try {
    nombre = os.userInfo().username;
  } catch {
    nombre = null;
  }
  return { uid, gid, nombre };
}

function estadisticas() {
  const cg = leerCgroup();
  const total = os.totalmem();
  const memUso = cg.memUso !== null ? cg.memUso : total - os.freemem();
  const lista = procesos();
  return {
    hostname: os.hostname(),
    enContenedor: fs.existsSync('/.dockerenv'),
    pid: process.pid,
    ppid: process.ppid,
    usuario: usuario(),
    node: process.version,
    uptimeProceso: process.uptime(),
    uptimeSistema: os.uptime(),
    carga: os.loadavg(),
    host: { cpus: os.cpus().length, memTotal: total },
    cgroup: { version: cg.version },
    memoria: { uso: memUso, limite: cg.memLimite },
    cpu: { porcentaje: cpuPorcentaje(cg.cpuUsoUs), limite: cg.cpuLimite },
    namespaces: namespaces(),
    procesos: lista,
    cargaGenerada: carga.estado(),
  };
}

module.exports = { estadisticas };
