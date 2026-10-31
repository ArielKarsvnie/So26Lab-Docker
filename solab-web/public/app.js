// Actualiza los medidores y la tabla de procesos cada 2 segundos.
(function () {
  const $ = (id) => document.getElementById(id);

  function bytes(n) {
    if (n === null || n === undefined) return 'sin límite';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (n >= 1024 && i < u.length - 1) {
      n /= 1024;
      i++;
    }
    return n.toFixed(i === 0 ? 0 : 1) + ' ' + u[i];
  }

  function duracion(s) {
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return [h ? h + ' h' : null, m ? m + ' min' : null, (s % 60) + ' s'].filter(Boolean).join(' ');
  }

  function celda(tr, texto, codigo) {
    const td = document.createElement('td');
    if (codigo) {
      const c = document.createElement('code');
      c.textContent = texto;
      td.appendChild(c);
    } else {
      td.textContent = texto;
    }
    tr.appendChild(td);
  }

  function pintar(s) {
    const memBase = s.memoria.limite !== null ? s.memoria.limite : s.host.memTotal;
    const memPct = Math.min(100, (s.memoria.uso / memBase) * 100);
    $('memBarra').style.width = memPct.toFixed(1) + '%';
    $('memTexto').textContent =
      bytes(s.memoria.uso) + ' de ' +
      (s.memoria.limite !== null
        ? bytes(s.memoria.limite) + ' (límite del contenedor)'
        : bytes(s.host.memTotal) + ' (sin límite: memoria total del host)');

    const cpuBase = (s.cpu.limite !== null ? s.cpu.limite : s.host.cpus) * 100;
    $('cpuBarra').style.width = Math.min(100, (s.cpu.porcentaje / cpuBase) * 100).toFixed(1) + '%';
    $('cpuTexto').textContent =
      s.cpu.porcentaje.toFixed(1) + ' % de una CPU · ' +
      (s.cpu.limite !== null
        ? 'límite ' + Number(s.cpu.limite.toFixed(2)) + ' CPU'
        : 'sin límite (' + s.host.cpus + ' CPU del host)');

    $('loadavg').textContent = s.carga.map((n) => n.toFixed(2)).join(' / ');
    $('uptime').textContent = duracion(s.uptimeProceso);
    $('cargaEstado').textContent =
      'Hilos de CPU activos: ' + s.cargaGenerada.hilosCpu +
      ' · Memoria reservada: ' + s.cargaGenerada.memoriaReservadaMB.toFixed(0) + ' MB';

    $('cantProcesos').textContent = s.procesos.length;
    const tbody = $('procesos');
    tbody.textContent = '';
    s.procesos.forEach((p) => {
      const tr = document.createElement('tr');
      celda(tr, p.pid);
      celda(tr, p.ppid);
      celda(tr, p.estado);
      celda(tr, p.cmd, true);
      tbody.appendChild(tr);
    });
  }

  async function actualizar() {
    try {
      const r = await fetch('/api/stats');
      pintar(await r.json());
    } catch (e) {
      // El servidor puede estar reiniciándose: se reintenta en el próximo ciclo.
    }
  }

  document.querySelectorAll('button[data-accion]').forEach((b) => {
    b.addEventListener('click', async () => {
      await fetch(b.dataset.accion, { method: 'POST' });
      actualizar();
    });
  });

  setInterval(actualizar, 2000);
})();
