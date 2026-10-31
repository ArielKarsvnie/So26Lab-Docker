# Argumentos utilizados por docker build
ARG NODE_VERSION=22
# TODO 1: elegir la imagen base (Node en su variante alpine, usando el argumento NODE_VERSION)
FROM ______
# Variables de entorno
ENV NODE_ENV=production
# TODO 2: fijar el directorio de trabajo dentro de la imagen
WORKDIR ______
# Ejecutar los comandos siguientes con un usuario sin privilegios
USER node
# Copiar el proyecto dentro de la imagen
COPY . .
# TODO 3: instalar las dependencias exactas de package-lock.json, incluidas las de desarrollo
RUN ______
# Instalar nodemon globalmente
RUN npm install -g nodemon
# Cambiar el dueño del directorio de trabajo al usuario node
RUN chown -R node /usr/src/solab-web
# TODO 4: documentar los puertos que usa la aplicación
EXPOSE ______
# Iniciar el servidor
CMD ["npm", "run", "devs"]
