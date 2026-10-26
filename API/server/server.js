const mqtt = require("mqtt");
const express = require("express");
const http = require("http");
const path = require("path");
const rateLimit = require("express-rate-limit");
const socketIo = require("socket.io");
const { normalizeSensorPayload } = require("./domain/sensors");
const {
    isToday,
    filterIncidentsForToday,
    incidentFromHttp,
    incidentFromSocket,
    incidentFromMqtt
} = require("./domain/incidents");
const { loadMqttCredentials } = require("./credentials");
const { applyApiDefaults } = require("./http");
const { incidentRules, rejectValidation } = require("./validate");
const logger = require("./log");
const metrics = require("./metrics");

const PORT = Number(process.env.PORT || 3000);
const MQTT_TOPICS = ["testeo", "/testeo", "esp32/sensor", "/report-incident"];

function createState() {
    return {
        sensorData: {
            temperatura: null,
            humedad: null,
            lastUpdate: null
        },
        systemStatus: {
            api: { status: "Funcionando", lastCheck: new Date(), responseTime: "200ms" },
            database: { status: "Funcionando", lastCheck: new Date(), connections: 0 },
            sensors: { status: "Funcionando", activeSensors: 0, lastUpdate: new Date() },
            incidents: [],
            lastCleanup: new Date()
        }
    };
}

function assertIncidentObject(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        const error = new Error("Incident body must be an object");
        error.statusCode = 400;
        throw error;
    }
}

function createHouseApp() {
    const state = createState();
    const app = express();
    const server = http.createServer(app);
    const io = socketIo(server, {
        cors: { origin: process.env.CORS_ORIGIN || "*", methods: ["GET", "POST"] },
        transports: ["websocket", "polling"]
    });

    applyApiDefaults(app);
    app.use(rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true }));
    app.use(express.static(path.join(__dirname, "..", "..", "WWW", "Dashboard")));

    function cleanOldIncidents() {
        state.systemStatus.incidents = filterIncidentsForToday(state.systemStatus.incidents);
    }

    let mqttState = "disabled";

    function runtime() {
        return metrics.snapshot({ sockets: io.sockets.sockets.size, mqtt: mqttState });
    }

    app.get("/health", (req, res) => {
        res.json({ ok: true, ...runtime() });
    });

    app.get("/metrics", (req, res) => {
        res.json(runtime());
    });

    app.get("/status", (req, res) => {
        const now = new Date();
        if (!isToday(state.systemStatus.lastCleanup, now)) {
            cleanOldIncidents();
            state.systemStatus.lastCleanup = now;
        }

        state.systemStatus.database.connections = io.sockets.sockets.size;
        state.systemStatus.sensors.activeSensors = Number.isFinite(state.sensorData.temperatura) ? 1 : 0;
        state.systemStatus.sensors.lastUpdate = state.sensorData.lastUpdate;
        res.json(state.systemStatus);
    });

    app.post("/report-incident", incidentRules, (req, res) => {
        if (rejectValidation(req, res)) return;
        try {
            assertIncidentObject(req.body);
            const incident = incidentFromHttp(req.body);
            state.systemStatus.incidents.unshift(incident);
            io.emit("newIncident", incident);
            res.json({ success: true, incident });
        } catch (error) {
            metrics.fail();
            logger.error("report-incident failed", { error: error.message });
            res.status(error.statusCode || 500).json({ success: false, error: error.message });
        }
    });

    app.post("/clear-incidents", (req, res) => {
        state.systemStatus.incidents = [];
        state.systemStatus.lastCleanup = new Date();
        io.emit("incidentsCleared");
        res.status(200).json({
            success: true,
            message: "Todos los incidentes han sido eliminados"
        });
    });

    io.on("connection", (socket) => {
        socket.emit("getStatus", state.systemStatus);

        socket.on("publish", ({ topic, message } = {}) => {
            if (topic !== "/report-incident") return;
            try {
                const incident = JSON.parse(message);
                assertIncidentObject(incident);
                const formattedIncident = incidentFromSocket(incident);
                state.systemStatus.incidents.unshift(formattedIncident);
                io.emit("newIncident", formattedIncident);
            } catch (error) {
                metrics.fail();
                logger.error("socket incident failed", { error: error.message });
            }
        });
    });

    return {
        app,
        server,
        io,
        state,
        cleanOldIncidents,
        setMqtt(next) {
            mqttState = next;
            metrics.setMqtt(next);
        }
    };
}

function attachMqtt(house, credentials, connect = mqtt.connect) {
    const client = connect({
        clientId: `api_${Math.random().toString(16).slice(2, 8)}`,
        host: credentials.host,
        port: credentials.port,
        protocol: "mqtts",
        key: credentials.key,
        cert: credentials.cert,
        ca: credentials.ca,
        rejectUnauthorized: true,
        keepalive: 60,
        reconnectPeriod: 5000
    });

    house.setMqtt("connecting");

    client.on("connect", () => {
        house.setMqtt("connected");
        MQTT_TOPICS.forEach((topic) => {
            client.subscribe(topic, (err) => {
                if (err) logger.error("mqtt subscribe failed", { topic, error: err.message });
            });
        });
    });

    client.on("error", (error) => {
        house.setMqtt("error");
        logger.error("mqtt client failed", { error: error.message });
    });

    client.on("close", () => {
        house.setMqtt("closed");
    });

    client.on("message", (topic, message) => {
        if (topic === "/report-incident") {
            try {
                const incident = JSON.parse(message.toString());
                assertIncidentObject(incident);
                const formattedIncident = incidentFromMqtt(incident);
                house.state.systemStatus.incidents.unshift(formattedIncident);
                house.io.emit("newIncident", formattedIncident);
            } catch (error) {
                metrics.fail();
                logger.error("mqtt incident failed", { error: error.message });
            }
            return;
        }

        try {
            const parsed = normalizeSensorPayload(topic, message.toString());
            house.state.sensorData = parsed.sensorData;
            house.io.emit("sensorUpdate", parsed.dashboardData);
        } catch (error) {
            metrics.fail();
            logger.error("mqtt message failed", { error: error.message });
        }
    });

    return client;
}

function scheduleCleanup(house) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timer = setTimeout(() => {
        house.cleanOldIncidents();
        house.state.systemStatus.lastCleanup = new Date();
        scheduleCleanup(house);
    }, tomorrow - now);
    timer.unref();
}

function startHouseServer() {
    const house = createHouseApp();
    const credentials = loadMqttCredentials();
    const client = credentials ? attachMqtt(house, credentials) : null;
    if (!client) {
        logger.info("MQTT disabled. Add secrets/mqtt.key, mqtt.cert and mqtt.ca, or set the MQTT_* variables.");
    }

    scheduleCleanup(house);

    let shuttingDown = false;
    function shutdown(signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info("closing the house server", { signal });
        if (client) client.end(false);
        house.io.close();
        house.server.close(() => process.exit(0));
        setTimeout(() => process.exit(1), 10000).unref();
    }

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));

    house.server.listen(PORT, () => {
        logger.info("house server listening", { port: PORT });
    });

    return house;
}

if (require.main === module) {
    startHouseServer();
}

module.exports = { createHouseApp, attachMqtt, startHouseServer };
