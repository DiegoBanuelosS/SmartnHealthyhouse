# Changelog

## 1.3.1

- El servidor de la casa acepta un cliente MQTT inyectado. Los tests cubren sensores, incidentes y el estado de conexion sin broker.

## 1.3.0

- La suite corre con Jest. `npm test` no necesita `.env` ni cuentas externas.
- Auth acepta un Firestore en memoria para registro, login social y datos faciales.
- El clima recibe un cliente HTTP inyectado y la cobertura incluye auth, asistente y clima.
- El tablero parsea los mensajes de socket en un modulo propio y deja de usar `console.log`.
- TypeScript queda en 5.9.3 y ESLint en 9.39.5.

## 1.2.0

- Gas, fuego e inundacion cuentan como alerta y suben el estado a critico.
- `/health` informa uptime, sockets y el estado de MQTT.
- Logs JSON via pino.
- Auth arranca sin Firebase y responde 503 hasta que esten las credenciales.
- Verificacion, clima y asistente exponen `/health` y Compose los levanta junto a la casa.

## 1.1.0

- Logs en JSON, contador en `/metrics` y validacion de los POST.
- `main.js` y `status.js` partidos para bajar de 500 lineas.
- Cobertura, typecheck, auditoria y build de imagen en CI.
- Compose para levantar el servidor de la casa.
- `bcryptjs`, `firebase` de cliente y el paquete `crypto` salen de las dependencias.
