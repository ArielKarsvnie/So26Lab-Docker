# Laboratorio de Docker - Sistemas Operativos (FACET - UNT)

Aplicación de prueba: un monitor de recursos.

- `solab-web/`: servidor Node.js (Express + EJS) que muestra el estado del sistema
  visto desde adentro del contenedor (procesos, namespaces, memoria y CPU según cgroups)
  y guarda muestras en MongoDB.
- La base de datos MongoDB no está en este repositorio: se usa la imagen pública `mongo:6`.

Siga la guía del laboratorio. En este directorio faltan, a propósito, el `Dockerfile`
y el `compose.yml`: los va a escribir usted durante el laboratorio.

Variables de entorno de la aplicación (opcionales):

| Variable | Valor por defecto |
| --- | --- |
| `MONGO_HOST` | `solab-db` |
| `MONGO_PORT` | `27017` |
| `MONGO_DB` | `solab` |
| `PORT` | `3000` |
| `LIVERELOAD` | activo (`off` lo desactiva) |
