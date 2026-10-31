const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const keys = require('./config/keys');
const Muestra = require('./models/Muestra');
const sistema = require('./lib/system');
const carga = require('./lib/carga');
const fmt = require('./lib/formato');

const app = express();
const PORT = process.env.PORT || 3000;
const LIVERELOAD_PORT = 35729;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Con NODE_ENV=production Express guarda las vistas en caché; se desactiva
// para que los cambios en views/*.ejs se vean sin reiniciar el servidor.
app.set('view cache', false);

// Recarga automática del navegador cuando cambian vistas o archivos públicos
// (solo si las dependencias de desarrollo están instaladas).
if (process.env.LIVERELOAD !== 'off') {
  try {
    const livereload = require('livereload');
    const connectLivereload = require('connect-livereload');
    const lrServer = livereload.createServer({ port: LIVERELOAD_PORT, exts: ['ejs', 'css', 'js'] });
    lrServer.watch([path.join(__dirname, 'views'), path.join(__dirname, 'public')]);
    app.use(connectLivereload({ port: LIVERELOAD_PORT }));
    console.log(`Live reload escuchando en el puerto ${LIVERELOAD_PORT}`);
  } catch {
    console.log('Live reload desactivado (dependencias de desarrollo no instaladas)');
  }
}

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Base de datos ----------
mongoose.set('bufferCommands', false); // si no hay conexión, fallar enseguida

async function conectar() {
  try {
    await mongoose.connect(keys.mongoURI, { serverSelectionTimeoutMS: 3000 });
    console.log('Mongodb Connected');
  } catch (err) {
    console.error(`Mongodb no disponible en ${keys.mongoHost}:${keys.mongoPort} (${err.message}). Reintentando en 3 s...`);
    setTimeout(conectar, 3000);
  }
}
conectar();

const dbConectada = () => mongoose.connection.readyState === 1;

// ---------- Páginas ----------
app.get('/', async (req, res) => {
  let muestras = [];
  if (dbConectada()) {
    try {
      muestras = await Muestra.find().sort({ creada: -1 }).limit(20).lean();
    } catch (err) {
      console.error('Error al leer muestras:', err.message);
    }
  }
  res.render('monitor', {
    stats: sistema.estadisticas(),
    muestras,
    db: { conectada: dbConectada(), host: keys.mongoHost, puerto: keys.mongoPort },
    fmt,
  });
});

app.post('/muestras', async (req, res) => {
  if (dbConectada()) {
    const s = sistema.estadisticas();
    try {
      await Muestra.create({
        nota: String(req.body.nota || '').trim().slice(0, 120),
        hostname: s.hostname,
        pid: s.pid,
        memUso: s.memoria.uso,
        memLimite: s.memoria.limite,
        cpuPorcentaje: s.cpu.porcentaje,
        cpuLimite: s.cpu.limite,
        procesos: s.procesos.length,
      });
    } catch (err) {
      console.error('Error al guardar la muestra:', err.message);
    }
  }
  res.redirect('/');
});

app.post('/muestras/borrar', async (req, res) => {
  if (dbConectada()) await Muestra.deleteMany({}).catch((e) => console.error(e.message));
  res.redirect('/');
});

app.post('/muestras/:id/eliminar', async (req, res) => {
  if (dbConectada() && mongoose.isValidObjectId(req.params.id)) {
    await Muestra.findByIdAndDelete(req.params.id).catch((e) => console.error(e.message));
  }
  res.redirect('/');
});

// ---------- API ----------
app.get('/api/stats', (req, res) => {
  res.json({ ...sistema.estadisticas(), db: { conectada: dbConectada() } });
});

app.post('/api/carga/cpu', (req, res) => {
  const segundos = carga.cpu(req.query.segundos);
  res.json({ ok: true, segundos });
});

app.post('/api/carga/memoria', (req, res) => {
  const mb = carga.memoria(req.query.mb);
  res.json({ ok: true, mb });
});

app.post('/api/carga/liberar', (req, res) => {
  carga.liberar();
  res.json({ ok: true });
});

// Para healthchecks: responde 200 aunque la base no esté disponible.
app.get('/salud', (req, res) => {
  res.json({ ok: true, db: dbConectada() });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT} (PID ${process.pid})`);
});
