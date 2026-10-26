require("dotenv").config();
const path = require("path");
const express = require("express");
const bcrypt = require("bcrypt");
const { body, param, validationResult } = require("express-validator");
const { firestore } = require("./firebase");
const { hasRequiredRegisterFields, normalizeLocation, validatePassword } = require("./validation");
const { applyApiDefaults } = require("../../http");
const { validate, readRules } = require("../../validate");
const logger = require("../../log");

function fail(res, error, fallback) {
    const status = error.statusCode || 500;
    res.status(status).json({
        message: status === 503 ? "Firebase no esta configurado" : (error.message || fallback)
    });
}

function rejectInvalid(req, res) {
    const result = validationResult(req);
    if (result.isEmpty()) return false;
    res.status(400).json({ message: result.array()[0].msg });
    return true;
}

const registerRules = [
    body("email").isString().withMessage("email must be a string").bail().trim().notEmpty().withMessage("email is required"),
    body("password").isString().withMessage("password must be a string").bail().notEmpty().withMessage("password is required"),
    body("nombre").isString().withMessage("nombre must be a string").bail().trim().notEmpty().withMessage("nombre is required"),
    body("uid").isString().withMessage("uid must be a string").bail().trim().notEmpty().withMessage("uid is required")
];

const socialRules = [
    body("uid").isString().withMessage("uid must be a string").bail().trim().notEmpty().withMessage("uid is required"),
    body("email").isString().withMessage("email must be a string").bail().trim().notEmpty().withMessage("email is required"),
    body("nombre").isString().withMessage("nombre must be a string").bail().trim().notEmpty().withMessage("nombre is required")
];

const faceRules = [
    body("uid").isString().withMessage("uid must be a string").bail().trim().notEmpty().withMessage("uid is required"),
    body("faceImage").isString().withMessage("faceImage must be a string").bail().notEmpty().withMessage("faceImage is required")
];

const uidRule = param("uid").isString().bail().trim().notEmpty().withMessage("uid is required");

async function defaultLocate() {
    const response = await fetch("https://ipapi.co/json/");
    const locationData = await response.json();
    return {
        country: locationData.country_name || "",
        state: locationData.region || "",
        city: locationData.city || ""
    };
}

function createAuthApp(options = {}) {
    const database = options.database || firestore;
    const locate = options.locate || defaultLocate;
    const app = express();

    applyApiDefaults(app, {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"],
        credentials: true
    });
    app.get("/health", readRules, (req, res) => {
        if (rejectInvalid(req, res)) return;
        res.json({ ok: true });
    });

    app.use(express.static(path.join(__dirname, "..", "sign-in")));

    app.post("/register", registerRules, async (req, res) => {
        try {
            if (rejectInvalid(req, res)) return;
            const check = validate(req.body, {
                email: { required: true, type: "string" },
                password: { required: true, type: "string" },
                nombre: { required: true, type: "string" },
                uid: { required: true, type: "string" }
            });
            if (!check.ok) {
                return res.status(400).json({ message: check.errors[0] });
            }

            const { email, password, nombre, uid, location } = req.body;

            if (!hasRequiredRegisterFields({ email, password, nombre, uid })) {
                return res.status(400).json({
                    message: "Todos los campos son requeridos"
                });
            }

            if (!validatePassword(password)) {
                return res.status(400).json({
                    message: "La contraseña debe tener 8 caracteres, una mayúscula, un número y un símbolo"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await database().collection("Users").doc(uid).set({
                Email: email,
                Password: hashedPassword,
                Nombre: nombre,
                IsAdmin: true,
                IsDeveloper: false,
                Device: "",
                DeviceSN: "",
                UserImg: "",
                faceData: null,
                lastFaceUpdate: null,
                location: normalizeLocation(location),
                createdAt: new Date().toISOString()
            });

            res.status(201).json({
                message: "Usuario registrado correctamente",
                id: uid
            });
        } catch (err) {
            logger.error("register failed", { error: err.message });
            fail(res, err, "Error al registrar usuario");
        }
    });

    app.post("/social-auth", socialRules, async (req, res) => {
        try {
            if (rejectInvalid(req, res)) return;
            const check = validate(req.body, {
                uid: { required: true, type: "string" },
                email: { required: true, type: "string" },
                nombre: { required: true, type: "string" }
            });
            if (!check.ok) {
                return res.status(400).json({ message: check.errors[0] });
            }

            const { uid, email, nombre, photoURL } = req.body;
            const usersRef = database().collection("Users");

            let location = { country: "", state: "", city: "" };
            try {
                location = normalizeLocation(await locate());
            } catch (error) {
                logger.error("location lookup failed", { error: error.message });
            }

            const userDoc = await usersRef.doc(uid).get();

            if (!userDoc.exists) {
                await usersRef.doc(uid).set({
                    Email: email,
                    Nombre: nombre,
                    IsAdmin: true,
                    IsDeveloper: false,
                    Device: "",
                    DeviceSN: "",
                    Sensors: [],
                    battery: "",
                    UserImg: photoURL || "",
                    location,
                    createdAt: new Date().toISOString()
                });
            }

            res.status(200).json({
                message: "Login exitoso",
                id: uid
            });
        } catch (err) {
            logger.error("social auth failed", { error: err.message });
            res.status(err.statusCode || 500).json({
                message: err.statusCode === 503 ? "Firebase no esta configurado" : "Error en autenticación"
            });
        }
    });

    app.get("/verify-user/:uid", uidRule, async (req, res) => {
        try {
            if (rejectInvalid(req, res)) return;
            const { uid } = req.params;
            const userDoc = await database().collection("Users").doc(uid).get();

            res.json({
                exists: userDoc.exists
            });
        } catch (error) {
            logger.error("verify user failed", { error: error.message });
            res.status(error.statusCode || 500).json({
                message: error.statusCode === 503 ? "Firebase no esta configurado" : "Error verificando usuario",
                exists: false
            });
        }
    });

    app.post("/save-face-data", faceRules, async (req, res) => {
        try {
            if (rejectInvalid(req, res)) return;
            const check = validate(req.body, {
                uid: { required: true, type: "string" },
                faceImage: { required: true, type: "string" }
            });
            if (!check.ok) {
                return res.status(400).json({ success: false, message: check.errors[0] });
            }

            const { uid, faceImage, faceData } = req.body;

            if (!uid || !faceImage) {
                return res.status(400).json({
                    success: false,
                    message: "Datos incompletos"
                });
            }

            const userRef = database().collection("Users").doc(uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: "Usuario no encontrado"
                });
            }

            await userRef.update({
                UserImg: faceImage,
                faceData: faceData,
                lastFaceUpdate: new Date().toISOString()
            });

            res.json({
                success: true,
                message: "Datos faciales guardados correctamente"
            });
        } catch (error) {
            logger.error("save face data failed", { error: error.message });
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.statusCode === 503 ? "Firebase no esta configurado" : "Error al guardar datos faciales"
            });
        }
    });

    app.get("/config", readRules, (req, res) => {
        if (rejectInvalid(req, res)) return;
        res.json({
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        });
    });

    return app;
}

const app = createAuthApp();
const PORT = Number(process.env.PORT || 3003);
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info("auth server listening", { port: PORT });
    });
}

module.exports = { app, createAuthApp };
