// Dirección de la base de datos MongoDB.
// El host debe coincidir con el NOMBRE del contenedor (o del servicio de compose)
// de la base de datos, y el puerto con el de MongoDB por defecto (27017).
// Se pueden cambiar con variables de entorno sin tocar el código.
const host = process.env.MONGO_HOST || 'solab-db';
const port = process.env.MONGO_PORT || '27017';
const db = process.env.MONGO_DB || 'solab';

module.exports = {
  mongoHost: host,
  mongoPort: port,
  mongoURI: `mongodb://${host}:${port}/${db}`,
};
