
# Smart'n healthy House

## Arranque

```bash
npm ci
npm test
npm run lint
npm run build
npm start
```

El servidor de la casa queda en el puerto 3000. No hace falta MQTT para arrancar ni para correr los tests.

La pila completa, casa y servicios hermanos, arranca con Docker:

```bash
docker compose up --build
```

Puertos publicados: casa 3000, verificacion 3002, auth 3003, clima 3004, asistente 5000. Cada uno responde en `/health`.

Certificados del dispositivo, si vas a usar MQTT, van en `secrets/mqtt.key`, `secrets/mqtt.cert` y `secrets/mqtt.ca`. Esa carpeta no se sube.

## Tests

No hace falta `.env`, ni cuenta de Firebase, AccuWeather, Gemini o MQTT. El cliente MQTT de los tests es un doble en memoria: no hay broker. Un clon limpio alcanza con:

```bash
npm ci
npm test
```

`npm test` ejecuta Jest y el archivo de cookies. `npm run test:coverage` exige al menos 70% de lineas en el dominio, la validacion, los logs, las metricas, auth, el asistente y el clima.

## Variables

Los nombres estan en `.env.example`. Copia ese archivo a `.env` y llena los valores en tu maquina. El ejemplo no trae secretos.

```
PORT=
CORS_ORIGIN=
MQTT_HOST=
MQTT_PORT=
MQTT_PRIVATE_KEY=
MQTT_PRIVATE_KEY_PATH=
MQTT_CERT=
MQTT_CERT_PATH=
MQTT_CA=
MQTT_CA_PATH=
ACCUWEATHER_API_KEY=
GOOGLE_API_KEY=
CONTEXT=
SMTP_USER=
SMTP_PASS=
SMTP_TLS_INSECURE=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

Puertos: casa 3000, verificacion 3002, auth 3003, clima 3004, Gemini 5000.

Como contribuir: `CONTRIBUTING.md`. Cambios: `CHANGELOG.md`.

## Arquitectura

- `API/server/domain` reglas de sensores e incidentes
- `API/server/server.js` HTTP y sockets. MQTT solo si hay certificados
- `API/Gemini/domain` contexto del asistente
- `API/Accuweather` clima
- `WWW/Dashboard/scripts/logic.js` textos del tablero

Una tarea toca un modulo. `npm test` tiene que pasar antes de cerrarla.

El asistente local, si hace falta, arranca con `node API/Gemini/main.js`.

**Cliente:** CSS3 y JavaScript. **Servidor:** Node, Express, Socket.io y MQTT.

La paleta, los avisos de marca y la filosofia visual estan en `DESIGN.md`.
