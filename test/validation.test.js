const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { createHouseApp } = require("../API/server/server");
const { createAuthApp } = require("../API/server/auth0/server/server");
const {
    validatePassword,
    hasRequiredRegisterFields,
    normalizeLocation
} = require("../API/server/auth0/server/validation");

const specials = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", ",", ".", "?", "\"", ":", "{", "}", "|", "<", ">"];
const rejectedSpecials = ["~", "`", "-", "_", "=", "+", "[", "]", "\\", ";", "'", "/", " "];

test("password accepts only the required mix", () => {
    assert.equal(validatePassword("Abcdef1!"), true);
    assert.equal(validatePassword("Abcdef1"), false);
    assert.equal(validatePassword("abcdef1!"), false);
    assert.equal(validatePassword("Abcdefg!"), false);
    assert.equal(validatePassword("Abcde1!"), false);
    assert.equal(validatePassword("Ábcdef1"), false);
    assert.equal(validatePassword(`Abcdef1${"x".repeat(400)}!`), true);

    for (const symbol of specials) {
        assert.equal(validatePassword(`Abcdef1${symbol}`), true, symbol);
    }

    for (const symbol of rejectedSpecials) {
        assert.equal(validatePassword(`Abcdef1${symbol}`), false, symbol);
    }
});

test("password rejects empty and non strings by the current rules", () => {
    assert.equal(validatePassword(""), false);
    assert.equal(validatePassword("12345678"), false);
    assert.equal(validatePassword("AAAAAAAA"), false);
    assert.equal(hasRequiredRegisterFields({
        email: "a@b.com",
        password: "secret",
        nombre: "Ana",
        uid: "uid-1"
    }), true);

    for (const missing of ["email", "password", "nombre", "uid"]) {
        const fields = {
            email: "a@b.com",
            password: "secret",
            nombre: "Ana",
            uid: "uid-1",
            [missing]: ""
        };
        assert.equal(hasRequiredRegisterFields(fields), false);
    }
});

test("location fills missing pieces with empty strings", () => {
    assert.deepEqual(normalizeLocation(undefined), { country: "", state: "", city: "" });
    assert.deepEqual(normalizeLocation(null), { country: "", state: "", city: "" });
    assert.deepEqual(normalizeLocation({ country: "MX" }), { country: "MX", state: "", city: "" });
    assert.deepEqual(normalizeLocation({
        country: "MX",
        state: "Jalisco",
        city: "Guadalajara",
        extra: "ignore"
    }), {
        country: "MX",
        state: "Jalisco",
        city: "Guadalajara"
    });
});

test("auth reads reject a detail query that is not boolean", async () => {
    const app = createAuthApp({ database() { throw new Error("unused"); } });
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    try {
        const base = `http://127.0.0.1:${server.address().port}`;
        for (const path of ["/health", "/config"]) {
            const rejected = await fetch(`${base}${path}?detail=nope`);
            assert.equal(rejected.status, 400, path);
            const accepted = await fetch(`${base}${path}`);
            assert.equal(accepted.status, 200, path);
        }
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test("house reads reject a detail query that is not boolean", async () => {
    const house = createHouseApp();
    await new Promise((resolve) => house.server.listen(0, "127.0.0.1", resolve));
    try {
        const base = `http://127.0.0.1:${house.server.address().port}`;
        for (const path of ["/health", "/metrics", "/status"]) {
            const rejected = await fetch(`${base}${path}?detail=nope`);
            assert.equal(rejected.status, 400, path);
            const accepted = await fetch(`${base}${path}`);
            assert.equal(accepted.status, 200, path);
        }
        const detailed = await fetch(`${base}/health?detail=true`);
        assert.equal(detailed.status, 200);
        assert.equal((await detailed.json()).ok, true);
    } finally {
        house.io.close();
        await new Promise((resolve) => house.server.close(resolve));
    }
});

test("clear-incidents rejects a body that is not an object", async () => {
    const house = createHouseApp();
    await new Promise((resolve) => house.server.listen(0, "127.0.0.1", resolve));
    try {
        const base = `http://127.0.0.1:${house.server.address().port}`;
        const rejected = await fetch(`${base}/clear-incidents`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "[]"
        });
        assert.equal(rejected.status, 400);
        const body = await rejected.json();
        assert.equal(body.success, false);

        const accepted = await fetch(`${base}/clear-incidents`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}"
        });
        assert.equal(accepted.status, 200);
        assert.equal((await accepted.json()).success, true);
    } finally {
        house.io.close();
        await new Promise((resolve) => house.server.close(resolve));
    }
});
