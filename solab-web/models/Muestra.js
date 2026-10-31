const mongoose = require('mongoose');

// Una "muestra" es una foto del estado del contenedor en un instante.
const muestraSchema = new mongoose.Schema({
  nota: { type: String, default: '', maxlength: 120 },
  hostname: String,
  pid: Number,
  memUso: Number, // bytes
  memLimite: Number, // bytes; null si no hay límite
  cpuPorcentaje: Number, // % de una CPU
  cpuLimite: Number, // CPUs; null si no hay límite
  procesos: Number,
  creada: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Muestra', muestraSchema);
