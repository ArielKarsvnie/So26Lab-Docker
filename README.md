# Laboratorio de Docker - Sistemas Operativos (FACET - UNT)

Aplicación de prueba: un monitor de recursos.

- `solab-web/`: servidor Node.js (Express + EJS) que muestra el estado del sistema
  visto desde adentro del contenedor (procesos, namespaces, memoria y CPU según cgroups)
  y guarda muestras en MongoDB.
- La base de datos MongoDB no está en este repositorio: se usa la imagen pública `mongo:6`.

## Qué van a completar

En este repositorio hay dos archivos **incompletos y con errores**, a propósito:

- `solab-web/Dockerfile`: tiene huecos marcados con `TODO` y `______`, y además
  errores que no están marcados. Los van a encontrar al construir y al ejecutar.
- `compose.yml`: tiene huecos marcados con `TODO` y un error sin marcar.

Sigan la guía del laboratorio. No se copia y pega: se completa, se prueba y se corrige.

## Datos de la aplicación

| Dato | Valor |
| --- | --- |
| Versión de Node | 22, variante `alpine` |
| Directorio de trabajo en la imagen | `/usr/src/solab-web` |
| Puertos | 3000 (web) y 35729 (recarga automática) |
| Comando de arranque | `npm run dev` |
| Gestor de dependencias | npm, con `package.json` y `package-lock.json` |
| Base de datos | `mongo:6`, con los datos en `/data/db` |
| Nombre de la base en la red | `solab-db`, puerto 27017 |

Variables de entorno de la aplicación (opcionales):

| Variable | Valor por defecto |
| --- | --- |
| `MONGO_HOST` | `solab-db` |
| `MONGO_PORT` | `27017` |
| `MONGO_DB` | `solab` |
| `PORT` | `3000` |
| `LIVERELOAD` | activo (`off` lo desactiva) |
